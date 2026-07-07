package analyzer

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
)

type CmdFreq struct {
	Name  string
	Count int
}

func RunAnalysis() {
	fmt.Println("=== Running Scenario Analysis ===")
	
	scenariosDir := "extracted_data/scenarios"
	kagRunnerPath := "web-app/src/hooks/useKagRunner.js"

	files, err := os.ReadDir(scenariosDir)
	if err != nil {
		log.Fatalf("Failed to read scenarios directory: %v", err)
	}

	commandCounts := make(map[string]int)
	totalCommands := 0

	type ScenarioInst struct {
		Type string `json:"type"`
		Name string `json:"name"`
	}
	type ScenarioData struct {
		Instructions []ScenarioInst `json:"instructions"`
	}

	// Regex for extracting game-specific variables f.* and sf.*
	fRegex := regexp.MustCompile(`\bf\.([a-zA-Z0-9_]+)`)
	sfRegex := regexp.MustCompile(`\bsf\.([a-zA-Z0-9_]+)`)
	fFlags := make(map[string]int)
	sfFlags := make(map[string]int)
	fIncrements := make(map[string]int)
	incrementRegex := regexp.MustCompile(`\bf\.(flag_[a-zA-Z0-9_]+)\s*(?:\+=|\+\+|=)`)

	for _, file := range files {
		if !file.IsDir() && len(file.Name()) > 5 && file.Name()[len(file.Name())-5:] == ".json" {
			filePath := scenariosDir + "/" + file.Name()
			data, err := os.ReadFile(filePath)
			if err != nil {
				continue
			}

			// Scan file string content for variables
			content := string(data)
			fMatches := fRegex.FindAllStringSubmatch(content, -1)
			for _, match := range fMatches {
				if len(match) > 1 {
					fFlags[match[1]]++
				}
			}
			sfMatches := sfRegex.FindAllStringSubmatch(content, -1)
			for _, match := range sfMatches {
				if len(match) > 1 {
					sfFlags[match[1]]++
				}
			}
			incMatches := incrementRegex.FindAllStringSubmatch(content, -1)
			for _, match := range incMatches {
				if len(match) > 1 {
					fIncrements[match[1]]++
				}
			}

			var scen ScenarioData
			if err := json.Unmarshal(data, &scen); err != nil {
				continue
			}
			for _, inst := range scen.Instructions {
				if inst.Type == "command" && inst.Name != "" {
					totalCommands++
					commandCounts[inst.Name]++
				}
			}
		}
	}

	fmt.Printf("Total scenario commands parsed: %d\n", totalCommands)
	fmt.Printf("Unique commands found         : %d\n", len(commandCounts))

	jsBytes, err := os.ReadFile(kagRunnerPath)
	var jsContent string
	if err != nil {
		fmt.Printf("Warning: Could not read %s for mapping: %v\n", kagRunnerPath, err)
	} else {
		jsContent = string(jsBytes)
	}

	var handled []CmdFreq
	var unhandled []CmdFreq

	for name, count := range commandCounts {
		isHandled := false
		if jsContent != "" {
			pat1 := fmt.Sprintf("inst.name === '%s'", name)
			pat2 := fmt.Sprintf("inst.name == '%s'", name)
			pat3 := fmt.Sprintf("'%s'", name)
			pat4 := fmt.Sprintf("\"%s\"", name)
			
			// Special checks for aliases/lists handled dynamically
			isBgCmd := (name == "bg" || name == "bg2" || name == "bg_ch" || name == "b_ch") && strings.Contains(jsContent, "inst.name === 'bg'")
			isEvCmd := (name == "ev" || name == "ev_ch" || name == "ev_mosaic") && strings.Contains(jsContent, "inst.name === 'ev'")
			isAudioCmd := (name == "fibgm" || name == "xbgm" || name == "fobgm" || name == "sbgm" || name == "fise" || name == "fose" || name == "sse") && strings.Contains(jsContent, "inst.name === 'playbgm'")

			if strings.Contains(jsContent, pat1) || strings.Contains(jsContent, pat2) || 
				strings.Contains(jsContent, pat3) || strings.Contains(jsContent, pat4) ||
				isBgCmd || isEvCmd || isAudioCmd {
				isHandled = true
			}
		}
		
		freq := CmdFreq{Name: name, Count: count}
		if isHandled {
			handled = append(handled, freq)
		} else {
			unhandled = append(unhandled, freq)
		}
	}

	sortFrequencies(handled)
	sortFrequencies(unhandled)

	fmt.Println("\n=== HANDLED COMMANDS (By Frequency) ===")
	for i, f := range handled {
		fmt.Printf("%3d. %-20s: %5d\n", i+1, f.Name, f.Count)
	}

	fmt.Println("\n=== UNHANDLED COMMANDS (By Frequency) ===")
	if len(unhandled) == 0 {
		fmt.Println("No unhandled commands! The engine is 100% complete.")
	} else {
		for i, f := range unhandled {
			fmt.Printf("%3d. %-20s: %5d\n", i+1, f.Name, f.Count)
		}
	}

	// Print Discovered Heroine Route Flag Max Values
	var incList []CmdFreq
	for name, count := range fIncrements {
		incList = append(incList, CmdFreq{Name: name, Count: count})
	}
	sortFrequencies(incList)
	fmt.Println("\n=== HEROINE ROUTE MAXIMUM POINTS (Scanned Increments) ===")
	for i, f := range incList {
		fmt.Printf("%3d. f.%-25s: %2d\n", i+1, f.Name, f.Count)
	}

	// Print Discovered Game Flags
	var fList []CmdFreq
	for name, count := range fFlags {
		fList = append(fList, CmdFreq{Name: name, Count: count})
	}
	sortFrequencies(fList)
	fmt.Println("\n=== DISCOVERED GAME VARIABLES (f.*) ===")
	for i, f := range fList {
		fmt.Printf("%3d. f.%-25s: %5d\n", i+1, f.Name, f.Count)
	}

	// Print Discovered System Flags
	var sfList []CmdFreq
	for name, count := range sfFlags {
		sfList = append(sfList, CmdFreq{Name: name, Count: count})
	}
	sortFrequencies(sfList)
	fmt.Println("\n=== DISCOVERED SYSTEM FLAGS (sf.*) ===")
	for i, sf := range sfList {
		fmt.Printf("%3d. sf.%-25s: %5d\n", i+1, sf.Name, sf.Count)
	}
}

func sortFrequencies(slice []CmdFreq) {
	for i := 0; i < len(slice); i++ {
		for j := i + 1; j < len(slice); j++ {
			if slice[i].Count < slice[j].Count {
				slice[i], slice[j] = slice[j], slice[i]
			}
		}
	}
}
