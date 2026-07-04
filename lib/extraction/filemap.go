package extraction

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

func buildFileMap(extractedDataDir string) error {
	fileMap := make(map[string]string)
	assetFolders := []string{
		"bgimage", "bgm", "evimage", "evimage_h_scene",
		"face", "fgimage", "image", "others", "rule", "sound",
		"voice", "voice_h_scene", "alter", "font", "bland_call",
	}

	for _, folder := range assetFolders {
		folderPath := filepath.Join(extractedDataDir, folder)
		if _, err := os.Stat(folderPath); os.IsNotExist(err) {
			continue
		}

		filepath.Walk(folderPath, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() {
				return nil
			}

			nameLower := strings.ToLower(info.Name())
			if strings.HasSuffix(nameLower, ".pos") || strings.HasPrefix(nameLower, ".") {
				return nil
			}

			baseName := strings.TrimSuffix(info.Name(), filepath.Ext(info.Name()))

			rel, err := filepath.Rel(extractedDataDir, path)
			if err != nil {
				return nil
			}
			webPath := "/" + filepath.ToSlash(rel)
			fileMap[baseName] = webPath

			return nil
		})
	}

	outData, err := json.MarshalIndent(fileMap, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile("file_map.json", outData, 0644)
}
