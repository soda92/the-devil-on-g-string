package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"runtime"
	"strings"
	"sync"
	"time"

	"game-rewrite/lib/extraction"
)

type SaveState struct {
	SF    map[string]interface{} `json:"sf"`
	Slots map[string]interface{} `json:"slots"`
}

var (
	saveFile  = "saves.json"
	stateLock sync.Mutex
)

func loadState() (SaveState, error) {
	stateLock.Lock()
	defer stateLock.Unlock()

	var state SaveState
	state.Slots = make(map[string]interface{})
	state.SF = make(map[string]interface{})

	if _, err := os.Stat(saveFile); os.IsNotExist(err) {
		return state, nil
	}

	data, err := os.ReadFile(saveFile)
	if err != nil {
		return state, err
	}

	err = json.Unmarshal(data, &state)
	if state.SF == nil {
		state.SF = make(map[string]interface{})
	}
	if state.Slots == nil {
		state.Slots = make(map[string]interface{})
	}
	return state, err
}

func saveState(state SaveState) error {
	stateLock.Lock()
	defer stateLock.Unlock()

	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(saveFile, data, 0644)
}

func openBrowser(url string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
		if err != nil {
			exec.Command("google-chrome", url).Start()
			exec.Command("firefox", url).Start()
		}
	case "windows":
		err = exec.Command("cmd", "/c", "start", "", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	}
}

func main() {
	port := flag.Int("port", 8080, "port to listen on")
	extractMode := flag.Bool("extract", false, "run asset extraction mode")
	devMode := flag.Bool("dev", false, "run in frontend development mode (runs pnpm dev concurrently)")
	analyzeMode := flag.Bool("analyze", false, "run scenario analysis to find unhandled events")
	flag.Parse()

	if *analyzeMode {
		runAnalysis()
		return
	}

	// Detect if extraction is needed
	needsExtraction := false
	if _, err := os.Stat("file_map.json"); os.IsNotExist(err) {
		needsExtraction = true
	} else if _, err := os.Stat("sprite_positions.json"); os.IsNotExist(err) {
		needsExtraction = true
	} else if _, err := os.Stat("./extracted_data"); os.IsNotExist(err) {
		needsExtraction = true
	}

	if *extractMode || needsExtraction {
		if needsExtraction {
			fmt.Println("Assets index files or extracted_data directory not found. Starting automatic extraction...")
		}
		extraction.RunExtraction()
		if !*extractMode {
			fmt.Println("Automatic extraction finished. Launching server...")
		} else {
			return
		}
	}

	if *devMode {
		fmt.Println("Launching frontend Vite development server (pnpm dev)...")
		var cmd *exec.Cmd
		if runtime.GOOS == "windows" {
			cmd = exec.Command("cmd", "/c", "pnpm", "dev")
		} else {
			cmd = exec.Command("pnpm", "dev")
		}
		cmd.Dir = "./web-app"
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		err := cmd.Start()
		if err != nil {
			log.Printf("Warning: Failed to start frontend development server (pnpm dev): %v\n", err)
		} else {
			go func() {
				cmd.Wait()
			}()
		}
	}

	// API routes
	http.HandleFunc("/api/state", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		state, err := loadState()
		if err != nil {
			http.Error(w, "Failed to load state: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(state)
	})

	http.HandleFunc("/api/save-slot", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Slot string                 `json:"slot"`
			Data map[string]interface{} `json:"data"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		state, err := loadState()
		if err != nil {
			http.Error(w, "Failed to load state: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if state.Slots == nil {
			state.Slots = make(map[string]interface{})
		}
		state.Slots[req.Slot] = req.Data

		if err := saveState(state); err != nil {
			http.Error(w, "Failed to save state: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"success":true}`))
	})

	http.HandleFunc("/api/save-sf", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			SF map[string]interface{} `json:"sf"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		state, err := loadState()
		if err != nil {
			http.Error(w, "Failed to load state: "+err.Error(), http.StatusInternalServerError)
			return
		}

		state.SF = req.SF

		if err := saveState(state); err != nil {
			http.Error(w, "Failed to save state: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"success":true}`))
	})

	// Serve scenarios from extracted_data/scenarios
	http.HandleFunc("/scenarios/", func(w http.ResponseWriter, r *http.Request) {
		localPath := "./extracted_data" + r.URL.Path
		http.ServeFile(w, r, localPath)
	})

	// Serve local media assets from extracted_data
	assetDirs := []string{"alter", "bgimage", "bgm", "bland_call", "evimage", "evimage_h_scene", "face", "fgimage", "font", "image", "others", "rule", "sound", "voice", "voice_h_scene"}
	for _, dir := range assetDirs {
		prefix := "/" + dir + "/"
		path := "./extracted_data/" + dir
		http.Handle(prefix, http.StripPrefix(prefix, http.FileServer(http.Dir(path))))
	}

	// Static files handler serving built React app from disk
	http.Handle("/", http.FileServer(http.Dir("./web-app/dist")))

	url := fmt.Sprintf("http://localhost:%d", *port)
	if *devMode {
		url = "http://localhost:38942"
	}

	if *devMode {
		fmt.Printf("Starting backend server on http://localhost:%d\n", *port)
		fmt.Printf("Dev mode active. Web application available at %s\n", url)
	} else {
		fmt.Printf("Starting backend server on %s\n", url)
	}

	// Async browser open after a slight delay to allow port binding
	go func() {
		delay := 500 * time.Millisecond
		if *devMode {
			delay = 1500 * time.Millisecond // Wait slightly longer for Vite dev server to compile on first boot
		}
		time.Sleep(delay)
		openBrowser(url)
	}()

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}

type CmdFreq struct {
	Name  string
	Count int
}

func runAnalysis() {
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
