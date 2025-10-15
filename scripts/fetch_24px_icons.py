#!/usr/bin/env python3
"""Fetch 24px Fluent UI icon metadata via GitHub API without cloning the repo."""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Iterable, List
from urllib.parse import quote
from urllib.request import Request, urlopen

GITHUB_API_ROOT = "https://api.github.com"
REPO_OWNER = "microsoft"
REPO_NAME = "fluentui-system-icons"
TREE_ENDPOINT = (
    f"{GITHUB_API_ROOT}/repos/{REPO_OWNER}/{REPO_NAME}/git/trees/main?recursive=1"
)
RAW_BASE = f"https://raw.githubusercontent.com/{REPO_OWNER}/{REPO_NAME}/main/"
ASSETS_PREFIX = "assets/"
SVG_SUFFIX = ".svg"
TARGET_SIZE = "24"
VARIANTS = ("regular", "filled")

@dataclass
class IconEntry:
    path: str
    size: int
    url: str

    @property
    def filename(self) -> str:
        return os.path.basename(self.path)

    def to_dict(self) -> dict:
        return {"path": self.path, "size": self.size, "url": self.url}


def _http_get(url: str) -> dict:
    request = Request(url, headers=_headers("application/vnd.github+json"))
    with urlopen(request) as response:
        if response.status != 200:
            raise RuntimeError(f"GitHub API request failed: {response.status} {response.reason}")
        payload = response.read().decode("utf-8")
    return json.loads(payload)


def _headers(accept: str) -> dict:
    headers = {"Accept": accept}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def iter_tree_entries(tree: dict) -> Iterable[dict]:
    for entry in tree.get("tree", []):
        if entry.get("type") == "blob":
            yield entry


def matches_icon(entry_path: str) -> bool:
    if not entry_path.startswith(ASSETS_PREFIX):
        return False
    if not entry_path.endswith(SVG_SUFFIX):
        return False
    filename = os.path.basename(entry_path)
    if TARGET_SIZE not in filename:
        return False
    return any(filename.endswith(f"_{variant}{SVG_SUFFIX}") for variant in VARIANTS)


def extract_icon_entries(tree: dict) -> List[IconEntry]:
    icons: List[IconEntry] = []
    for entry in iter_tree_entries(tree):
        path = entry.get("path", "")
        if matches_icon(path):
            icons.append(
                IconEntry(
                    path=path,
                    size=entry.get("size", 0),
                    url=entry.get("url", ""),
                )
            )
    return icons


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
        description="Fetch metadata for Fluent UI 24px icons and optionally download them.",
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
    return parser.parse_args(argv)


def main() -> int:
    try:
        args = parse_args(sys.argv[1:])
        tree = _http_get(TREE_ENDPOINT)
        icons = extract_icon_entries(tree)
        output = {"count": len(icons), "icons": [icon.to_dict() for icon in icons]}

        if args.output:
            with open(args.output, "w", encoding="utf-8") as handle:
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
