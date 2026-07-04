package extraction

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode/utf16"

	"golang.org/x/text/encoding/japanese"
	"golang.org/x/text/transform"
)

type Instruction map[string]interface{}

func utf16LEToString(b []byte) string {
	utf := make([]uint16, len(b)/2)
	for i := range utf {
		utf[i] = uint16(b[2*i]) | (uint16(b[2*i+1]) << 8)
	}
	return string(utf16.Decode(utf))
}

func decodeShiftJIS(b []byte) (string, error) {
	r := transform.NewReader(bytes.NewReader(b), japanese.ShiftJIS.NewDecoder())
	decoded, err := io.ReadAll(r)
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}

func compileAllScenarios(extractedDataDir string) error {
	scenarioDir := filepath.Join(extractedDataDir, "scenario")
	outputDir := filepath.Join(extractedDataDir, "scenarios")

	cache := make(map[string]string)
	cacheData, err := os.ReadFile("translation_cache.json")
	if err == nil {
		err = json.Unmarshal(cacheData, &cache)
		if err != nil {
			fmt.Printf("Warning: Failed to parse translation_cache.json: %v\n", err)
		} else {
			fmt.Printf("Loaded %d translations from translation_cache.json.\n", len(cache))
		}
	} else {
		fmt.Printf("Warning: translation_cache.json not found on disk, scenario translations will fall back to original: %v\n", err)
	}

	files, err := filepath.Glob(filepath.Join(scenarioDir, "*.ks"))
	if err != nil {
		return err
	}

	for _, ksf := range files {
		scenName := strings.TrimSuffix(filepath.Base(ksf), filepath.Ext(ksf))
		data, err := os.ReadFile(ksf)
		if err != nil {
			return err
		}
		
		content, err := decodeShiftJIS(data)
		if err != nil {
			content = string(data)
		}

		instructions, _ := compileScenario(content, cache)

		outData, err := json.MarshalIndent(map[string]interface{}{
			"name":         scenName,
			"instructions": instructions,
		}, "", "  ")
		if err != nil {
			return err
		}

		outPath := filepath.Join(outputDir, scenName+".json")
		err = os.WriteFile(outPath, outData, 0644)
		if err != nil {
			return err
		}
	}

	return nil
}

func parseArgs(argStr string) map[string]string {
	args := make(map[string]string)
	re := regexp.MustCompile(`([a-zA-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]*))`)
	matches := re.FindAllStringSubmatch(argStr, -1)
	for _, m := range matches {
		name := m[1]
		val := m[2]
		if val == "" {
			val = m[3]
		}
		if val == "" {
			val = m[4]
		}
		val = strings.Trim(strings.TrimSpace(val), `"'`)
		args[name] = val
	}
	return args
}

func parseCommand(line string) (string, map[string]string) {
	line = strings.TrimSpace(line)
	idx := strings.IndexAny(line, " \t")
	if idx == -1 {
		return line, make(map[string]string)
	}
	cmdName := line[:idx]
	argStr := line[idx:]
	return cmdName, parseArgs(argStr)
}

func compileScenario(content string, translationCache map[string]string) ([]Instruction, []string) {
	lines := strings.Split(content, "\n")
	var instructions []Instruction
	var translatableTexts []string

	inScript := false
	var scriptContent []string

	for _, line := range lines {
		lineStripped := strings.TrimSpace(line)
		if lineStripped == "" {
			continue
		}

		if inScript {
			if strings.HasPrefix(lineStripped, "@endscript") || strings.Contains(lineStripped, "[endscript]") {
				inScript = false
				var cleaned []string
				for _, sl := range scriptContent {
					sClean := strings.TrimSpace(sl)
					if strings.HasPrefix(sClean, "//") || strings.HasPrefix(sClean, ";") {
						continue
					}
					cleaned = append(cleaned, sClean)
				}
				scriptStr := strings.Join(cleaned, " ")
				if scriptStr != "" {
					instructions = append(instructions, Instruction{
						"type": "eval",
						"exp":  scriptStr,
					})
				}
				scriptContent = nil
			} else {
				scriptContent = append(scriptContent, lineStripped)
			}
			continue
		}

		if strings.HasPrefix(lineStripped, "@iscript") || strings.Contains(lineStripped, "[iscript]") {
			inScript = true
			if strings.Contains(lineStripped, "[endscript]") {
				re := regexp.MustCompile(`\[iscript\](.*?)\[endscript\]`)
				m := re.FindStringSubmatch(lineStripped)
				if len(m) > 1 {
					instructions = append(instructions, Instruction{
						"type": "eval",
						"exp":  strings.TrimSpace(m[1]),
					})
				}
				inScript = false
			}
			continue
		}

		if strings.HasPrefix(lineStripped, ";") {
			instructions = append(instructions, Instruction{
				"type": "comment",
				"text": lineStripped[1:],
			})
			continue
		}

		if strings.HasPrefix(lineStripped, "*") {
			re := regexp.MustCompile(`\*([a-zA-Z0-9_-]+)(?:\|.*)?`)
			m := re.FindStringSubmatch(lineStripped)
			labelName := lineStripped[1:]
			if len(m) > 1 {
				labelName = m[1]
			}
			instructions = append(instructions, Instruction{
				"type": "label",
				"name": labelName,
			})
			continue
		}

		if strings.HasPrefix(lineStripped, "@") {
			cmdName, args := parseCommand(lineStripped[1:])
			instructions = append(instructions, compileCommand(cmdName, args, translationCache, &translatableTexts)...)
			continue
		}

		endsWithBackslash := strings.HasSuffix(lineStripped, "\\")
		lineToParse := lineStripped
		if endsWithBackslash {
			lineToParse = lineStripped[:len(lineStripped)-1]
		}

		parsed := parseLineTextAndTags(lineToParse, translationCache, &translatableTexts)
		instructions = append(instructions, parsed...)

		if !endsWithBackslash && hasTextInstruction(parsed) {
			instructions = append(instructions, Instruction{
				"type": "line_feed",
			})
		}
	}
	return instructions, translatableTexts
}

func parseLineTextAndTags(line string, translationCache map[string]string, translatableTexts *[]string) []Instruction {
	re := regexp.MustCompile(`(\[.*?\])`)
	parts := re.Split(line, -1)
	matches := re.FindAllString(line, -1)

	var instructions []Instruction
	
	for i := 0; i < len(parts); i++ {
		part := parts[i]
		if part != "" {
			instructions = append(instructions, Instruction{
				"type": "text_raw",
				"text": part,
			})
		}
		if i < len(matches) {
			tagContent := strings.TrimSpace(matches[i][1 : len(matches[i])-1])
			if tagContent != "" {
				idx := strings.IndexAny(tagContent, " \t")
				var tagName string
				var argStr string
				if idx == -1 {
					tagName = tagContent
				} else {
					tagName = tagContent[:idx]
					argStr = tagContent[idx:]
				}
				args := parseArgs(argStr)

				if tagName == "ruby2" {
					ch := args["ch"]
					text := args["text"]
					instructions = append(instructions, Instruction{
						"type": "ruby_html",
						"html": fmt.Sprintf("<ruby>%s<rt>%s</rt></ruby>", ch, text),
					})
				} else if tagName == "link" {
					instructions = append(instructions, Instruction{
						"type":   "link_start",
						"target": args["target"],
						"exp":    args["exp"],
					})
				} else if tagName == "endlink" {
					instructions = append(instructions, Instruction{
						"type": "link_end",
					})
				} else if tagName == "l" || tagName == "waitclick" {
					instructions = append(instructions, Instruction{
						"type": "wait_click",
					})
				} else if tagName == "p" || tagName == "page" {
					instructions = append(instructions, Instruction{
						"type": "page_break",
					})
				} else if tagName == "er" {
					instructions = append(instructions, Instruction{
						"type": "clear_text",
					})
				} else if tagName == "if" {
					instructions = append(instructions, Instruction{
						"type": "if",
						"exp":  args["exp"],
					})
				} else if tagName == "endif" {
					instructions = append(instructions, Instruction{
						"type": "endif",
					})
				} else if tagName == "eval" {
					instructions = append(instructions, Instruction{
						"type": "eval",
						"exp":  args["exp"],
					})
				} else {
					cmdArgs := make(map[string]interface{})
					for k, v := range args {
						cmdArgs[k] = v
					}
					instructions = append(instructions, Instruction{
						"type": "command",
						"name": tagName,
						"args": cmdArgs,
					})
				}
			}
		}
	}

	var merged []Instruction
	var currentTextBuffer string
	for _, inst := range instructions {
		if inst["type"] == "text_raw" {
			currentTextBuffer += inst["text"].(string)
		} else if inst["type"] == "ruby_html" {
			currentTextBuffer += inst["html"].(string)
		} else {
			if currentTextBuffer != "" {
				txt := strings.TrimSpace(currentTextBuffer)
				if txt != "" {
					*translatableTexts = append(*translatableTexts, txt)
				}
				merged = append(merged, Instruction{
					"type":    "text",
					"text_jp": currentTextBuffer,
					"text_en": translationCache[txt],
				})
				currentTextBuffer = ""
			}
			merged = append(merged, inst)
		}
	}
	if currentTextBuffer != "" {
		txt := strings.TrimSpace(currentTextBuffer)
		if txt != "" {
			*translatableTexts = append(*translatableTexts, txt)
		}
		merged = append(merged, Instruction{
			"type":    "text",
			"text_jp": currentTextBuffer,
			"text_en": translationCache[txt],
		})
	}

	return merged
}

func compileCommand(cmdName string, args map[string]string, translationCache map[string]string, translatableTexts *[]string) []Instruction {
	if cmdName == "if" {
		return []Instruction{{"type": "if", "exp": args["exp"]}}
	} else if cmdName == "endif" {
		return []Instruction{{"type": "endif"}}
	} else if cmdName == "eval" {
		return []Instruction{{"type": "eval", "exp": args["exp"]}}
	} else if cmdName == "l" || cmdName == "waitclick" {
		return []Instruction{{"type": "wait_click"}}
	} else if cmdName == "p" || cmdName == "page" {
		return []Instruction{{"type": "page_break"}}
	} else if cmdName == "er" {
		return []Instruction{{"type": "clear_text"}}
	} else {
		cmdArgs := make(map[string]interface{})
		for k, v := range args {
			cmdArgs[k] = v
		}
		characterNameMap := map[string]string{
			"野草":    "Takano",
			"芽花沢":   "Sawachika",
			"周王":    "Suo",
			"天麻":    "Tenma",
			"夜雲":    "Yakumo",
			"セラ":    "Sera",
			"张间":    "Harima",
			"张间 ":   "Harima",
			"华井":    "Hanai",
			"いいんちょ": "Class Rep",
			"须加乃":   "Sagano",
			"今鸡":    "Imadori",
			"姐ヶ咲":   "Taeko",
			"妹ヶ咲":   "Imegasaki",
		}
		if cmdName == "name" && args["txt"] != "" {
			jpName := args["txt"]
			*translatableTexts = append(*translatableTexts, jpName)
			enName := characterNameMap[jpName]
			if enName == "" {
				enName = translationCache[jpName]
			}
			if enName == "" {
				enName = jpName
			}
			cmdArgs["txt_en"] = enName
		} else if (cmdName == "l_moji" || cmdName == "r_moji") && args["moji"] != "" {
			jpMoji := args["moji"]
			*translatableTexts = append(*translatableTexts, jpMoji)
			enMoji := translationCache[jpMoji]
			if enMoji == "" {
				enMoji = jpMoji
			}
			cmdArgs["moji_en"] = enMoji
		}

		return []Instruction{{
			"type": "command",
			"name": cmdName,
			"args": cmdArgs,
		}}
	}
}

func hasTextInstruction(instructions []Instruction) bool {
	for _, inst := range instructions {
		if inst["type"] == "text" {
			return true
		}
	}
	return false
}
