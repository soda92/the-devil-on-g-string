package main

import (
	"bytes"
	"compress/zlib"
	"encoding/binary"
	"encoding/json"
	"flag"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"unicode/utf16"

	_ "golang.org/x/image/webp"
	"golang.org/x/text/encoding/japanese"
	"golang.org/x/text/transform"
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

// XP3 extraction structure
func utf16LEToString(b []byte) string {
	utf := make([]uint16, len(b)/2)
	for i := range utf {
		utf[i] = uint16(b[2*i]) | (uint16(b[2*i+1]) << 8)
	}
	return string(utf16.Decode(utf))
}

type XP3Segment struct {
	IsCompressed     bool
	Offset           uint64
	UncompressedSize uint64
	CompressedSize   uint64
}

type XP3FileEntry struct {
	Path             string
	IsEncrypted      bool
	UncompressedSize uint64
	CompressedSize   uint64
	Segments         []XP3Segment
	Adler32          uint32
}

func main() {
	port := flag.Int("port", 8080, "port to listen on")
	extractMode := flag.Bool("extract", false, "run asset extraction mode")
	flag.Parse()

	if *extractMode {
		runExtraction()
		return
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

	fmt.Printf("Starting backend server on http://localhost:%d\n", *port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}

// Extraction Command Logic
func runExtraction() {
	gameDir, err := os.Getwd()
	if err != nil {
		log.Fatalf("Failed to get current working directory: %v", err)
	}

	fmt.Printf("Searching for Kirikiri XP3 archives in: %s\n", gameDir)

	var xp3Files []string
	dataXp3Path := filepath.Join(gameDir, "data.xp3")
	if _, err := os.Stat(dataXp3Path); err == nil {
		xp3Files = append(xp3Files, dataXp3Path)
	} else {
		dataXp3UpperPath := filepath.Join(gameDir, "DATA.XP3")
		if _, err := os.Stat(dataXp3UpperPath); err == nil {
			xp3Files = append(xp3Files, dataXp3UpperPath)
		}
	}

	arcDir := filepath.Join(gameDir, "arc")
	if _, err := os.Stat(arcDir); os.IsNotExist(err) {
		arcDir = filepath.Join(gameDir, "ARC")
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
		err := extractXP3(xp3Path, outputDir)
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

func extractXP3(xp3Path, outputDir string) error {
	f, err := os.Open(xp3Path)
	if err != nil {
		return err
	}
	defer f.Close()

	header := make([]byte, 11)
	if _, err := io.ReadFull(f, header); err != nil {
		return err
	}
	expectedHeader := []byte("XP3\r\n \n\x1a\x8b\x67\x01")
	if !bytes.Equal(header, expectedHeader) {
		return fmt.Errorf("invalid XP3 header signature")
	}

	var indexOffset uint64
	if err := binary.Read(f, binary.LittleEndian, &indexOffset); err != nil {
		return err
	}

	if _, err := f.Seek(int64(indexOffset), io.SeekStart); err != nil {
		return err
	}

	var compFlag byte
	if err := binary.Read(f, binary.LittleEndian, &compFlag); err != nil {
		return err
	}

	var compSize, uncompSize uint64
	if err := binary.Read(f, binary.LittleEndian, &compSize); err != nil {
		return err
	}
	if err := binary.Read(f, binary.LittleEndian, &uncompSize); err != nil {
		return err
	}

	indexRaw := make([]byte, compSize)
	if _, err := io.ReadFull(f, indexRaw); err != nil {
		return err
	}

	var indexBytes []byte
	if compFlag == 1 {
		zr, err := zlib.NewReader(bytes.NewReader(indexRaw))
		if err != nil {
			return err
		}
		indexBytes, err = io.ReadAll(zr)
		zr.Close()
		if err != nil {
			return err
		}
	} else {
		indexBytes = indexRaw
	}

	pos := 0
	for pos < len(indexBytes) {
		if pos+12 > len(indexBytes) {
			break
		}
		chunkName := string(indexBytes[pos : pos+4])
		chunkSize := binary.LittleEndian.Uint64(indexBytes[pos+4 : pos+12])
		endPos := pos + 12 + int(chunkSize)

		if chunkName == "File" {
			sub := pos + 12
			var entry XP3FileEntry

			for sub < endPos {
				if sub+12 > endPos {
					break
				}
				subName := string(indexBytes[sub : sub+4])
				subSize := binary.LittleEndian.Uint64(indexBytes[sub+4 : sub+12])
				subEnd := sub + 12 + int(subSize)

				payload := indexBytes[sub+12 : subEnd]

				if subName == "info" {
					if len(payload) >= 22 {
						flags := binary.LittleEndian.Uint32(payload[0:4])
						entry.IsEncrypted = (flags & 0x80000000) != 0
						entry.UncompressedSize = binary.LittleEndian.Uint64(payload[4:12])
						entry.CompressedSize = binary.LittleEndian.Uint64(payload[12:20])
						pathLen := binary.LittleEndian.Uint16(payload[20:22])
						pathBytes := payload[22:]
						if len(pathBytes) > int(pathLen)*2 {
							pathBytes = pathBytes[:int(pathLen)*2]
						}
						entry.Path = utf16LEToString(pathBytes)
					}
				} else if subName == "segm" {
					numSeg := int(subSize) / 28
					for s := 0; s < numSeg; s++ {
						o := s * 28
						isComp := payload[o] != 0
						offset := binary.LittleEndian.Uint64(payload[o+4 : o+12])
						uSize := binary.LittleEndian.Uint64(payload[o+12 : o+20])
						cSize := binary.LittleEndian.Uint64(payload[o+20 : o+28])
						entry.Segments = append(entry.Segments, XP3Segment{
							IsCompressed:     isComp,
							Offset:           offset,
							UncompressedSize: uSize,
							CompressedSize:   cSize,
						})
					}
				} else if subName == "adlr" {
					if len(payload) >= 4 {
						entry.Adler32 = binary.LittleEndian.Uint32(payload[:4])
					}
				}

				sub = subEnd
			}

			if entry.Path != "" {
				fileData, err := readFileData(f, entry)
				if err == nil {
					err = writeExtractedFile(entry.Path, fileData, outputDir)
					if err != nil {
						fmt.Printf("  Warning: Failed to write %s: %v\n", entry.Path, err)
					}
				}
			}

			pos = endPos
		} else {
			pos = endPos
		}
	}

	return nil
}

func readFileData(f *os.File, entry XP3FileEntry) ([]byte, error) {
	var fileData []byte
	for _, seg := range entry.Segments {
		_, err := f.Seek(int64(seg.Offset), io.SeekStart)
		if err != nil {
			return nil, err
		}

		segData := make([]byte, seg.CompressedSize)
		_, err = io.ReadFull(f, segData)
		if err != nil {
			return nil, err
		}

		if seg.IsCompressed {
			zr, err := zlib.NewReader(bytes.NewReader(segData))
			if err != nil {
				return nil, err
			}
			decomp, err := io.ReadAll(zr)
			zr.Close()
			if err != nil {
				return nil, err
			}
			fileData = append(fileData, decomp...)
		} else {
			fileData = append(fileData, segData...)
		}
	}
	return fileData, nil
}

func writeExtractedFile(path string, data []byte, outputDir string) error {
	path = strings.ReplaceAll(path, "\\", "/")
	
	ext := strings.ToLower(filepath.Ext(path))
	if ext == ".tlg" {
		if len(data) >= 12 {
			isWebP := bytes.HasPrefix(data, []byte("RIFF")) && bytes.Contains(data[8:12], []byte("WEBP"))
			isPng := bytes.HasPrefix(data, []byte("\x89PNG"))
			if isWebP {
				path = strings.TrimSuffix(path, ".tlg") + ".webp"
			} else if isPng {
				path = strings.TrimSuffix(path, ".tlg") + ".png"
			}
		}
	}

	targetPath := filepath.Join(outputDir, path)
	dir := filepath.Dir(targetPath)
	err := os.MkdirAll(dir, 0755)
	if err != nil {
		return err
	}

	return os.WriteFile(targetPath, data, 0644)
}

// Shift-JIS decoder
func decodeShiftJIS(b []byte) (string, error) {
	r := transform.NewReader(bytes.NewReader(b), japanese.ShiftJIS.NewDecoder())
	decoded, err := io.ReadAll(r)
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}

type Instruction map[string]interface{}

// Scenario Compiler in Go
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

// POS Coordinates Parser
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
