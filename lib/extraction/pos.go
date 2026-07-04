package extraction

import (
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	_ "golang.org/x/image/webp"
)

func parsePosFile(filePath string) (string, int, int, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", 0, 0, err
	}
	content := utf16LEToString(data)
	re := regexp.MustCompile(`string\s+"([^"]+)"\s*,\s*int\s+([0-9-]+)\s*,\s*int\s+([0-9-]+)`)
	m := re.FindStringSubmatch(content)
	if len(m) < 4 {
		return "", 0, 0, fmt.Errorf("invalid POS format")
	}
	base := m[1]
	x, _ := strconv.Atoi(m[2])
	y, _ := strconv.Atoi(m[3])
	return base, x, y, nil
}

func getImageDimensions(filePath string) (int, int, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return 0, 0, err
	}
	defer f.Close()
	config, _, err := image.DecodeConfig(f)
	if err != nil {
		return 0, 0, err
	}
	return config.Width, config.Height, nil
}

func parseAllPosFiles(extractedDataDir string) error {
	spritePositions := make(map[string]interface{})
	fgimageDir := filepath.Join(extractedDataDir, "fgimage")

	if _, err := os.Stat(fgimageDir); os.IsNotExist(err) {
		return nil
	}

	files, err := filepath.Glob(filepath.Join(fgimageDir, "*.pos"))
	if err != nil {
		return err
	}

	for _, posFile := range files {
		spriteName := strings.TrimSuffix(filepath.Base(posFile), filepath.Ext(posFile))
		baseName, x, y, err := parsePosFile(posFile)
		if err != nil {
			continue
		}

		var baseImgPath, overlayImgPath string
		extensions := []string{".webp", ".png", ".jpg"}
		for _, ext := range extensions {
			bp := filepath.Join(fgimageDir, baseName+ext)
			if _, err := os.Stat(bp); err == nil {
				baseImgPath = bp
			}
			op := filepath.Join(fgimageDir, spriteName+ext)
			if _, err := os.Stat(op); err == nil {
				overlayImgPath = op
			}
		}

		if baseImgPath != "" && overlayImgPath != "" {
			baseW, baseH, err1 := getImageDimensions(baseImgPath)
			overlayW, overlayH, err2 := getImageDimensions(overlayImgPath)
			if err1 == nil && err2 == nil {
				spritePositions[spriteName] = map[string]interface{}{
					"base":      baseName,
					"x":         x,
					"y":         y,
					"base_w":    baseW,
					"base_h":    baseH,
					"overlay_w": overlayW,
					"overlay_h": overlayH,
				}
				continue
			}
		}

		spritePositions[spriteName] = map[string]interface{}{
			"base": baseName,
			"x":    x,
			"y":    y,
		}
	}

	outData, err := json.MarshalIndent(spritePositions, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile("sprite_positions.json", outData, 0644)
}
