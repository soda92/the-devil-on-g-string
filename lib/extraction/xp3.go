package extraction

import (
	"bytes"
	"compress/zlib"
	"encoding/binary"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

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

func extractXP3(xp3Path, outputDir, prependPrefix string) error {
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
					err = writeExtractedFile(entry.Path, fileData, outputDir, prependPrefix)
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

func writeExtractedFile(path string, data []byte, outputDir, prependPrefix string) error {
	path = strings.ReplaceAll(path, "\\", "/")
	
	if prependPrefix != "" && !strings.HasPrefix(strings.ToLower(path), strings.ToLower(prependPrefix)) {
		path = prependPrefix + path
	}

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
