package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"syscall"
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
	port := flag.Int("port", 0, "port to listen on (default 8080 in prod, 38080 in dev)")
	extractMode := flag.Bool("extract", false, "run asset extraction mode")
	devMode := flag.Bool("dev", false, "run in frontend development mode (runs pnpm dev concurrently)")
	analyzeMode := flag.Bool("analyze", false, "run scenario analysis to find unhandled events")
	flag.Parse()

	if *analyzeMode {
		analyzer.RunAnalysis()
		return
	}

	// Resolve effective port: 38080 for dev, 8080 for prod unless explicitly provided
	effectivePort := *port
	if effectivePort == 0 {
		if *devMode {
			effectivePort = 38080
		} else {
			effectivePort = 8080
		}
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

	var devCmd *exec.Cmd
	if *devMode {
		fmt.Printf("Launching frontend Vite development server (pnpm dev) with BACKEND_PORT=%d...\n", effectivePort)
		if runtime.GOOS == "windows" {
			devCmd = exec.Command("cmd", "/c", "pnpm", "dev")
		} else {
			devCmd = exec.Command("pnpm", "dev")
		}
		devCmd.Dir = "./web-app"
		devCmd.Env = append(os.Environ(), fmt.Sprintf("BACKEND_PORT=%d", effectivePort))
		devCmd.Stdout = os.Stdout
		devCmd.Stderr = os.Stderr

		// Enable process group for clean subtree termination on Unix
		if runtime.GOOS != "windows" {
			devCmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
		}

		err := devCmd.Start()
		if err != nil {
			log.Printf("Warning: Failed to start frontend development server (pnpm dev): %v\n", err)
		} else {
			go func() {
				_ = devCmd.Wait()
			}()
		}
	}

	// Setup Gin Router
	router := handlers.SetupRouter(*devMode)

	frontendUrl := fmt.Sprintf("http://localhost:%d", effectivePort)
	if *devMode {
		frontendUrl = "http://localhost:38942"
	}

	if *devMode {
		fmt.Printf("Backend API server listening on http://localhost:%d\n", effectivePort)
		fmt.Printf("Dev mode active. Frontend dev application available at %s\n", frontendUrl)
	} else {
		fmt.Printf("Starting backend server on %s\n", frontendUrl)
	}

	// Async browser open after a slight delay to allow port binding
	go func() {
		delay := 500 * time.Millisecond
		if *devMode {
			delay = 1500 * time.Millisecond
		}
		time.Sleep(delay)
		openBrowser(frontendUrl)
	}()

	// Graceful shutdown listener to terminate the Vite child process tree
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", effectivePort),
		Handler: router,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Shutting down server...")
		if devCmd != nil && devCmd.Process != nil {
			if runtime.GOOS != "windows" {
				_ = syscall.Kill(-devCmd.Process.Pid, syscall.SIGKILL)
			} else {
				_ = devCmd.Process.Kill()
			}
		}
		os.Exit(0)
	}()

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server listen error: %v", err)
	}
}
