package db

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type SystemFlag struct {
	Username string `gorm:"primaryKey"`
	SF       string `gorm:"type:text;not null"`
}

type SaveSlot struct {
	Username string         `gorm:"primaryKey"`
	SlotID   string         `gorm:"primaryKey"`
	SaveData string         `gorm:"type:text;not null"`
	Progress []SaveProgress `gorm:"foreignKey:Username,SlotID;references:Username,SlotID;constraint:OnDelete:CASCADE"`
}

type SaveProgress struct {
	Username     string `gorm:"primaryKey"`
	SlotID       string `gorm:"primaryKey"`
	EntryIndex   int    `gorm:"primaryKey"`
	ScenarioName string `gorm:"not null"`
	Pointer      int    `gorm:"not null"`
	SpeakerJP    string
	SpeakerEN    string
	TextJP       string
	TextEN       string
	Voice        string
	Snapshot     string
}

var DB *gorm.DB

func InitDB(dbPath string) error {
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return err
	}

	return DB.AutoMigrate(&SystemFlag{}, &SaveSlot{}, &SaveProgress{})
}

func LoadStateFromDB(username string) (map[string]interface{}, map[string]interface{}, error) {
	sf := make(map[string]interface{})
	slots := make(map[string]interface{})

	// Load sf
	var sysFlag SystemFlag
	err := DB.Where("username = ?", username).First(&sysFlag).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, err
	}
	if sysFlag.SF != "" {
		if err := json.Unmarshal([]byte(sysFlag.SF), &sf); err != nil {
			return nil, nil, fmt.Errorf("failed to unmarshal system flags: %w", err)
		}
	}

	// Load slots
	var dbSlots []SaveSlot
	if err := DB.Where("username = ?", username).Find(&dbSlots).Error; err != nil {
		return nil, nil, err
	}

	for _, s := range dbSlots {
		var slotMap map[string]interface{}
		if err := json.Unmarshal([]byte(s.SaveData), &slotMap); err != nil {
			return nil, nil, fmt.Errorf("failed to unmarshal save slot %s: %w", s.SlotID, err)
		}
		slotMap["historyLog"] = []interface{}{}
		slots[s.SlotID] = slotMap
	}

	// Load all save progress records sorted by entry index
	var progressRecords []SaveProgress
	if err := DB.Where("username = ?", username).Order("slot_id, entry_index asc").Find(&progressRecords).Error; err == nil {
		for _, rec := range progressRecords {
			entryMap := map[string]interface{}{
				"currentScenario": rec.ScenarioName,
				"pointer":         rec.Pointer,
				"speakerJp":       rec.SpeakerJP,
				"speakerEn":       rec.SpeakerEN,
				"textJp":          rec.TextJP,
				"textEn":          rec.TextEN,
				"voice":           nil,
				"snapshot":        nil,
			}
			if rec.Voice != "" {
				entryMap["voice"] = rec.Voice
			}
			if rec.Snapshot != "" {
				var snapMap map[string]interface{}
				if err := json.Unmarshal([]byte(rec.Snapshot), &snapMap); err == nil {
					entryMap["snapshot"] = snapMap
				}
			}

			if slotVal, ok := slots[rec.SlotID]; ok {
				if m, ok := slotVal.(map[string]interface{}); ok {
					if hist, ok := m["historyLog"].([]interface{}); ok {
						m["historyLog"] = append(hist, entryMap)
					}
				}
			}
		}
	}

	return sf, slots, nil
}

func SaveSlotToDB(username string, slotID string, saveData map[string]interface{}, historyLog []interface{}) error {
	dataJSON, err := json.Marshal(saveData)
	if err != nil {
		return fmt.Errorf("failed to encode slot metadata: %w", err)
	}

	return DB.Transaction(func(tx *gorm.DB) error {
		// Save base slot metadata
		saveSlot := SaveSlot{
			Username: username,
			SlotID:   slotID,
			SaveData: string(dataJSON),
		}
		if err := tx.Save(&saveSlot).Error; err != nil {
			return err
		}

		// Delete old progress backlogs
		if err := tx.Where("username = ? AND slot_id = ?", username, slotID).Delete(&SaveProgress{}).Error; err != nil {
			return err
		}

		// Insert new progress backlog entries
		for idx, item := range historyLog {
			itemMap, ok := item.(map[string]interface{})
			if !ok {
				continue
			}

			scenName, _ := itemMap["currentScenario"].(string)
			ptrVal := 0
			if pFloat, ok := itemMap["pointer"].(float64); ok {
				ptrVal = int(pFloat)
			} else if pInt, ok := itemMap["pointer"].(int); ok {
				ptrVal = pInt
			}

			spJp, _ := itemMap["speakerJp"].(string)
			spEn, _ := itemMap["speakerEn"].(string)
			txtJp, _ := itemMap["textJp"].(string)
			txtEn, _ := itemMap["textEn"].(string)

			var voiceStr string
			if v, ok := itemMap["voice"]; ok && v != nil {
				voiceStr, _ = v.(string)
			}

			var snapStr string
			if snap, ok := itemMap["snapshot"]; ok && snap != nil {
				snapJSON, err := json.Marshal(snap)
				if err == nil {
					snapStr = string(snapJSON)
				}
			}

			rec := SaveProgress{
				Username:     username,
				SlotID:       slotID,
				EntryIndex:   idx,
				ScenarioName: scenName,
				Pointer:      ptrVal,
				SpeakerJP:    spJp,
				SpeakerEN:    spEn,
				TextJP:       txtJp,
				TextEN:       txtEn,
				Voice:        voiceStr,
				Snapshot:     snapStr,
			}
			if err := tx.Create(&rec).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func SaveSFToDB(username string, sf map[string]interface{}) error {
	sfJSON, err := json.Marshal(sf)
	if err != nil {
		return fmt.Errorf("failed to encode system flags: %w", err)
	}

	sysFlag := SystemFlag{
		Username: username,
		SF:       string(sfJSON),
	}
	return DB.Save(&sysFlag).Error
}

func MigrateFromJSON(savesJSONPath string, backupPath string) error {
	data, err := os.ReadFile(savesJSONPath)
	if err != nil {
		return fmt.Errorf("failed to read json file: %w", err)
	}

	type LegacySaveState struct {
		SF    map[string]interface{} `json:"sf"`
		Slots map[string]interface{} `json:"slots"`
	}

	var state LegacySaveState
	if err := json.Unmarshal(data, &state); err != nil {
		return fmt.Errorf("failed to parse json file: %w", err)
	}

	err = DB.Transaction(func(tx *gorm.DB) error {
		// Migrate sf
		if state.SF != nil {
			sfJSON, err := json.Marshal(state.SF)
			if err != nil {
				return err
			}
			sfFlag := SystemFlag{
				Username: "default",
				SF:       string(sfJSON),
			}
			if err := tx.Save(&sfFlag).Error; err != nil {
				return err
			}
		}

		// Migrate slots
		if state.Slots != nil {
			for slotID, slotData := range state.Slots {
				slotMap, ok := slotData.(map[string]interface{})
				if !ok {
					continue
				}

				// Extract historyLog
				var historyLog []interface{}
				if histVal, ok := slotMap["historyLog"]; ok {
					if histList, ok := histVal.([]interface{}); ok {
						historyLog = histList
					}
				}

				// Remove historyLog from metadata
				metadataMap := make(map[string]interface{})
				for k, v := range slotMap {
					if k != "historyLog" {
						metadataMap[k] = v
					}
				}

				slotJSON, err := json.Marshal(metadataMap)
				if err != nil {
					return err
				}

				saveSlot := SaveSlot{
					Username: "default",
					SlotID:   slotID,
					SaveData: string(slotJSON),
				}
				if err := tx.Save(&saveSlot).Error; err != nil {
					return err
				}

				// Clean out old progress
				if err := tx.Where("username = ? AND slot_id = ?", "default", slotID).Delete(&SaveProgress{}).Error; err != nil {
					return err
				}

				// Insert progress entries
				for idx, item := range historyLog {
					itemMap, ok := item.(map[string]interface{})
					if !ok {
						continue
					}

					scenName, _ := itemMap["currentScenario"].(string)
					ptrVal := 0
					if pFloat, ok := itemMap["pointer"].(float64); ok {
						ptrVal = int(pFloat)
					} else if pInt, ok := itemMap["pointer"].(int); ok {
						ptrVal = pInt
					}

					spJp, _ := itemMap["speakerJp"].(string)
					spEn, _ := itemMap["speakerEn"].(string)
					txtJp, _ := itemMap["textJp"].(string)
					txtEn, _ := itemMap["textEn"].(string)
					
					var voiceStr string
					if v, ok := itemMap["voice"]; ok && v != nil {
						voiceStr, _ = v.(string)
					}

					var snapStr string
					if snap, ok := itemMap["snapshot"]; ok && snap != nil {
						snapJSON, err := json.Marshal(snap)
						if err == nil {
							snapStr = string(snapJSON)
						}
					}

					rec := SaveProgress{
						Username:     "default",
						SlotID:       slotID,
						EntryIndex:   idx,
						ScenarioName: scenName,
						Pointer:      ptrVal,
						SpeakerJP:    spJp,
						SpeakerEN:    spEn,
						TextJP:       txtJp,
						TextEN:       txtEn,
						Voice:        voiceStr,
						Snapshot:     snapStr,
					}
					if err := tx.Create(&rec).Error; err != nil {
						return err
					}
				}
			}
		}
		return nil
	})

	if err != nil {
		return err
	}

	// Rename legacy file to backup
	if err := os.Rename(savesJSONPath, backupPath); err != nil {
		return fmt.Errorf("failed to backup legacy saves.json file: %w", err)
	}

	return nil
}
