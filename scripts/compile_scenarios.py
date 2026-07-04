import os
import glob
import re
import json

extracted_dir = "/home/soda/Downloads/G弦上的魔王/extracted_data/scenario"
output_dir = "/home/soda/Downloads/G弦上的魔王/compiled_scenarios"

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
            elif tag_name in ('l', 'waitclick', 'wvl'):
                instructions.append({
                    "type": "wait_click"
                })
            elif tag_name in ('p', 'page', 'np'):
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
                elif cmd_name in ('l', 'waitclick', 'wvl'):
                    instructions.append({
                        "type": "wait_click"
                    })
                elif cmd_name in ('p', 'page', 'np'):
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
                        "text_en": current_text_buffer  # Use Chinese text for both language modes
                    })
                    current_text_buffer = ""
                merged_elements.append(elem)
                
        if current_text_buffer:
            merged_elements.append({
                "type": "text",
                "text_jp": current_text_buffer,
                "text_en": current_text_buffer  # Use Chinese text for both language modes
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
        
    ks_files = glob.glob(os.path.join(extracted_dir, "*.ks"))
    print(f"Found {len(ks_files)} scenario files to compile.")
    
    for ksf in ks_files:
        scen_name = os.path.splitext(os.path.basename(ksf))[0]
        instructions = compile_scenario_file(ksf)
        
        # Set Chinese names directly without mapping/translation
        for inst in instructions:
            if inst["type"] == "command":
                cmd_name = inst["name"]
                args = inst["args"]
                if cmd_name == "nm" and "t" in args:
                    args["t_en"] = args["t"]
                elif cmd_name == "name" and "txt" in args:
                    args["txt_en"] = args["txt"]
                    
        # Output scenario JSON
        output_filepath = os.path.join(output_dir, f"{scen_name}.json")
        with open(output_filepath, "w", encoding="utf-8") as out:
            json.dump({
                "name": scen_name,
                "instructions": instructions
            }, out, ensure_ascii=False, indent=2)
        print(f"Compiled and saved {output_filepath}")

if __name__ == "__main__":
    main()
