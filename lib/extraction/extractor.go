package extraction

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// RunExtraction runs the full extraction process in the current working directory
func RunExtraction() {
	gameDir, err := os.Getwd()
	if err != nil {
		log.Fatalf("Failed to get current working directory: %v", err)
	}

	var actualGameDir string
	if _, err := os.Stat(filepath.Join(gameDir, "data.xp3")); err == nil {
		actualGameDir = gameDir
	} else if _, err := os.Stat(filepath.Join(gameDir, "DATA.XP3")); err == nil {
		actualGameDir = gameDir
	} else if _, err := os.Stat(filepath.Join(gameDir, "G弦上的魔王", "data.xp3")); err == nil {
		actualGameDir = filepath.Join(gameDir, "G弦上的魔王")
	} else if _, err := os.Stat(filepath.Join(gameDir, "G弦上的魔王", "DATA.XP3")); err == nil {
		actualGameDir = filepath.Join(gameDir, "G弦上的魔王")
	}

	if actualGameDir == "" {
		log.Fatalf("Could not locate game data files (data.xp3/DATA.XP3). Please ensure you run game-server inside or alongside the 'G弦上的魔王' game directory.")
	}

	fmt.Printf("Locating game files in: %s\n", actualGameDir)

	var xp3Files []string
	dataXp3Path := filepath.Join(actualGameDir, "data.xp3")
	if _, err := os.Stat(dataXp3Path); err == nil {
		xp3Files = append(xp3Files, dataXp3Path)
	} else {
		dataXp3UpperPath := filepath.Join(actualGameDir, "DATA.XP3")
		if _, err := os.Stat(dataXp3UpperPath); err == nil {
			xp3Files = append(xp3Files, dataXp3UpperPath)
		}
	}

	arcDir := filepath.Join(actualGameDir, "arc")
	if _, err := os.Stat(arcDir); os.IsNotExist(err) {
		arcDir = filepath.Join(actualGameDir, "ARC")
	}
	if _, err := os.Stat(arcDir); err == nil {
		filepath.Walk(arcDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return nil
			}
			if !info.IsDir() && strings.HasSuffix(strings.ToLower(info.Name()), ".xp3") {
				xp3Files = append(xp3Files, path)
			}
			return nil
		})
	}

	if len(xp3Files) == 0 {
		log.Fatalf("No XP3 archives found in CWD (%s). Please place game-server inside the game directory containing data.xp3.", gameDir)
	}

	fmt.Printf("Found %d XP3 archives to extract:\n", len(xp3Files))
	for _, f := range xp3Files {
		fmt.Printf("  - %s\n", filepath.Base(f))
	}

	outputDir := "./extracted_data"
	os.MkdirAll(outputDir, 0755)
	os.MkdirAll(filepath.Join(outputDir, "scenario"), 0755)
	os.MkdirAll(filepath.Join(outputDir, "scenarios"), 0755)

	// Extract files
	for _, xp3Path := range xp3Files {
		fmt.Printf("Extracting %s...\n", filepath.Base(xp3Path))
		archiveBase := strings.ToLower(strings.TrimSuffix(filepath.Base(xp3Path), filepath.Ext(xp3Path)))
		prependPrefix := ""
		if archiveBase != "data" && !strings.HasPrefix(archiveBase, "patch") {
			prependPrefix = archiveBase + "/"
		}
		err := extractXP3(xp3Path, outputDir, prependPrefix)
		if err != nil {
			log.Fatalf("Failed to extract %s: %v", filepath.Base(xp3Path), err)
		}
	}

	// Compile scenarios
	fmt.Println("Compiling scenarios...")
	err = compileAllScenarios(outputDir)
	if err != nil {
		log.Fatalf("Failed to compile scenarios: %v", err)
	}

	// Parse POS files
	fmt.Println("Parsing POS files...")
	err = parseAllPosFiles(outputDir)
	if err != nil {
		log.Fatalf("Failed to parse POS files: %v", err)
	}

	// Build file map
	fmt.Println("Building file map...")
	err = buildFileMap(outputDir)
	if err != nil {
		log.Fatalf("Failed to build file map: %v", err)
	}

	fmt.Println("\nExtraction completed successfully!")
}
