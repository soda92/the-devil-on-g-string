import os
import glob
import re
import json
import urllib.request
import urllib.parse
import time

extracted_dir = "/home/soda/Downloads/G弦上的魔王/extracted_data/scenario"
output_dir = "/home/soda/Downloads/G弦上的魔王/compiled_scenarios"
cache_file = "/home/soda/Downloads/G弦上的魔王/translation_cache.json"

# Load translation cache
translation_cache = {}
if os.path.exists(cache_file):
    try:
        with open(cache_file, "r", encoding="utf-8") as f:
            translation_cache = json.load(f)
        print(f"Loaded {len(translation_cache)} cached translations.")
    except Exception as e:
        print(f"Error loading cache: {e}")

def save_cache():
    try:
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(translation_cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving cache: {e}")

def translate_single(text, target_lang='en', source_lang='zh-CN'):
    if not text.strip():
        return ""
    
    # Check cache first
    if text in translation_cache:
        return translation_cache[text]
        
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source_lang}&tl={target_lang}&dt=t&q=" + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            translated = "".join([segment[0] for segment in res[0] if segment[0]])
            translated = translated.strip()
            translation_cache[text] = translated
            return translated
    except Exception as e:
        print(f"Single translate error: {e}")
        return text

def translate_batch(texts, target_lang='en', source_lang='zh-CN'):
    if not texts:
        return []
        
    # Filter out texts already in cache
    missing_texts = [t for t in texts if t not in translation_cache]
    
    if missing_texts:
        print(f"Translating {len(missing_texts)} new texts in batches...")
        batch_size = 40
        for i in range(0, len(missing_texts), batch_size):
            chunk = missing_texts[i : i + batch_size]
            cleaned_chunk = [t.replace('\n', ' ').strip() for t in chunk]
            joined_text = '\n'.join(cleaned_chunk)
            
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source_lang}&tl={target_lang}&dt=t&q=" + urllib.parse.quote(joined_text)
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            
            success = False
            try:
                with urllib.request.urlopen(req) as response:
                    res = json.loads(response.read().decode('utf-8'))
                    translated_joined = "".join([segment[0] for segment in res[0] if segment[0]])
                    translated_lines = translated_joined.split('\n')
                    if translated_lines and not translated_lines[-1]:
                        translated_lines.pop()
                        
                    if len(translated_lines) == len(chunk):
                        for original, translated in zip(chunk, translated_lines):
                            translation_cache[original] = translated.strip()
                        success = True
                        print(f"  Translated batch {i//batch_size + 1}: {len(chunk)} lines.")
                    else:
                        print(f"  Batch {i//batch_size + 1} size mismatch: got {len(translated_lines)}, expected {len(chunk)}. Falling back to single.")
            except Exception as e:
                print(f"  Batch {i//batch_size + 1} error: {e}. Falling back to single.")
                
            if not success:
                # Fallback to single translate for this chunk
                for idx, original in enumerate(chunk):
                    translate_single(original, target_lang, source_lang)
                    print(f"    Translated single {i + idx + 1}/{len(missing_texts)}")
                    time.sleep(0.1) # short throttle
            
            save_cache()
            time.sleep(0.5) # throttle between batches
            
    # Return all translations from cache
    return [translation_cache.get(t, t) for t in texts]

def parse_args(arg_str):
    args = {}
    # Handles name="val", name='val', name=val
    matches = re.findall(r'([a-zA-Z0-9_]+)\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s]*))', arg_str)
    for match in matches:
        name, val1, val2, val3 = match
        val = val1 or val2 or val3
        # Clean up any leftover unclosed/mismatched quotes
        val = val.strip().strip('"').strip("'")
        args[name] = val
    return args

def parse_line_text_and_tags(line):
    # Splits the line by inline bracketed tags
    parts = re.split(r'(\[.*?\])', line)
    instructions = []
    
    for part in parts:
        if not part:
            continue
        if part.startswith('[') and part.endswith(']'):
            tag_content = part[1:-1].strip()
            if not tag_content:
                continue
            
            # Extract tag name and arg string
            match = re.match(r'([a-zA-Z0-9_]+)(?:\s+(.*))?', tag_content)
            if not match:
                continue
            
            tag_name = match.group(1)
            arg_str = match.group(2) or ""
            args = parse_args(arg_str)
            
            if tag_name == 'ruby2':
                # Compile ruby macro inline as an HTML tag
                ch = args.get('ch', '')
                text = args.get('text', '')
                instructions.append({
                    "type": "ruby_html",
                    "html": f"<ruby>{ch}<rt>{text}</rt></ruby>"
                })
            elif tag_name == 'link':
                instructions.append({
                    "type": "link_start",
                    "target": args.get('target', ''),
                    "exp": args.get('exp', '')
                })
            elif tag_name == 'endlink':
                instructions.append({
                    "type": "link_end"
                })
            elif tag_name in ('l', 'waitclick'):
                instructions.append({
                    "type": "wait_click"
                })
            elif tag_name in ('p', 'page'):
                instructions.append({
                    "type": "page_break"
                })
            elif tag_name == 'er':
                instructions.append({
                    "type": "clear_text"
                })
            elif tag_name == 'if':
                instructions.append({
                    "type": "if",
                    "exp": args.get('exp', '')
                })
            elif tag_name == 'endif':
                instructions.append({
                    "type": "endif"
                })
            elif tag_name == 'eval':
                instructions.append({
                    "type": "eval",
                    "exp": args.get('exp', '')
                })
            else:
                instructions.append({
                    "type": "command",
                    "name": tag_name,
                    "args": args
                })
        else:
            # It's plain text
            instructions.append({
                "type": "text_raw",
                "text": part
            })
            
    return instructions

def compile_scenario_file(filepath):
    print(f"Parsing {os.path.basename(filepath)}...")
    instructions = []
    
    # Try reading as UTF-16, fallback to cp932
    try:
        with open(filepath, "r", encoding="utf-16") as f:
            lines = f.readlines()
    except Exception:
        with open(filepath, "r", encoding="cp932", errors="ignore") as f:
            lines = f.readlines()
        
    in_script = False
    script_content = []
    
    for line_idx, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue
            
        # 1. Check if we are inside a script block
        if in_script:
            if line_stripped.startswith('@endscript') or '[endscript]' in line_stripped:
                in_script = False
                cleaned_script = []
                for s_line in script_content:
                    s_clean = s_line.strip()
                    if s_clean.startswith('//') or s_clean.startswith(';'):
                        continue
                    cleaned_script.append(s_clean)
                script_str = " ".join(cleaned_script)
                if script_str:
                    instructions.append({
                        "type": "eval",
                        "exp": script_str
                    })
                script_content = []
            else:
                script_content.append(line_stripped)
            continue
            
        # 2. Check for start of script block
        if line_stripped.startswith('@iscript') or '[iscript]' in line_stripped:
            in_script = True
            if '[endscript]' in line_stripped:
                # Inline script block
                parts = re.search(r'\[iscript\](.*?)\[endscript\]', line_stripped)
                if parts:
                    instructions.append({
                        "type": "eval",
                        "exp": parts.group(1).strip()
                    })
                in_script = False
            continue
            
        # 3. Comment line
        if line_stripped.startswith(';'):
            instructions.append({
                "type": "comment",
                "text": line_stripped[1:]
            })
            continue
            
        # 4. Label line
        if line_stripped.startswith('*'):
            # e.g. *start|or *init
            match = re.match(r'\*([a-zA-Z0-9_-]+)(?:\|.*)?', line_stripped)
            label_name = match.group(1) if match else line_stripped[1:]
            instructions.append({
                "type": "label",
                "name": label_name
            })
            continue
            
        # 5. Line-level command
        if line_stripped.startswith('@'):
            match = re.match(r'@([a-zA-Z0-9_]+)(?:\s+(.*))?', line_stripped)
            if match:
                cmd_name = match.group(1)
                arg_str = match.group(2) or ""
                args = parse_args(arg_str)
                
                if cmd_name == 'if':
                    instructions.append({
                        "type": "if",
                        "exp": args.get('exp', '')
                    })
                elif cmd_name == 'endif':
                    instructions.append({
                        "type": "endif"
                    })
                elif cmd_name == 'eval':
                    instructions.append({
                        "type": "eval",
                        "exp": args.get('exp', '')
                    })
                elif cmd_name in ('l', 'waitclick'):
                    instructions.append({
                        "type": "wait_click"
                    })
                elif cmd_name in ('p', 'page'):
                    instructions.append({
                        "type": "page_break"
                    })
                elif cmd_name == 'er':
                    instructions.append({
                        "type": "clear_text"
                    })
                else:
                    instructions.append({
                        "type": "command",
                        "name": cmd_name,
                        "args": args
                    })
            continue
            
        # 6. Text line (could contain inline tags)
        # Check if line ends with backslash (no-newline indicator)
        ends_with_backslash = line_stripped.endswith('\\')
        line_to_parse = line_stripped[:-1] if ends_with_backslash else line_stripped
        
        parsed_elements = parse_line_text_and_tags(line_to_parse)
        
        # Merge consecutive raw text and ruby_html elements into a single text node
        merged_elements = []
        current_text_buffer = ""
        
        for elem in parsed_elements:
            if elem["type"] == "text_raw":
                current_text_buffer += elem["text"]
            elif elem["type"] == "ruby_html":
                current_text_buffer += elem["html"]
            else:
                if current_text_buffer:
                    merged_elements.append({
                        "type": "text",
                        "text_jp": current_text_buffer,
                        "text_en": ""
                    })
                    current_text_buffer = ""
                merged_elements.append(elem)
                
        if current_text_buffer:
            merged_elements.append({
                "type": "text",
                "text_jp": current_text_buffer,
                "text_en": ""
            })
            
        instructions.extend(merged_elements)
        
        # If it doesn't end with backslash and has at least one text element, append line feed
        if not ends_with_backslash and any(e["type"] == "text" for e in merged_elements):
            instructions.append({
                "type": "line_feed"
            })
            
    return instructions

def main():
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    ks_files = [os.path.join(extracted_dir, "g01.ks")]
    all_scenarios = {}
    
    # 1. Parse all scenarios and gather translatable texts
    translation_queue = set()
    
    for ksf in ks_files:
        scen_name = os.path.splitext(os.path.basename(ksf))[0]
        instructions = compile_scenario_file(ksf)
        all_scenarios[scen_name] = instructions
        
        # Collect text and specific command arguments for translation
        for inst in instructions:
            if inst["type"] == "text":
                text = inst["text_jp"].strip()
                if text:
                    translation_queue.add(text)
            elif inst["type"] == "command":
                cmd_name = inst["name"]
                args = inst["args"]
                # In G-String, nm (dialogue) uses 't' for character name
                if cmd_name == "nm" and "t" in args:
                    translation_queue.add(args["t"])
                # Fallback check for standard KAG name tags
                elif cmd_name == "name" and "txt" in args:
                    translation_queue.add(args["txt"])
                elif cmd_name in ("l_moji", "r_moji") and "moji" in args:
                    translation_queue.add(args["moji"])
                    
    print(f"Total unique texts to translate: {len(translation_queue)}")
    
    # 2. Run batch translations
    # G-String Chinese is zh-CN
    translate_batch(list(translation_queue), target_lang='en', source_lang='zh-CN')
    
    character_name_map = {
        "秋元": "Akimoto",
        "京介": "Kyousuke",
        "浅井": "Asai",
        "宇佐美": "Usami",
        "荣一": "Eiichi",
        "栄一": "Eiichi",
        "花音": "Kanon",
        "美奈": "Mina",
        "水羽": "Mizuha",
        "椿": "Tsubaki",
        "权三": "Gonzou",
        "时田": "Tokida",
        "雪": "Yuki",
        "沙织": "Saori",
        "织田": "Oda",
        "佐伯": "Saeki",
        "魔王": "Maou",
    }

    # 3. Populate translated values and output JSON files
    for scen_name, instructions in all_scenarios.items():
        for inst in instructions:
            if inst["type"] == "text":
                text = inst["text_jp"].strip()
                inst["text_en"] = translation_cache.get(text, text)
            elif inst["type"] == "command":
                cmd_name = inst["name"]
                args = inst["args"]
                if cmd_name == "nm" and "t" in args:
                    cn_name = args["t"]
                    args["t_en"] = character_name_map.get(cn_name, translation_cache.get(cn_name, cn_name))
                elif cmd_name == "name" and "txt" in args:
                    cn_name = args["txt"]
                    args["txt_en"] = character_name_map.get(cn_name, translation_cache.get(cn_name, cn_name))
                elif cmd_name in ("l_moji", "r_moji") and "moji" in args:
                    args["moji_en"] = translation_cache.get(args["moji"], args["moji"])
                    
        # Output scenario JSON
        output_filepath = os.path.join(output_dir, f"{scen_name}.json")
        with open(output_filepath, "w", encoding="utf-8") as out:
            json.dump({
                "name": scen_name,
                "instructions": instructions
            }, out, ensure_ascii=False, indent=2)
        print(f"Saved {output_filepath}")

if __name__ == "__main__":
    main()
