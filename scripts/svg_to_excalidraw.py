#!/usr/bin/env python3
"""Convert Fluent UI SVG icons into Excalidraw scenes using basic primitives."""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import time
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple

from path_parser import parse_path, polyline_bounds, translate

Point = tuple[float, float]
NS = "{http://www.w3.org/2000/svg}"
SCALE_FACTOR = 4.0
STROKE_COLOR = "#1e1e1e"
FILLED_BACKGROUND_COLOR = "#1971c2"
OVERLAY_COLOR = "#ffffff"
GEOM_RATIO_TOLERANCE = 0.12
GEOM_POINT_TOLERANCE = 0.4


def _roundness() -> dict:
    return {"type": 3}


def _random_int() -> int:
    return random.randint(1, 2**31 - 1)


def _now_ms() -> int:
    return int(time.time() * 1000)


def _relative_points(points: List[Point]) -> tuple[List[List[float]], float, float, float, float]:
    min_x, min_y, max_x, max_y = polyline_bounds(points)
    relative = translate(points, min_x, min_y)
    width = max_x - min_x
    height = max_y - min_y
    return [[float(x), float(y)] for x, y in relative], min_x, min_y, width, height


def _points_close(a: Point, b: Point, eps: float = 1e-3) -> bool:
    return abs(a[0] - b[0]) <= eps and abs(a[1] - b[1]) <= eps


def _dedupe_polyline(points: Sequence[Point]) -> List[Point]:
    deduped: List[Point] = []
    for pt in points:
        if not deduped or not _points_close(pt, deduped[-1]):
            deduped.append(pt)
    if len(deduped) > 1 and _points_close(deduped[0], deduped[-1]):
        deduped.pop()
    return deduped


def _circle_bounds(points: Sequence[Point]) -> Optional[Tuple[float, float, float, float]]:
    if len(points) < 4:
        return None
    closed = _points_close(points[0], points[-1])
    pts = list(points[:-1]) if closed else list(points)
    if len(pts) < 4:
        return None
    min_x, min_y, max_x, max_y = polyline_bounds(pts)
    width = max_x - min_x
    height = max_y - min_y
    if width <= 0 or height <= 0:
        return None
    max_dim = max(width, height)
    if abs(width - height) > max_dim * GEOM_RATIO_TOLERANCE:
        return None
    cx = min_x + width / 2
    cy = min_y + height / 2
    radius = (width + height) / 4
    tolerance = max(radius * 0.2, GEOM_POINT_TOLERANCE)
    for x, y in pts:
        dist = math.hypot(x - cx, y - cy)
        if abs(dist - radius) > tolerance:
            return None
    return (min_x, min_y, width, height)


def _square_bounds(points: Sequence[Point]) -> Optional[Tuple[float, float, float, float]]:
    deduped = _dedupe_polyline(points)
    if len(deduped) != 4:
        return None
    min_x, min_y, max_x, max_y = polyline_bounds(deduped)
    width = max_x - min_x
    height = max_y - min_y
    if width <= 0 or height <= 0:
        return None
    max_dim = max(width, height)
    if abs(width - height) > max_dim * GEOM_RATIO_TOLERANCE:
        return None
    tol = max(max_dim * 0.1, GEOM_POINT_TOLERANCE)
    horizontal = 0
    vertical = 0
    for idx in range(len(deduped)):
        x1, y1 = deduped[idx]
        x2, y2 = deduped[(idx + 1) % len(deduped)]
        dx = x2 - x1
        dy = y2 - y1
        if abs(dx) <= tol and abs(dy) <= tol:
            return None
        if abs(dx) <= tol:
            vertical += 1
        elif abs(dy) <= tol:
            horizontal += 1
        else:
            return None
    if horizontal != 2 or vertical != 2:
        return None
    return (min_x, min_y, width, height)


def _classify_polyline(points: Sequence[Point]) -> Tuple[str, Optional[Tuple[float, float, float, float]]]:
    circle_bounds = _circle_bounds(points)
    if circle_bounds:
        return ("ellipse", circle_bounds)
    square_bounds = _square_bounds(points)
    if square_bounds:
        return ("rectangle", square_bounds)
    return ("line", None)


def _expand_shorthand_hex(color: str) -> str:
    if len(color) == 4:
        return "#" + "".join(ch * 2 for ch in color[1:])
    return color


def _parse_style_attribute(elem: ET.Element) -> dict[str, str]:
    style = elem.attrib.get("style")
    if not style:
        return {}
    entries: dict[str, str] = {}
    for part in style.split(";"):
        if not part.strip():
            continue
        if ":" not in part:
            continue
        key, value = part.split(":", 1)
        entries[key.strip().lower()] = value.strip()
    return entries


WHITE_VALUES = {"white", "#fff", "#ffffff"}


def _resolve_fill_color(elem: ET.Element, *, filled_icon: bool) -> str:
    if not filled_icon:
        return "#ffffff"
    style_map = _parse_style_attribute(elem)
    raw = elem.attrib.get("fill") or style_map.get("fill")
    if not raw:
        return FILLED_BACKGROUND_COLOR
    value = raw.strip().lower()
    if value in {"none", "transparent"}:
        return "transparent"
    if value in WHITE_VALUES:
        return "#ffffff"
    if value.startswith("#") and len(value) in {4, 7}:
        normalized = _expand_shorthand_hex(value)
        if normalized.lower() in WHITE_VALUES:
            return "#ffffff"
    return FILLED_BACKGROUND_COLOR


def _element_area(element: dict) -> float:
    width = float(element.get("width", 0.0))
    height = float(element.get("height", 0.0))
    return abs(width * height)


def _element_sort_key(index: int, element: dict) -> tuple[int, float, int]:
    background = element.get("backgroundColor", "transparent") or "transparent"
    is_filled = background.lower() != "transparent"
    area = _element_area(element)
    return (0 if is_filled else 1, -area, index)


def _element_bounds(element: dict) -> tuple[float, float, float, float]:
    x = float(element.get("x", 0.0))
    y = float(element.get("y", 0.0))
    width = float(element.get("width", 0.0))
    height = float(element.get("height", 0.0))
    min_x = min(x, x + width)
    min_y = min(y, y + height)
    max_x = max(x, x + width)
    max_y = max(y, y + height)
    return min_x, min_y, max_x, max_y


def _bounds_contains(outer: tuple[float, float, float, float], inner: tuple[float, float, float, float], margin: float = 0.5) -> bool:
    outer_min_x, outer_min_y, outer_max_x, outer_max_y = outer
    inner_min_x, inner_min_y, inner_max_x, inner_max_y = inner
    return (
        inner_min_x >= outer_min_x - margin
        and inner_min_y >= outer_min_y - margin
        and inner_max_x <= outer_max_x + margin
        and inner_max_y <= outer_max_y + margin
    )


def _apply_overlay_colors(elements: List[dict]) -> None:
    base_color = FILLED_BACKGROUND_COLOR.lower()
    filled_info: List[tuple[float, dict, tuple[float, float, float, float], str]] = []
    for element in elements:
        color = (element.get("backgroundColor") or "transparent").lower()
        if color == "transparent":
            continue
        area = _element_area(element)
        bounds = _element_bounds(element)
        filled_info.append((area, element, bounds, color))

    if not filled_info:
        return

    filled_info.sort(key=lambda item: item[0])  # ascending area
    larger_sorted = sorted(filled_info, key=lambda item: item[0], reverse=True)

    for area, element, bounds, color in filled_info:
        if color != base_color:
            continue
        for larger_area, outer_element, outer_bounds, outer_color in larger_sorted:
            if larger_area <= area:
                break
            if outer_color != base_color:
                continue
            if _bounds_contains(outer_bounds, bounds):
                element["backgroundColor"] = OVERLAY_COLOR
                break


def _create_line(points: List[Point], *, fill_color: str) -> dict | None:
    if len(points) < 2:
        return None
    rel_points, min_x, min_y, width, height = _relative_points(points)
    if width < 1e-6 and height < 1e-6:
        return None
    rel_points = [[x * SCALE_FACTOR, y * SCALE_FACTOR] for x, y in rel_points]
    min_x *= SCALE_FACTOR
    min_y *= SCALE_FACTOR
    width *= SCALE_FACTOR
    height *= SCALE_FACTOR
    is_closed = len(points) > 2 and _points_close(points[0], points[-1])
    background = fill_color if is_closed else "transparent"
    return {
        "type": "line",
        "version": 1,
        "versionNonce": _random_int(),
        "isDeleted": False,
        "id": str(uuid.uuid4()),
        "fillStyle": "solid",
        "strokeWidth": 2,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "angle": 0,
        "x": float(min_x),
        "y": float(min_y),
        "strokeColor": STROKE_COLOR,
        "backgroundColor": background,
        "width": float(width),
        "height": float(height),
        "seed": _random_int(),
        "groupIds": [],
        "roundness": _roundness(),
        "boundElements": [],
        "updated": _now_ms(),
        "link": None,
        "locked": False,
        "points": rel_points,
        "lastCommittedPoint": None,
        "startBinding": None,
        "endBinding": None,
        "startArrowhead": None,
        "endArrowhead": None,
    }


def _create_rectangle(elem: ET.Element, *, fill_color: str) -> dict | None:
    try:
        x = float(elem.attrib.get("x", "0"))
        y = float(elem.attrib.get("y", "0"))
        width = float(elem.attrib["width"])
        height = float(elem.attrib["height"])
    except (KeyError, ValueError):
        return None
    if width <= 0 or height <= 0:
        return None
    x *= SCALE_FACTOR
    y *= SCALE_FACTOR
    width *= SCALE_FACTOR
    height *= SCALE_FACTOR
    background = fill_color
    return {
        "type": "rectangle",
        "version": 1,
        "versionNonce": _random_int(),
        "isDeleted": False,
        "id": str(uuid.uuid4()),
        "fillStyle": "solid",
        "strokeWidth": 2,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "angle": 0,
        "x": x,
        "y": y,
        "strokeColor": STROKE_COLOR,
        "backgroundColor": background,
        "width": width,
        "height": height,
        "seed": _random_int(),
        "groupIds": [],
        "roundness": _roundness(),
        "boundElements": [],
        "updated": _now_ms(),
        "link": None,
        "locked": False,
    }


def _create_rectangle_from_bounds(
    bounds: Tuple[float, float, float, float], *, fill_color: str
) -> dict | None:
    min_x, min_y, width, height = bounds
    if width <= 0 or height <= 0:
        return None
    x = min_x * SCALE_FACTOR
    y = min_y * SCALE_FACTOR
    width *= SCALE_FACTOR
    height *= SCALE_FACTOR
    background = fill_color
    return {
        "type": "rectangle",
        "version": 1,
        "versionNonce": _random_int(),
        "isDeleted": False,
        "id": str(uuid.uuid4()),
        "fillStyle": "solid",
        "strokeWidth": 2,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "angle": 0,
        "x": x,
        "y": y,
        "strokeColor": STROKE_COLOR,
        "backgroundColor": background,
        "width": width,
        "height": height,
        "seed": _random_int(),
        "groupIds": [],
        "roundness": _roundness(),
        "boundElements": [],
        "updated": _now_ms(),
        "link": None,
        "locked": False,
    }


def _create_ellipse(
    bounds: Tuple[float, float, float, float], *, fill_color: str
) -> dict | None:
    min_x, min_y, width, height = bounds
    if width <= 0 or height <= 0:
        return None
    x = min_x * SCALE_FACTOR
    y = min_y * SCALE_FACTOR
    width *= SCALE_FACTOR
    height *= SCALE_FACTOR
    background = fill_color
    return {
        "type": "ellipse",
        "version": 1,
        "versionNonce": _random_int(),
        "isDeleted": False,
        "id": str(uuid.uuid4()),
        "fillStyle": "solid",
        "strokeWidth": 2,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "angle": 0,
        "x": x,
        "y": y,
        "strokeColor": STROKE_COLOR,
        "backgroundColor": background,
        "width": width,
        "height": height,
        "seed": _random_int(),
        "groupIds": [],
        "boundElements": [],
        "updated": _now_ms(),
        "link": None,
        "locked": False,
        "startBinding": None,
        "endBinding": None,
    }


def _collect_paths(root: ET.Element) -> Iterable[ET.Element]:
    for elem in root.iter():
        if elem.tag == f"{NS}path":
            yield elem


def _collect_rects(root: ET.Element) -> Iterable[ET.Element]:
    for elem in root.iter():
        if elem.tag == f"{NS}rect":
            yield elem


def svg_to_elements(svg_path: Path, *, filled: bool) -> List[dict]:
    tree = ET.parse(svg_path)
    root = tree.getroot()
    elements: List[dict] = []

    for rect in _collect_rects(root):
        fill_color = _resolve_fill_color(rect, filled_icon=filled)
        element = _create_rectangle(rect, fill_color=fill_color)
        if element:
            elements.append(element)

    for path_elem in _collect_paths(root):
        data = path_elem.attrib.get("d")
        if not data:
            continue
        try:
            polylines = parse_path(data)
        except Exception:
            continue
        fill_color = _resolve_fill_color(path_elem, filled_icon=filled)
        for poly in polylines:
            shape_type, bounds = _classify_polyline(poly)
            if shape_type == "ellipse" and bounds is not None:
                ellipse = _create_ellipse(bounds, fill_color=fill_color)
                if ellipse:
                    elements.append(ellipse)
                continue
            if shape_type == "rectangle" and bounds is not None:
                rect = _create_rectangle_from_bounds(bounds, fill_color=fill_color)
                if rect:
                    elements.append(rect)
                continue
            line = _create_line(poly, fill_color=fill_color)
            if line:
                elements.append(line)

    return elements


def build_scene(elements: List[dict]) -> dict:
    _apply_overlay_colors(elements)
    indexed_elements = list(enumerate(elements))
    sorted_elements = [element for _, element in sorted(indexed_elements, key=lambda item: _element_sort_key(item[0], item[1]))]
    group_id = str(uuid.uuid4())
    for element in sorted_elements:
        group_ids = list(element.get("groupIds", []))
        if group_id not in group_ids:
            group_ids.append(group_id)
        element["groupIds"] = group_ids
    return {
        "type": "excalidraw",
        "version": 2,
        "source": "fluentui-icons-to-excalidraw",
        "elements": sorted_elements,
        "appState": {
            "gridSize": None,
            "viewBackgroundColor": "#ffffff",
        },
        "files": {},
    }


def convert_icons(input_dir: Path, output_dir: Path) -> None:
    svg_files = sorted(input_dir.rglob("*.svg"))
    if not svg_files:
        raise SystemExit(f"No SVG files found under {input_dir}")

    for svg_file in svg_files:
        stem = svg_file.stem.lower()
        filled = "_filled" in stem
        elements = svg_to_elements(svg_file, filled=filled)
        scene = build_scene(elements)
        relative = svg_file.relative_to(input_dir)
        output_path = output_dir / relative.with_suffix(".excalidraw")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as handle:
            json.dump(scene, handle, indent=2)
            handle.write("\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path("vendor/icons_24px/assets"),
        help="Directory containing Fluent UI 24px SVG assets.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("artifacts/excalidraw"),
        help="Destination directory for generated Excalidraw JSON files.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    random.seed(0)
    convert_icons(args.input_dir, args.output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
