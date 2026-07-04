package main

import (
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"sync"
)

//go:embed web-app/dist
var distFS embed.FS

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

	// Extract the embedded static assets folder
	staticFS, err := fs.Sub(distFS, "web-app/dist")
	if err != nil {
		log.Fatal("Failed to load embedded static files: ", err)
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

	// Static files handler
	http.Handle("/", http.FileServer(http.FS(staticFS)))

	fmt.Printf("Starting backend server on http://localhost:%d\n", *port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}
