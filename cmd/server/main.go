package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
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
	flag.Parse()

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
	fmt.Printf("Starting backend server on %s\n", url)

	// Async browser open after a slight delay to allow port binding
	go func() {
		time.Sleep(500 * time.Millisecond)
		openBrowser(url)
	}()

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}
