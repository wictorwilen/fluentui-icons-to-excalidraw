#!/usr/bin/env python3
"""Enhanced SVG to Excalidraw converter specifically for emojis with color mapping."""

from __future__ import annotations

import argparse
import colorsys
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Dict, Tuple
import re

# Excalidraw's standard color palette
EXCALIDRAW_COLORS = {
    # Standard colors
    "#000000": "black",
    "#343a40": "dark_gray", 
    "#495057": "gray",
    "#c92a2a": "red",
    "#a61e4d": "pink",
    "#862e9c": "purple",
    "#5f3dc4": "violet",
    "#364fc7": "indigo",
    "#1864ab": "blue",
    "#0b7285": "cyan",
    "#087f5b": "teal",
    "#2b8a3e": "green",
    "#5c940d": "lime",
    "#e67700": "orange",
    "#d9480f": "red_orange",
    "#f08c00": "yellow",
    
    # Additional useful colors
    "#ffffff": "white",
    "#f8f9fa": "light_gray",
    "#1971c2": "blue_primary",  # Fluent UI blue
    "#ffd43b": "yellow_bright",
    "#ff6b6b": "red_light",
    "#51cf66": "green_light",
    "#74c0fc": "blue_light",
    "#d0bfff": "purple_light",
    "#ffa8a8": "pink_light",
}

def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert RGB to hex color."""
    return f"#{r:02x}{g:02x}{b:02x}"

def color_distance(color1: Tuple[int, int, int], color2: Tuple[int, int, int]) -> float:
    """Calculate perceptual distance between two RGB colors."""
    # Convert to LAB color space for better perceptual distance
    r1, g1, b1 = [x/255.0 for x in color1]
    r2, g2, b2 = [x/255.0 for x in color2]
    
    # Simple RGB distance (good enough for our purposes)
    return ((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)**0.5

def find_closest_excalidraw_color(hex_color: str) -> str:
    """Find the closest Excalidraw color to the given hex color."""
    if not hex_color or hex_color.lower() in ['none', 'transparent']:
        return "transparent"
    
    # Normalize the input color
    hex_color = hex_color.lower().strip()
    if not hex_color.startswith('#'):
        # Handle named colors or other formats
        if hex_color in ['black', '#000', '#000000']:
            return "#000000"
        elif hex_color in ['white', '#fff', '#ffffff']:
            return "#ffffff"
        else:
            return "#000000"  # Default fallback
    
    try:
        target_rgb = hex_to_rgb(hex_color)
    except (ValueError, IndexError):
        return "#000000"  # Fallback for invalid colors
    
    # If it's already an Excalidraw color, return it
    if hex_color in EXCALIDRAW_COLORS:
        return hex_color
    
    # Find the closest color by distance
    min_distance = float('inf')
    closest_color = "#000000"
    
    for excali_hex in EXCALIDRAW_COLORS.keys():
        try:
            excali_rgb = hex_to_rgb(excali_hex)
            distance = color_distance(target_rgb, excali_rgb)
            if distance < min_distance:
                min_distance = distance
                closest_color = excali_hex
        except (ValueError, IndexError):
            continue
    
    return closest_color

def create_color_mapped_svg(input_svg: Path, output_svg: Path) -> None:
    """Create a new SVG with colors mapped to closest Excalidraw colors."""
    try:
        with open(input_svg, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        
        # Find all color references in the SVG
        color_patterns = [
            r'fill="(#[0-9a-fA-F]{3,6})"',
            r'stroke="(#[0-9a-fA-F]{3,6})"',
            r'fill:\s*(#[0-9a-fA-F]{3,6})',
            r'stroke:\s*(#[0-9a-fA-F]{3,6})',
        ]
        
        for pattern in color_patterns:
            def replace_color(match):
                original_color = match.group(1)
                mapped_color = find_closest_excalidraw_color(original_color)
                return match.group(0).replace(original_color, mapped_color)
            
            svg_content = re.sub(pattern, replace_color, svg_content)
        
        # Write the mapped SVG
        with open(output_svg, 'w', encoding='utf-8') as f:
            f.write(svg_content)
            
    except Exception as e:
        print(f"Warning: Failed to map colors for {input_svg}: {e}", file=sys.stderr)
        # Fallback: just copy the original
        import shutil
        shutil.copy2(input_svg, output_svg)

def _run_svg_converter_with_color_mapping(input_dir: Path, output_dir: Path) -> Tuple[int, int, int, int]:
    """Run the SVG converter with color mapping for better emoji colors."""
    scripts_dir = Path(__file__).parent
    svg_converter = scripts_dir / "svg_to_excalidraw.py"
    
    # Create temporary directory for color-mapped SVGs
    with tempfile.TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        
        print("Mapping emoji colors to Excalidraw palette...")
        
        # Map colors for all SVG files
        mapped_count = 0
        for svg_file in input_dir.rglob("*.svg"):
            relative_path = svg_file.relative_to(input_dir)
            mapped_svg = temp_dir / relative_path
            mapped_svg.parent.mkdir(parents=True, exist_ok=True)
            
            create_color_mapped_svg(svg_file, mapped_svg)
            mapped_count += 1
        
        print(f"Mapped colors for {mapped_count} emoji SVG files")
        
        # Run the converter on color-mapped files
        cmd = [
            "python3", str(svg_converter),
            "--input-dir", str(temp_dir),
            "--output-dir", str(output_dir),
            "--preserve-colors"  # Preserve our mapped colors
        ]
        
        print(f"Running: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            # Parse the output to extract statistics
            output = result.stdout
            processed = 0
            converted = 0
            duplicates = 0
            failed = 0
            
            print(output)  # Show the converter output
            
            # Look for the standard output format
            for line in output.split('\n'):
                if "Processed" in line and "converted" in line:
                    # Extract numbers from the line
                    import re
                    numbers = re.findall(r'\d+', line)
                    if len(numbers) >= 3:
                        processed = int(numbers[0])
                        converted = int(numbers[1])
                        duplicates = int(numbers[2])
                    break
            
            return processed, converted, duplicates, failed
            
        except subprocess.CalledProcessError as e:
            print(f"SVG converter failed: {e}", file=sys.stderr)
            if e.stderr:
                print(f"Error output: {e.stderr}", file=sys.stderr)
            return 0, 0, 0, 1
        except Exception as e:
            print(f"Failed to run SVG converter: {e}", file=sys.stderr)
            return 0, 0, 0, 1

def _organize_emoji_svgs(input_dir: Path, temp_dir: Path, preferred_style: str = "flat") -> int:
    """Organize emoji SVGs into a flat structure that the main converter can handle."""
    if not input_dir.exists():
        print(f"Input directory {input_dir} does not exist")
        return 0
    
    temp_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    
    print(f"Organizing emoji SVGs from {input_dir}...")
    
    # Walk through emoji directories and copy SVG files to temp directory
    for emoji_dir in input_dir.iterdir():
        if not emoji_dir.is_dir():
            continue
            
        emoji_name = emoji_dir.name
        
        # Check different possible locations for the flat style (case variations)
        style_variations = ["flat", "Flat", "FLAT"]
        
        for style in style_variations:
            possible_paths = [
                emoji_dir / style,  # Direct style folder
                emoji_dir / "default" / style,  # With skin tone folder  
                emoji_dir / "Default" / style,  # With capitalized skin tone folder
            ]
            
            for style_path in possible_paths:
                if style_path.exists() and style_path.is_dir():
                    # Find SVG files in this style directory
                    svg_files = list(style_path.glob("*.svg"))
                    
                    if svg_files:
                        # Use the first SVG file found
                        svg_file = svg_files[0]
                        
                        # Copy to temp directory with clean name
                        safe_name = emoji_name.replace(" ", "_").replace("-", "_")
                        temp_file = temp_dir / f"{safe_name}.svg"
                        
                        import shutil
                        shutil.copy2(svg_file, temp_file)
                        count += 1
                        break
            else:
                continue
            break  # Found and copied, move to next emoji
    
    print(f"Organized {count} emoji SVG files")
    return count

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", "-i",
                       type=Path,
                       default="vendor/emojis/assets",
                       help="Input directory containing emoji SVG files")
    parser.add_argument("--output-dir", "-o", 
                       type=Path,
                       default="artifacts/excalidraw_emojis",
                       help="Output directory for Excalidraw files")
    parser.add_argument("--preferred-style",
                       choices=["flat"],
                       default="flat", 
                       help="Emoji style (only 'flat' supported for Excalidraw compatibility)")
    parser.add_argument("--force", "-f",
                       action="store_true",
                       help="Overwrite existing Excalidraw files")
    
    args = parser.parse_args()
    
    # Create temporary directory for organized SVGs
    with tempfile.TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        
        # Organize emoji SVGs into flat structure 
        count = _organize_emoji_svgs(args.input_dir, temp_dir, args.preferred_style)
        
        if count == 0:
            print("No emoji SVG files found to process")
            return 1
        
        # Remove existing output if force is specified
        if args.force and args.output_dir.exists():
            import shutil
            shutil.rmtree(args.output_dir)
        
        # Run the SVG converter with color mapping
        processed, converted, duplicates, failed = _run_svg_converter_with_color_mapping(temp_dir, args.output_dir)
    
    # Report results
    print(f"\nEmoji Conversion Summary:")
    print(f"  Organized: {count}")
    print(f"  Processed: {processed}")
    print(f"  Converted: {converted}")
    print(f"  Duplicates (skipped): {duplicates}")
    print(f"  Failed: {failed}")
    
    if failed > 0 or converted == 0:
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())