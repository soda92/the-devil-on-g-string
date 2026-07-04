package extraction

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

func hasDataXp3(dir string) bool {
	if _, err := os.Stat(filepath.Join(dir, "data.xp3")); err == nil {
		return true
	}
	if _, err := os.Stat(filepath.Join(dir, "DATA.XP3")); err == nil {
		return true
	}
	return false
}

// FindGameDir walks the current directory and its subdirectories up to a depth of 3 to find data.xp3
func FindGameDir(startDir string) (string, error) {
	if hasDataXp3(startDir) {
		return startDir, nil
	}

	var foundDir string
	errFound := fmt.Errorf("found")
	err := filepath.Walk(startDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() {
			return nil
		}
		name := info.Name()
		if strings.HasPrefix(name, ".") || name == "web-app" || name == "extracted_data" || name == "node_modules" || name == "extracted_data_backup" {
			return filepath.SkipDir
		}

		rel, err := filepath.Rel(startDir, path)
		if err != nil {
			return nil
		}
		depth := len(strings.Split(filepath.ToSlash(rel), "/"))
		if rel == "." || rel == "" {
			depth = 0
		}
		if depth > 3 {
			return filepath.SkipDir
		}

		if hasDataXp3(path) {
			foundDir = path
			return errFound // stop walk
		}
		return nil
	})

	if err == errFound && foundDir != "" {
		return foundDir, nil
	}
	return "", fmt.Errorf("could not locate game directory containing data.xp3")
}

// RunExtraction runs the full extraction process
func RunExtraction() {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatalf("Failed to get current working directory: %v", err)
	}

	actualGameDir, err := FindGameDir(cwd)
	if err != nil {
		log.Fatalf("Error locating game directory: %v. Please ensure you run this server inside or alongside the game files containing data.xp3.", err)
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
		log.Fatalf("No XP3 archives found in game directory %s.", actualGameDir)
	}

	// Verify complete installation by checking for missing core archives
	expectedCore := []string{
		"data.xp3",
		"bgimage.xp3",
		"bgm.xp3",
		"evimage.xp3",
		"face.xp3",
		"fgimage.xp3",
		"image.xp3",
		"others.xp3",
		"sound.xp3",
		"voice.xp3",
	}

	foundMap := make(map[string]bool)
	for _, f := range xp3Files {
		foundMap[strings.ToLower(filepath.Base(f))] = true
	}

	var missing []string
	for _, core := range expectedCore {
		if !foundMap[core] {
			missing = append(missing, core)
		}
	}

	if len(missing) > 0 {
		fmt.Printf("\n[WARNING] Your game installation files might be incomplete!\n")
		fmt.Printf("The following core archive(s) are missing from the game folder:\n")
		for _, m := range missing {
			fmt.Printf("  - %s\n", m)
		}
		fmt.Println("This may result in missing graphics, sounds, or errors during gameplay.")
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
