package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"time"

	"game-rewrite/lib/extraction"
	"game-rewrite/pkg/analyzer"
	"game-rewrite/pkg/db"
	"game-rewrite/pkg/handlers"
)

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
		analyzer.RunAnalysis()
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

	// Initialize the GORM Database
	if err := db.InitDB("saves.db"); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Migrate legacy saves.json if present
	if _, err := os.Stat("saves.json"); err == nil {
		log.Println("Found legacy saves.json. Migrating to saves.db...")
		if err := db.MigrateFromJSON("saves.json", "saves.json.bak"); err != nil {
			log.Printf("Migration failed: %v", err)
		} else {
			log.Println("Migration completed successfully!")
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

	// Setup Gin Router
	router := handlers.SetupRouter(*devMode)

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
			delay = 1500 * time.Millisecond
		}
		time.Sleep(delay)
		openBrowser(url)
	}()

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), router))
}
