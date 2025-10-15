#!/usr/bin/env python3
"""Fetch Fluent UI icon metadata via GitHub API without cloning the repo."""

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
REPO_NAME = "fluentui-system-icons"
RAW_BASE = f"https://raw.githubusercontent.com/{REPO_OWNER}/{REPO_NAME}/main/"
ASSETS_PREFIX = "assets/"
SVG_SUFFIX = ".svg"
SIZE_PATTERN = re.compile(r"^(?P<prefix>ic_fluent_[a-z0-9_]+?)_(?P<size>\d+)(?P<suffix>_[a-z0-9]+)?\.svg$", re.IGNORECASE)
TREES_ENDPOINT = f"{GITHUB_API_ROOT}/repos/{REPO_OWNER}/{REPO_NAME}/git/trees"

@dataclass
class IconEntry:
    path: str
    size: int
    url: str
    size_px: int

    @property
    def filename(self) -> str:
        return os.path.basename(self.path)

    def to_dict(self) -> dict:
        return {
            "path": self.path,
            "size": self.size,
            "url": self.url,
            "size_px": self.size_px,
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


def _fetch_tree(sha: str, *, recursive: bool = False) -> dict:
    suffix = "?recursive=1" if recursive else ""
    url = f"{TREES_ENDPOINT}/{quote(sha)}{suffix}"
    return _http_get_json(url)


def _walk_tree(sha: str, base_path: str) -> Iterable[Tuple[str, int, str]]:
    tree = _fetch_tree(sha, recursive=True)
    if not tree.get("truncated"):
        for node in tree.get("tree", []):
            if node.get("type") != "blob":
                continue
            relative = node.get("path", "")
            full = f"{base_path}/{relative}" if relative else base_path
            yield full, node.get("size", 0), node.get("url", "")
        return

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
        next_base = f"{base_path}/{node_path}" if node_path else base_path
        yield from _walk_tree(node["sha"], next_base)


def _normalize_key(filename: str) -> Tuple[str, int] | None:
    match = SIZE_PATTERN.match(filename)
    if not match:
        return None
    size = int(match.group("size"))
    suffix = match.group("suffix") or ""
    key = f"{match.group('prefix')}{suffix}"
    return key, size


def _normalize_stem(stem: str) -> Optional[str]:
    if not stem:
        return None
    lower = stem.lower()
    if not lower.startswith("ic_fluent_"):
        return None
    normalized = _normalize_key(f"{stem}.svg")
    if normalized:
        key, _ = normalized
        return key.lower()
    return lower


def _discover_used_keys(paths: Iterable[Path]) -> Set[str]:
    discovered: Set[str] = set()

    def _collect(path: Path) -> None:
        normalized = _normalize_stem(path.stem)
        if normalized:
            discovered.add(normalized)

    for base in paths:
        if not base:
            continue
        if not base.exists():
            continue
        if base.is_file():
            if base.suffix.lower() in {".excalidraw", ".svg"}:
                _collect(base)
            continue
        for suffix in ("*.svg", "*.excalidraw"):
            for file_path in base.rglob(suffix):
                _collect(file_path)
    return discovered


def extract_icon_entries(target_keys: Optional[Set[str]] = None) -> List[IconEntry]:
    best_entries: Dict[str, IconEntry] = {}
    root_tree = _fetch_tree("main", recursive=False)
    assets_entry = next((item for item in root_tree.get("tree", []) if item.get("path") == "assets"), None)
    if not assets_entry or assets_entry.get("type") != "tree":
        raise RuntimeError("Unable to locate assets directory in repository tree")

    def _register_icon(path: str, size: int, url: str) -> None:
        filename = os.path.basename(path)
        parsed = _normalize_key(filename)
        if not parsed:
            return
        key, px = parsed
        key_lower = key.lower()
        if target_keys is not None and key_lower not in target_keys:
            return
        existing = best_entries.get(key)
        if existing and px <= existing.size_px:
            return
        best_entries[key] = IconEntry(path=path, size=size, url=url, size_px=px)

    base_prefix = ASSETS_PREFIX.rstrip("/")
    for path, size, url in _walk_tree(assets_entry["sha"], base_prefix):
        if not path.endswith(SVG_SUFFIX):
            continue
        _register_icon(path, size, url)

    if target_keys is not None:
        matched_keys = {key.lower() for key in best_entries.keys()}
        missing = sorted(target_keys - matched_keys)
        if missing:
            sample = ", ".join(missing[:10])
            more = "" if len(missing) <= 10 else f" (and {len(missing) - 10} more)"
            print(
                f"Warning: {len(missing)} used icons were not found upstream: {sample}{more}",
                file=sys.stderr,
            )

    return sorted(best_entries.values(), key=lambda icon: icon.path)


def download_icon(icon: IconEntry, root: str, overwrite: bool) -> None:
    dest_path = os.path.join(root, icon.path)
    if not overwrite and os.path.exists(dest_path):
        return
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    encoded_path = quote(icon.path, safe="/")
    request = Request(
        f"{RAW_BASE}{encoded_path}",
        headers=_headers("application/octet-stream"),
    )
    with urlopen(request) as response:
        if response.status != 200:
            raise RuntimeError(
                f"Failed to download {icon.path}: {response.status} {response.reason}"
            )
        payload = response.read()
    with open(dest_path, "wb") as handle:
        handle.write(payload)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch metadata for Fluent UI icons and optionally download them.",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Write metadata JSON to this file instead of stdout.",
    )
    parser.add_argument(
        "--download-dir",
        type=str,
        help="Download all matching SVGs into this directory, preserving repo structure.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-download files even if they already exist at the destination.",
    )
    parser.add_argument(
        "--used-dir",
        action="append",
        type=Path,
        help=(
            "Directory containing .svg or .excalidraw files used to filter which icons are fetched. "
            "May be provided multiple times. When omitted, the script fetches the entire icon set."
        ),
    )
    parser.add_argument(
        "--include-all",
        action="store_true",
        help="Ignore used-dir filtering and include every icon discovered in the upstream repository.",
    )
    return parser.parse_args(argv)


def main() -> int:
    try:
        args = parse_args(sys.argv[1:])

        target_keys: Optional[Set[str]] = None
        if not args.include_all and args.used_dir:
            target_keys = _discover_used_keys(args.used_dir)
            if target_keys:
                print(f"Filtering to {len(target_keys)} used icon variants", file=sys.stderr)
            else:
                print("No used icons discovered in specified directories; fetching full icon list", file=sys.stderr)
                target_keys = None

        icons = extract_icon_entries(target_keys)
        output = {"count": len(icons), "icons": [icon.to_dict() for icon in icons]}

        if args.output:
            output_path = Path(args.output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with output_path.open("w", encoding="utf-8") as handle:
                json.dump(output, handle, indent=2)
                handle.write("\n")
        else:
            json.dump(output, sys.stdout, indent=2)
            sys.stdout.write("\n")

        if args.download_dir:
            total = len(icons)
            for index, icon in enumerate(icons, start=1):
                download_icon(icon, args.download_dir, overwrite=args.force)
                if index % 100 == 0 or index == total:
                    print(f"Downloaded {index}/{total}: {icon.path}", file=sys.stderr)
        return 0
    except Exception as error:  # noqa: BLE001 - surface errors to caller
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
