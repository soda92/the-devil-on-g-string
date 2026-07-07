package db

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) {
	var err error
	DB, err = gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test database: %v", err)
	}

	err = DB.AutoMigrate(&SystemFlag{}, &SaveSlot{}, &SaveProgress{})
	if err != nil {
		t.Fatalf("failed to auto migrate: %v", err)
	}
}

func TestSystemFlags(t *testing.T) {
	setupTestDB(t)

	testSF := map[string]interface{}{
		"volume":         float64(8),
		"typewriterMode": "CHAR",
		"readScenarios": map[string]interface{}{
			"g01": map[string]interface{}{
				"0": true,
				"1": true,
			},
		},
	}

	// Save SF for default user
	err := SaveSFToDB("default", testSF)
	if err != nil {
		t.Errorf("SaveSFToDB failed: %v", err)
	}

	// Load and verify
	sf, _, err := LoadStateFromDB("default")
	if err != nil {
		t.Errorf("LoadStateFromDB failed: %v", err)
	}

	if sf["typewriterMode"] != "CHAR" {
		t.Errorf("expected typewriterMode to be CHAR, got %v", sf["typewriterMode"])
	}

	readScenarios, ok := sf["readScenarios"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected readScenarios to be map")
	}

	g01, ok := readScenarios["g01"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected g01 scen to be map")
	}

	if g01["0"] != true {
		t.Errorf("expected g01 ptr 0 to be true")
	}
}

func TestSystemFlagsMultiUser(t *testing.T) {
	setupTestDB(t)

	aliceSF := map[string]interface{}{"typewriterMode": "CHAR"}
	bobSF := map[string]interface{}{"typewriterMode": "WORD"}

	// Save SF for both
	if err := SaveSFToDB("alice", aliceSF); err != nil {
		t.Errorf("failed to save alice SF: %v", err)
	}
	if err := SaveSFToDB("bob", bobSF); err != nil {
		t.Errorf("failed to save bob SF: %v", err)
	}

	// Verify Alice
	sfAlice, _, err := LoadStateFromDB("alice")
	if err != nil {
		t.Errorf("failed to load alice state: %v", err)
	}
	if sfAlice["typewriterMode"] != "CHAR" {
		t.Errorf("expected alice typewriterMode CHAR, got %v", sfAlice["typewriterMode"])
	}

	// Verify Bob
	sfBob, _, err := LoadStateFromDB("bob")
	if err != nil {
		t.Errorf("failed to load bob state: %v", err)
	}
	if sfBob["typewriterMode"] != "WORD" {
		t.Errorf("expected bob typewriterMode WORD, got %v", sfBob["typewriterMode"])
	}
}

func TestSaveSlotAndProgress(t *testing.T) {
	setupTestDB(t)

	slotID := "1"
	saveData := map[string]interface{}{
		"currentScenario": "g02",
		"pointer":         float64(124),
		"bgm":             "bgm_03",
	}

	historyLog := []interface{}{
		map[string]interface{}{
			"currentScenario": "g01",
			"pointer":         float64(0),
			"speakerJp":       "相沢",
			"speakerEn":       "Aizawa",
			"textJp":          "第一句话。",
			"textEn":          "First line.",
			"voice":           "v_01_001",
			"snapshot": map[string]interface{}{
				"background": "bg_classroom",
			},
		},
		map[string]interface{}{
			"currentScenario": "g01",
			"pointer":         float64(1),
			"speakerJp":       "京介",
			"speakerEn":       "Kyousuke",
			"textJp":          "第二句话。",
			"textEn":          "Second line.",
		},
	}

	// Save slot for default user
	err := SaveSlotToDB("default", slotID, saveData, historyLog)
	if err != nil {
		t.Errorf("SaveSlotToDB failed: %v", err)
	}

	// Load and verify
	_, slots, err := LoadStateFromDB("default")
	if err != nil {
		t.Errorf("LoadStateFromDB failed: %v", err)
	}

	slotVal, exists := slots[slotID]
	if !exists {
		t.Fatalf("slot 1 not loaded")
	}

	slotMap, ok := slotVal.(map[string]interface{})
	if !ok {
		t.Fatalf("expected slot map type")
	}

	if slotMap["currentScenario"] != "g02" {
		t.Errorf("expected currentScenario g02, got %v", slotMap["currentScenario"])
	}

	loadedHistory, ok := slotMap["historyLog"].([]interface{})
	if !ok {
		t.Fatalf("expected historyLog list")
	}

	if len(loadedHistory) != 2 {
		t.Fatalf("expected history length 2, got %d", len(loadedHistory))
	}

	firstEntry, ok := loadedHistory[0].(map[string]interface{})
	if !ok {
		t.Fatalf("expected first entry map")
	}

	if firstEntry["speakerJp"] != "相沢" {
		t.Errorf("expected first entry speaker JP 相沢, got %v", firstEntry["speakerJp"])
	}

	if firstEntry["voice"] != "v_01_001" {
		t.Errorf("expected voice v_01_001, got %v", firstEntry["voice"])
	}

	snap, ok := firstEntry["snapshot"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected snapshot map")
	}

	if snap["background"] != "bg_classroom" {
		t.Errorf("expected snapshot background bg_classroom, got %v", snap["background"])
	}

	// --- Test Overwrite ---
	newHistoryLog := []interface{}{
		map[string]interface{}{
			"currentScenario": "g02",
			"pointer":         float64(10),
			"speakerJp":       "京介",
			"speakerEn":       "Kyousuke",
			"textJp":          "新的话。",
			"textEn":          "New line.",
		},
	}

	err = SaveSlotToDB("default", slotID, saveData, newHistoryLog)
	if err != nil {
		t.Errorf("overwrite SaveSlotToDB failed: %v", err)
	}

	// Load and verify overwrite
	_, slots, err = LoadStateFromDB("default")
	if err != nil {
		t.Errorf("LoadStateFromDB failed: %v", err)
	}

	slotMap = slots[slotID].(map[string]interface{})
	loadedHistory = slotMap["historyLog"].([]interface{})

	if len(loadedHistory) != 1 {
		t.Errorf("expected overwritten history length 1, got %d", len(loadedHistory))
	}

	entry := loadedHistory[0].(map[string]interface{})
	if entry["textJp"] != "新的话。" {
		t.Errorf("expected text 新的话。, got %v", entry["textJp"])
	}
}

func TestSaveSlotAndProgressMultiUser(t *testing.T) {
	setupTestDB(t)

	// Alice saveData
	aliceData := map[string]interface{}{"currentScenario": "g01"}
	aliceHistory := []interface{}{
		map[string]interface{}{
			"currentScenario": "g01",
			"pointer":         float64(0),
			"speakerJp":       "京介",
			"speakerEn":       "Kyousuke",
			"textJp":          "第一句",
			"textEn":          "Line 1",
		},
	}

	// Bob saveData
	bobData := map[string]interface{}{"currentScenario": "g02"}
	bobHistory := []interface{}{
		map[string]interface{}{
			"currentScenario": "g02",
			"pointer":         float64(5),
			"speakerJp":       "春原",
			"speakerEn":       "Sunohara",
			"textJp":          "第二句",
			"textEn":          "Line 2",
		},
	}

	// Save both under slot_id "1"
	if err := SaveSlotToDB("alice", "1", aliceData, aliceHistory); err != nil {
		t.Errorf("failed to save alice slot: %v", err)
	}
	if err := SaveSlotToDB("bob", "1", bobData, bobHistory); err != nil {
		t.Errorf("failed to save bob slot: %v", err)
	}

	// Load Alice and verify
	_, aliceSlots, err := LoadStateFromDB("alice")
	if err != nil {
		t.Errorf("failed to load alice state: %v", err)
	}
	aliceSlot1 := aliceSlots["1"].(map[string]interface{})
	if aliceSlot1["currentScenario"] != "g01" {
		t.Errorf("expected alice slot 1 scenario g01, got %v", aliceSlot1["currentScenario"])
	}
	aliceHist := aliceSlot1["historyLog"].([]interface{})
	if len(aliceHist) != 1 || aliceHist[0].(map[string]interface{})["speakerEn"] != "Kyousuke" {
		t.Errorf("alice history mismatch")
	}

	// Load Bob and verify
	_, bobSlots, err := LoadStateFromDB("bob")
	if err != nil {
		t.Errorf("failed to load bob state: %v", err)
	}
	bobSlot1 := bobSlots["1"].(map[string]interface{})
	if bobSlot1["currentScenario"] != "g02" {
		t.Errorf("expected bob slot 1 scenario g02, got %v", bobSlot1["currentScenario"])
	}
	bobHist := bobSlot1["historyLog"].([]interface{})
	if len(bobHist) != 1 || bobHist[0].(map[string]interface{})["speakerEn"] != "Sunohara" {
		t.Errorf("bob history mismatch")
	}
}

func TestMigrateFromJSON(t *testing.T) {
	setupTestDB(t)

	tempSavesFile := "temp_saves_test.json"
	tempSavesBackup := "temp_saves_test.json.bak"

	defer func() {
		os.Remove(tempSavesFile)
		os.Remove(tempSavesBackup)
	}()

	legacyData := map[string]interface{}{
		"sf": map[string]interface{}{
			"immerseMode": true,
		},
		"slots": map[string]interface{}{
			"autosave": map[string]interface{}{
				"currentScenario": "g10",
				"historyLog": []interface{}{
					map[string]interface{}{
						"currentScenario": "g09",
						"pointer":         float64(50),
						"textJp":          "老数据。",
						"textEn":          "Old data.",
					},
				},
			},
		},
	}

	dataBytes, err := json.Marshal(legacyData)
	if err != nil {
		t.Fatalf("failed to marshal legacy test data: %v", err)
	}

	err = os.WriteFile(tempSavesFile, dataBytes, 0644)
	if err != nil {
		t.Fatalf("failed to write temp file: %v", err)
	}

	err = MigrateFromJSON(tempSavesFile, tempSavesBackup)
	if err != nil {
		t.Errorf("MigrateFromJSON failed: %v", err)
	}

	// Verify migrated data is loaded under the "default" user
	sf, slots, err := LoadStateFromDB("default")
	if err != nil {
		t.Errorf("LoadStateFromDB failed: %v", err)
	}

	if sf["immerseMode"] != true {
		t.Errorf("expected immerseMode to be true")
	}

	autosaveVal, exists := slots["autosave"]
	if !exists {
		t.Fatalf("autosave slot not migrated")
	}

	autosaveMap := autosaveVal.(map[string]interface{})
	if autosaveMap["currentScenario"] != "g10" {
		t.Errorf("expected currentScenario g10, got %v", autosaveMap["currentScenario"])
	}

	history := autosaveMap["historyLog"].([]interface{})
	if len(history) != 1 {
		t.Fatalf("expected history length 1, got %d", len(history))
	}

	entry := history[0].(map[string]interface{})
	if entry["textJp"] != "老数据。" {
		t.Errorf("expected text 老数据。")
	}

	// Verify JSON backup file exists and original is deleted
	if _, err := os.Stat(tempSavesFile); !os.IsNotExist(err) {
		t.Errorf("expected original legacy saves file to be removed")
	}

	if _, err := os.Stat(tempSavesBackup); os.IsNotExist(err) {
		t.Errorf("expected backup saves file to exist")
	}
}
