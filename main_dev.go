package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
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

func main() {
	port := flag.Int("port", 8080, "port to listen on")
	flag.Parse()

	// CORS helper headers
	setupCORS := func(w http.ResponseWriter) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	}

	// API routes
	http.HandleFunc("/api/state", func(w http.ResponseWriter, r *http.Request) {
		setupCORS(w)
		if r.Method == http.MethodOptions {
			return
		}
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
		setupCORS(w)
		if r.Method == http.MethodOptions {
			return
		}
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
		setupCORS(w)
		if r.Method == http.MethodOptions {
			return
		}
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

	http.HandleFunc("/api/debug-scene", func(w http.ResponseWriter, r *http.Request) {
		setupCORS(w)
		if r.Method == http.MethodOptions {
			return
		}
		
		scen := r.URL.Query().Get("scen")
		ptrStr := r.URL.Query().Get("ptr")
		if scen == "" || ptrStr == "" {
			http.Error(w, "Missing scen or ptr parameters", http.StatusBadRequest)
			return
		}
		
		var targetPtr int
		if _, err := fmt.Sscanf(ptrStr, "%d", &targetPtr); err != nil {
			http.Error(w, "Invalid ptr parameter", http.StatusBadRequest)
			return
		}
		
		// Load scenario file
		filePath := fmt.Sprintf("./compiled_scenarios/%s.json", scen)
		data, err := os.ReadFile(filePath)
		if err != nil {
			http.Error(w, "Scenario file not found: "+err.Error(), http.StatusNotFound)
			return
		}
		
		// Parse scenario JSON
		var scenario struct {
			Name         string                   `json:"name"`
			Instructions []map[string]interface{} `json:"instructions"`
		}
		if err := json.Unmarshal(data, &scenario); err != nil {
			http.Error(w, "Failed to parse scenario JSON: "+err.Error(), http.StatusInternalServerError)
			return
		}
		
		if targetPtr < 0 || targetPtr > len(scenario.Instructions) {
			http.Error(w, fmt.Sprintf("Pointer out of bounds (0-%d)", len(scenario.Instructions)), http.StatusBadRequest)
			return
		}
		
		// Trace variables
		type HistoryEntry struct {
			Pointer int                    `json:"pointer"`
			Cmd     string                 `json:"command"`
			Value   interface{}            `json:"value"`
			Args    map[string]interface{} `json:"args,omitempty"`
		}
		
		var bgHistory []HistoryEntry
		var bgmHistory []HistoryEntry
		
		currentBg := "white"
		currentBgm := ""
		
		for idx := 0; idx < targetPtr; idx++ {
			inst := scenario.Instructions[idx]
			instType, _ := inst["type"].(string)
			
			if instType == "command" {
				cmdName, _ := inst["name"].(string)
				args, _ := inst["args"].(map[string]interface{})
				
				if cmdName == "playbgm" || cmdName == "bgm" || cmdName == "fadeinbgm" {
					storage, _ := args["storage"].(string)
					currentBgm = storage
					bgmHistory = append(bgmHistory, HistoryEntry{Pointer: idx, Cmd: cmdName, Value: storage, Args: args})
				} else if cmdName == "stbgm" || cmdName == "stopbgm" || cmdName == "fadeoutbgm" {
					currentBgm = ""
					bgmHistory = append(bgmHistory, HistoryEntry{Pointer: idx, Cmd: cmdName, Value: nil, Args: args})
				} else if cmdName == "bg" || cmdName == "bg2" || cmdName == "bg_ch" || cmdName == "b_ch" {
					storage, _ := args["storage"].(string)
					if storage == "" {
						storage, _ = args["str"].(string)
					}
					if storage == "" {
						storage = "black"
					}
					currentBg = storage
					bgHistory = append(bgHistory, HistoryEntry{Pointer: idx, Cmd: cmdName, Value: storage, Args: args})
				} else if cmdName == "ev" || cmdName == "ev_ch" {
					storage, _ := args["storage"].(string)
					if storage == "" {
						storage, _ = args["str"].(string)
					}
					currentBg = storage
					bgHistory = append(bgHistory, HistoryEntry{Pointer: idx, Cmd: cmdName, Value: storage, Args: args})
				} else if cmdName == "black" {
					currentBg = "black"
					bgHistory = append(bgHistory, HistoryEntry{Pointer: idx, Cmd: cmdName, Value: "black", Args: args})
				} else if cmdName == "image" {
					storage, _ := args["storage"].(string)
					layerStr, _ := args["layer"].(string)
					
					if layerStr == "base" {
						if storage != "" {
							currentBg = storage
							bgHistory = append(bgHistory, HistoryEntry{Pointer: idx, Cmd: cmdName, Value: storage, Args: args})
						}
					}
				}
			}
		}
		
		// Get surrounding instructions
		startIdx := targetPtr - 5
		if startIdx < 0 {
			startIdx = 0
		}
		endIdx := targetPtr + 5
		if endIdx > len(scenario.Instructions) {
			endIdx = len(scenario.Instructions)
		}
		
		surrounding := scenario.Instructions[startIdx:endIdx]
		
		response := map[string]interface{}{
			"scen":                     scen,
			"pointer":                  targetPtr,
			"current_bg":               currentBg,
			"current_bgm":              currentBgm,
			"background_change_events": bgHistory,
			"bgm_change_events":        bgmHistory,
			"surrounding_instructions": surrounding,
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	})

	fmt.Printf("Starting Dev API server on http://localhost:%d\n", *port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}
