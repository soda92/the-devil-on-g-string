import os
import re
import json

base_dir = "/home/soda/Downloads/G弦上的魔王/extracted_data"
file_map_output = "/home/soda/Downloads/G弦上的魔王/file_map.json"
sprite_positions_output = "/home/soda/Downloads/G弦上的魔王/sprite_positions.json"

def rename_tlg_files():
    print("--- Renaming TLG files ---")
    tlg_count = 0
    webp_count = 0
    png_count = 0
    other_count = 0

    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith(".tlg"):
                tlg_count += 1
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "rb") as f:
                        magic = f.read(12)
                    
                    # WebP files usually start with RIFF followed by 4 bytes (size) and then WEBP
                    is_webp = magic.startswith(b"RIFF") and b"WEBP" in magic[8:12]
                    # PNG files start with \x89PNG
                    is_png = magic.startswith(b"\x89PNG")
                    
                    if is_webp:
                        new_path = file_path[:-4] + ".webp"
                        os.rename(file_path, new_path)
                        webp_count += 1
                    elif is_png:
                        new_path = file_path[:-4] + ".png"
                        os.rename(file_path, new_path)
                        png_count += 1
                    elif magic.startswith(b"TLG0.0") or magic.startswith(b"TLG5.0") or magic.startswith(b"TLG6.0"):
                        try:
                            import sys
                            sys.path.append("/home/soda/Downloads/G弦上的魔王/tlg_py")
                            import tlg
                            
                            if magic.startswith(b"TLG0.0"):
                                img = tlg.from_tlg0_file(file_path)
                            elif magic.startswith(b"TLG5.0"):
                                img = tlg.from_tlg5_file(file_path)
                            else:
                                img = tlg.from_tlg6_file(file_path)
                            
                            new_path = file_path[:-4] + ".png"
                            img.save(new_path, "PNG")
                            os.remove(file_path)
                            png_count += 1
                        except Exception as convert_err:
                            print(f"Error converting TLG file {file_path}: {convert_err}")
                            other_count += 1
                    else:
                        # Fallback or check if it is some other format
                        print(f"Unknown magic for {file}: {magic}")
                        other_count += 1
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

    print(f"Processed {tlg_count} .tlg files: {webp_count} renamed to .webp, {png_count} renamed to .png, {other_count} unknown.")

def parse_pos_files():
    print("--- Parsing POS files ---")
    sprite_positions = {}
    pos_files_found = 0
    
    # We look for .pos files in the extracted folders
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith(".pos"):
                pos_files_found += 1
                file_path = os.path.join(root, file)
                sprite_name = os.path.splitext(file)[0]
                
                try:
                    # POS files are UTF-16 encoded with BOM
                    with open(file_path, "r", encoding="utf-16") as f:
                        content = f.read()
                    
                    # Look for: string "base_name", int x, int y
                    # Example content: [ string "st_eiichi_a_se_01_s", int 70, int 91 ]
                    match = re.search(r'string\s+"([^"]+)"\s*,\s*int\s+([0-9-]+)\s*,\s*int\s+([0-9-]+)', content)
                    if match:
                        base_sprite = match.group(1)
                        x = int(match.group(2))
                        y = int(match.group(3))
                        sprite_positions[sprite_name] = {
                            "base": base_sprite,
                            "x": x,
                            "y": y
                        }
                    else:
                        print(f"Failed to parse POS content in {file}: {content[:100]}")
                except Exception as e:
                    print(f"Error reading POS file {file_path}: {e}")
                    
    with open(sprite_positions_output, "w", encoding="utf-8") as f:
        json.dump(sprite_positions, f, ensure_ascii=False, indent=2)
        
    print(f"Parsed {pos_files_found} POS files and saved {len(sprite_positions)} mappings to {sprite_positions_output}")

def build_file_map():
    print("--- Building File Map ---")
    file_map = {}
    duplicate_warnings = {}
    
    # Standard directories containing assets
    asset_folders = [
        "bgimage", "bgm", "evimage", "evimage_h_scene", 
        "face", "fgimage", "image", "others", "rule", "sound", 
        "voice", "voice_h_scene", "alter", "font", "bland_call"
    ]
    
    for folder in asset_folders:
        folder_path = os.path.join(base_dir, folder)
        if not os.path.exists(folder_path):
            continue
            
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                # Skip .pos files since they are metadata, and any hidden files
                if file.lower().endswith(".pos") or file.startswith("."):
                    continue
                    
                base_name = os.path.splitext(file)[0]
                # Calculate path relative to extracted_data
                rel_path = os.path.relpath(os.path.join(root, file), base_dir)
                web_path = "/" + rel_path.replace(os.sep, "/")
                
                # Check for duplicates
                if base_name in file_map:
                    if base_name not in duplicate_warnings:
                        duplicate_warnings[base_name] = [file_map[base_name]]
                    duplicate_warnings[base_name].append(web_path)
                else:
                    file_map[base_name] = web_path
                    
    # Also index scenario JSON files (we'll place them in scenarios/ folder)
    # The game runner expects scenarios to map as well
    # (Or they are handled separately, but we can add them to file_map if we want)
    
    with open(file_map_output, "w", encoding="utf-8") as f:
        json.dump(file_map, f, ensure_ascii=False, indent=2)
        
    print(f"Created file map with {len(file_map)} entries at {file_map_output}")
    if duplicate_warnings:
        print(f"Warning: {len(duplicate_warnings)} duplicate base names detected:")
        for name, paths in list(duplicate_warnings.items())[:5]:
            print(f"  {name}: {paths}")
        if len(duplicate_warnings) > 5:
            print(f"  ... and {len(duplicate_warnings) - 5} more.")

if __name__ == "__main__":
    rename_tlg_files()
    parse_pos_files()
    build_file_map()
