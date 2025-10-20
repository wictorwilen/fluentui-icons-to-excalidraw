#!/usr/bin/env python3
"""Fetch Fluent UI emoji metadata via GitHub API without cloning the repo."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import quote
from urllib.request import Request, urlopen

GITHUB_API_ROOT = "https://api.github.com"
REPO_OWNER = "microsoft"
REPO_NAME = "fluentui-emoji"
RAW_BASE = f"https://raw.githubusercontent.com/{REPO_OWNER}/{REPO_NAME}/main"
ASSETS_PREFIX = "assets/"
SVG_SUFFIX = ".svg"
TREES_ENDPOINT = f"{GITHUB_API_ROOT}/repos/{REPO_OWNER}/{REPO_NAME}/git/trees"

# Only use flat emoji style (others have gradients incompatible with Excalidraw)
EMOJI_STYLES = ["flat"]

# Skin tone folders
SKIN_TONE_FOLDERS = {"default", "light", "medium-light", "medium", "medium-dark", "dark"}

@dataclass
class EmojiEntry:
    path: str
    name: str
    style: str
    skin_tone: Optional[str]
    url: str
    size: int
    unicode_codepoint: Optional[str] = None
    group: Optional[str] = None
    keywords: List[str] = None

    def __post_init__(self):
        if self.keywords is None:
            self.keywords = []

    @property
    def filename(self) -> str:
        return os.path.basename(self.path)

    @property
    def display_name(self) -> str:
        """Generate a display name for the emoji."""
        name = self.name.replace("_", " ").title()
        if self.skin_tone and self.skin_tone != "default":
            tone_name = self.skin_tone.replace("-", " ").title()
            name = f"{name} ({tone_name})"
        return name

    def to_dict(self) -> dict:
        return {
            "path": self.path,
            "name": self.name,
            "display_name": self.display_name,
            "style": self.style,
            "skin_tone": self.skin_tone,
            "url": self.url,
            "size": self.size,
            "unicode_codepoint": self.unicode_codepoint,
            "group": self.group,
            "keywords": self.keywords,
        }


def _headers(accept: str) -> dict:
    headers = {"Accept": accept}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _http_get_json(url: str):
    request = Request(url, headers=_headers("application/vnd.github+json"))
    with urlopen(request) as response:
        if response.status != 200:
            raise RuntimeError(f"GitHub API request failed: {response.status} {response.reason}")
        payload = response.read().decode("utf-8")
    return json.loads(payload)


def _http_get_text(url: str) -> str:
    """Fetch text content from URL."""
    request = Request(url, headers=_headers("text/plain"))
    with urlopen(request) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP request failed: {response.status} {response.reason}")
        return response.read().decode("utf-8")


def _fetch_tree(sha: str, *, recursive: bool = False) -> dict:
    suffix = "?recursive=1" if recursive else ""
    url = f"{TREES_ENDPOINT}/{quote(sha)}{suffix}"
    return _http_get_json(url)


def _walk_tree(sha: str, base_path: str) -> Iterable[Tuple[str, int, str]]:
    """Walk the GitHub tree and yield file paths, sizes, and URLs."""
    tree = _fetch_tree(sha, recursive=True)
    if not tree.get("truncated"):
        for node in tree.get("tree", []):
            if node.get("type") != "blob":
                continue
            relative = node.get("path", "")
            full = f"{base_path}/{relative}" if relative else base_path
            yield full, node.get("size", 0), node.get("url", "")
        return

    # Handle truncated trees by walking recursively
    limited_tree = _fetch_tree(sha, recursive=False)
    for node in limited_tree.get("tree", []):
        node_type = node.get("type")
        node_path = node.get("path", "")
        if node_type == "blob":
            full = f"{base_path}/{node_path}" if node_path else base_path
            yield full, node.get("size", 0), node.get("url", "")
            continue
        if node_type != "tree":
            continue
        next_base = f"{base_path}/{node_path}" if base_path else node_path
        yield from _walk_tree(node["sha"], next_base)


def _parse_emoji_path(path: str) -> Tuple[str, str, Optional[str]] | None:
    """Parse emoji path to extract name, style, and skin tone.
    
    Expected structure:
    /assets/emoji_name/style/filename.svg
    /assets/emoji_name/skin_tone/style/filename.svg
    """
    # Remove leading slash if present
    if path.startswith("/"):
        path = path[1:]
    
    if not path.startswith(ASSETS_PREFIX) or not path.endswith(SVG_SUFFIX):
        return None
    
    relative_path = path[len(ASSETS_PREFIX):]  # Remove 'assets/' prefix
    parts = relative_path.split("/")
    
    if len(parts) < 3:  # Need at least emoji_name/style/filename.svg
        return None
    
    emoji_name = parts[0]
    
    # Check if second part is a skin tone folder
    if parts[1].lower() in SKIN_TONE_FOLDERS:
        if len(parts) < 4:  # Need emoji_name/skin_tone/style/filename.svg
            return None
        skin_tone = parts[1].lower()
        style = parts[2].lower()
    else:
        skin_tone = None
        style = parts[1].lower()
    
        # Validate style (only flat is supported)
        if style.lower() != "flat":
            return None
    
    return emoji_name, style, skin_tone


def _fetch_emoji_metadata(emoji_name: str) -> dict:
    """Fetch metadata.json for a specific emoji if it exists."""
    metadata_url = f"{RAW_BASE}{ASSETS_PREFIX}{emoji_name}/metadata.json"
    try:
        metadata_text = _http_get_text(metadata_url)
        return json.loads(metadata_text)
    except Exception:
        # Metadata might not exist for all emojis
        return {}


def _download_svg_content(url: str, download_dir: Path, emoji_path: str) -> bool:
    """Download SVG content to local file."""
    try:
        svg_content = _http_get_text(url)
        
        # Create the full local path, ensuring it's relative to download_dir
        # Remove leading slash if present to make it relative
        clean_path = emoji_path.lstrip('/')
        local_path = download_dir / clean_path
        local_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write SVG content
        with open(local_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        
        return True
    except Exception as e:
        print(f"Failed to download {emoji_path}: {e}", file=sys.stderr)
        return False


def _build_emoji_index(used_emojis: Optional[Set[str]] = None) -> Dict[str, List[EmojiEntry]]:
    """Build an index of all emojis from the repository."""
    # Get the main branch SHA
    url = f"{GITHUB_API_ROOT}/repos/{REPO_OWNER}/{REPO_NAME}/git/ref/heads/main"
    ref_data = _http_get_json(url)
    main_sha = ref_data["object"]["sha"]
    
    emoji_index = {}
    processed_emojis = set()
    
    print("Discovering emojis from GitHub repository...")
    
    for path, size, api_url in _walk_tree(main_sha, ""):
        parsed = _parse_emoji_path(path)
        if not parsed:
            continue
            
        emoji_name, style, skin_tone = parsed
        
        # Filter by used emojis if specified
        if used_emojis and emoji_name not in used_emojis:
            continue
        
        # Fetch metadata for this emoji (once per emoji)
        metadata = {}
        if emoji_name not in processed_emojis:
            metadata = _fetch_emoji_metadata(emoji_name)
            processed_emojis.add(emoji_name)
        
        # Create emoji entry with URL encoding for spaces
        from urllib.parse import quote
        encoded_path = quote(path, safe='/')
        
        emoji_entry = EmojiEntry(
            path=path,
            name=emoji_name,
            style=style,
            skin_tone=skin_tone,
            url=f"{RAW_BASE}{encoded_path}",
            size=size,
            unicode_codepoint=metadata.get("unicode"),
            group=metadata.get("group"),
            keywords=metadata.get("keywords", [])
        )
        
        if emoji_name not in emoji_index:
            emoji_index[emoji_name] = []
        emoji_index[emoji_name].append(emoji_entry)
    
    return emoji_index


def _find_used_emojis(used_dir: Path) -> Set[str]:
    """Scan a directory for emoji references and extract emoji names."""
    used_emojis = set()
    
    if not used_dir.exists():
        print(f"Warning: Used directory {used_dir} does not exist", file=sys.stderr)
        return used_emojis
    
    print(f"Scanning {used_dir} for emoji references...")
    
    # Look for any references to emoji names in various file types
    for pattern in ["*.py", "*.js", "*.ts", "*.json", "*.md", "*.txt"]:
        for file_path in used_dir.rglob(pattern):
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    
                    # Look for emoji-like patterns (this is heuristic)
                    # Could be improved with specific patterns based on usage
                    emoji_patterns = re.findall(r'\b[a-z][a-z0-9_]*(?:_emoji|_face|_hand)\b', content)
                    for pattern in emoji_patterns:
                        used_emojis.add(pattern)
                        
            except Exception as e:
                print(f"Warning: Could not read {file_path}: {e}", file=sys.stderr)
    
    print(f"Found {len(used_emojis)} potentially used emojis")
    return used_emojis


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", "-o", 
                       type=Path, 
                       default="metadata/emojis.json",
                       help="Output JSON file path")
    parser.add_argument("--download-dir", "-d",
                       type=Path,
                       default="vendor/emojis",
                       help="Directory to download emoji SVG files")
    parser.add_argument("--used-dir",
                       type=Path,
                       help="Directory to scan for used emojis (filters download)")
    parser.add_argument("--include-all", 
                       action="store_true",
                       help="Include all emojis regardless of --used-dir")
    parser.add_argument("--force", "-f",
                       action="store_true", 
                       help="Overwrite existing metadata and downloads")
    parser.add_argument("--preferred-style",
                       choices=EMOJI_STYLES,
                       default="flat",
                       help="Emoji style (only 'flat' supported for Excalidraw compatibility)")
    parser.add_argument("--no-download",
                       action="store_true",
                       help="Generate metadata only, skip SVG downloads")
    parser.add_argument("--limit",
                       type=int,
                       help="Limit number of emojis to process (for testing)")
    
    args = parser.parse_args()
    
    # Determine which emojis to process
    used_emojis = None
    if args.used_dir and not args.include_all:
        used_emojis = _find_used_emojis(args.used_dir)
    
    # Check if output already exists
    if args.output.exists() and not args.force:
        print(f"Output file {args.output} already exists. Use --force to overwrite.")
        return 1
    
    # Build emoji index
    try:
        emoji_index = _build_emoji_index(used_emojis)
        
        # Limit emojis if specified
        if args.limit:
            limited_index = {}
            count = 0
            for emoji_name, variants in emoji_index.items():
                if count >= args.limit:
                    break
                limited_index[emoji_name] = variants
                count += 1
            emoji_index = limited_index
            
    except Exception as e:
        print(f"Failed to build emoji index: {e}", file=sys.stderr)
        return 1
    
    if not emoji_index:
        print("No emojis found.")
        return 1
    
    print(f"Found {len(emoji_index)} unique emojis")
    
    # Prepare output data
    output_data = {
        "metadata": {
            "source": f"https://github.com/{REPO_OWNER}/{REPO_NAME}",
            "total_emojis": len(emoji_index),
            "preferred_style": args.preferred_style,
            "styles": EMOJI_STYLES,
            "skin_tones": list(SKIN_TONE_FOLDERS)
        },
        "emojis": {}
    }
    
    # Process each emoji
    downloaded_count = 0
    failed_downloads = []
    
    for emoji_name, variants in emoji_index.items():
        output_data["emojis"][emoji_name] = {
            "name": emoji_name,
            "variants": [variant.to_dict() for variant in variants]
        }
        
        # Download SVGs if requested
        if not args.no_download:
            args.download_dir.mkdir(parents=True, exist_ok=True)
            
            for variant in variants:
                # Only download flat style emojis
                should_download = (variant.style.lower() == "flat")
                
                if should_download:
                    emoji_path = variant.path
                    if args.download_dir.exists() and not args.force:
                        local_path = args.download_dir / emoji_path
                        if local_path.exists():
                            continue  # Skip existing files unless force is specified
                    
                    if _download_svg_content(variant.url, args.download_dir, emoji_path):
                        downloaded_count += 1
                    else:
                        failed_downloads.append(emoji_path)
    
    # Save metadata
    try:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        print(f"Saved metadata to {args.output}")
    except Exception as e:
        print(f"Failed to save metadata: {e}", file=sys.stderr)
        return 1
    
    # Report results
    if not args.no_download:
        print(f"Downloaded {downloaded_count} emoji SVG files")
        if failed_downloads:
            print(f"Failed to download {len(failed_downloads)} files:")
            for path in failed_downloads[:10]:  # Show first 10 failures
                print(f"  {path}")
            if len(failed_downloads) > 10:
                print(f"  ... and {len(failed_downloads) - 10} more")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())