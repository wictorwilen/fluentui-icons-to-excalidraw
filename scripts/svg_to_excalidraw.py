#!/usr/bin/env python3
"""Convert Fluent UI SVG icons into Excalidraw scenes using basic primitives."""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import re
import sys
import time
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple

from path_parser import parse_path, polyline_bounds, translate

Point = tuple[float, float]
NS = "{http://www.w3.org/2000/svg}"
TARGET_VIEWBOX_SIZE = 24.0
BASE_SCALE = 4.0
STROKE_COLOR = "#1e1e1e"
FILLED_BACKGROUND_COLOR = "#1971c2"
OVERLAY_COLOR = "#ffffff"
GEOM_RATIO_TOLERANCE = 0.12
GEOM_POINT_TOLERANCE = 0.4
CIRCLE_RADIAL_TOLERANCE = 0.1
CIRCLE_AREA_RATIO_TOLERANCE = 0.12


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
    tolerance = max(radius * CIRCLE_RADIAL_TOLERANCE, GEOM_POINT_TOLERANCE)
    for x, y in pts:
        dist = math.hypot(x - cx, y - cy)
        if abs(dist - radius) > tolerance:
            return None
    rect_area = width * height
    if rect_area <= 0:
        return None
    area = 0.0
    for index, (x1, y1) in enumerate(pts):
        x2, y2 = pts[(index + 1) % len(pts)]
        area += x1 * y2 - x2 * y1
    area = abs(area) / 2
    ratio = area / rect_area
    if abs(ratio - (math.pi / 4)) > CIRCLE_AREA_RATIO_TOLERANCE:
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
SIZE_PATTERN = re.compile(r"^(?P<prefix>ic_fluent_.*?)_(?P<size>(?:16|20|24|28|32|48|56|64|72|96|128|256))(?P<suffix>_.*)$")


def _strip_size_token(stem: str) -> str:
    match = SIZE_PATTERN.match(stem)
    if not match:
        return stem
    return f"{match.group('prefix')}{match.group('suffix')}"


def _parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _clamp_opacity(value: float | None) -> float | None:
    if value is None:
        return None
    return max(0.0, min(1.0, value))


def _combine_opacities(*values: float | None) -> float | None:
    result = 1.0
    has_value = False
    for value in values:
        if value is None:
            continue
        result *= _clamp_opacity(value)
        has_value = True
    return result if has_value else None


def _normalize_hex_color(color: str) -> str:
    if color.startswith("#"):
        hex_part = color[1:]
        if len(hex_part) == 3:
            expanded = "".join(ch * 2 for ch in hex_part)
            return f"#{expanded.lower()}"
        if len(hex_part) == 6:
            return f"#{hex_part.lower()}"
        if len(hex_part) == 8:
            return f"#{hex_part.lower()}"
    return color


def _apply_opacity_to_color(color: str, opacity: float | None) -> str:
    if color in {"transparent", "none"}:
        return "transparent"
    normalized = _normalize_hex_color(color)
    if not normalized.startswith("#"):
        return normalized
    if opacity is None or opacity >= 1:
        return normalized
    alpha = int(round(_clamp_opacity(opacity) * 255))
    return f"{normalized}{alpha:02x}"


def _extract_stop_color(stop: ET.Element) -> tuple[str | None, float | None]:
    style_map = _parse_style_attribute(stop)
    color = stop.attrib.get("stop-color") or style_map.get("stop-color")
    if not color:
        return None, None
    opacity = stop.attrib.get("stop-opacity") or style_map.get("stop-opacity")
    opacity_value = _parse_float(opacity) if opacity is not None else None
    return color.strip(), opacity_value


def _build_paint_map(root: ET.Element) -> dict[str, tuple[str, float | None]]:
    paint_map: dict[str, tuple[str, float | None]] = {}
    for defs in root.findall(f".//{NS}defs"):
        for child in defs:
            paint_id = child.attrib.get("id")
            if not paint_id:
                continue
            key = f"url(#{paint_id})"
            if child.tag in {f"{NS}linearGradient", f"{NS}radialGradient"}:
                chosen_color: str | None = None
                chosen_opacity: float | None = None
                fallback_color: str | None = None
                fallback_opacity: float | None = None
                for stop in child.findall(f"{NS}stop"):
                    color, stop_opacity = _extract_stop_color(stop)
                    if color:
                        if fallback_color is None:
                            fallback_color = color
                            fallback_opacity = stop_opacity
                        opacity_value = 1.0 if stop_opacity is None else stop_opacity
                        if opacity_value > 0:
                            chosen_color = color
                            chosen_opacity = stop_opacity
                            break
                if chosen_color is None and fallback_color is not None:
                    chosen_color = fallback_color
                    chosen_opacity = fallback_opacity
                if chosen_color:
                    paint_map[key] = (chosen_color, chosen_opacity)
            elif child.tag == f"{NS}solidColor":
                color = child.attrib.get("solid-color")
                if color:
                    opacity = child.attrib.get("solid-opacity")
                    paint_map[key] = (color, _parse_float(opacity) if opacity else None)
    return paint_map


def _resolve_fill_color(
    elem: ET.Element,
    *,
    filled_icon: bool,
    preserve_fill: bool,
    paint_map: dict[str, tuple[str, float | None]],
) -> str:
    style_map = _parse_style_attribute(elem)
    raw = (elem.attrib.get("fill") or style_map.get("fill") or "").strip()
    fill_opacity = _parse_float(elem.attrib.get("fill-opacity") or style_map.get("fill-opacity"))

    if preserve_fill:
        if not raw or raw.lower() in {"none", "transparent"}:
            return "transparent"
        base_color = raw
        base_opacity: float | None = None
        if base_color.startswith("url("):
            resolved = paint_map.get(base_color)
            if not resolved:
                return "transparent"
            base_color, gradient_opacity = resolved
            base_opacity = gradient_opacity
        color = _normalize_hex_color(base_color)
        final_opacity = _combine_opacities(base_opacity, fill_opacity)
        return _apply_opacity_to_color(color, final_opacity)

    if not raw:
        return FILLED_BACKGROUND_COLOR if filled_icon else "#ffffff"
    value = raw.lower()
    if value in {"none", "transparent"}:
        return "transparent"
    if not filled_icon:
        if value in WHITE_VALUES:
            return "#ffffff"
        if value.startswith("#") and len(value) in {4, 7}:
            normalized = _expand_shorthand_hex(value)
            if normalized.lower() in WHITE_VALUES:
                return "#ffffff"
        return "#ffffff"
    if value in WHITE_VALUES:
        return "#ffffff"
    if value.startswith("#") and len(value) in {4, 7}:
        normalized = _expand_shorthand_hex(value)
        if normalized.lower() in WHITE_VALUES:
            return "#ffffff"
    return FILLED_BACKGROUND_COLOR


def _resolve_stroke_color(
    elem: ET.Element,
    *,
    preserve_stroke: bool,
    paint_map: dict[str, tuple[str, float | None]],
) -> str:
    if not preserve_stroke:
        return STROKE_COLOR
    style_map = _parse_style_attribute(elem)
    raw = (elem.attrib.get("stroke") or style_map.get("stroke") or "").strip()
    if not raw or raw.lower() in {"none", "transparent"}:
        return STROKE_COLOR
    stroke_opacity = _parse_float(elem.attrib.get("stroke-opacity") or style_map.get("stroke-opacity"))
    base_color = raw
    base_opacity: float | None = None
    if base_color.startswith("url("):
        resolved = paint_map.get(base_color)
        if not resolved:
            return STROKE_COLOR
        base_color, base_opacity = resolved
    color = _normalize_hex_color(base_color)
    final_opacity = _combine_opacities(base_opacity, stroke_opacity)
    applied = _apply_opacity_to_color(color, final_opacity)
    return applied if applied.lower() not in {"transparent", "none"} else STROKE_COLOR


def _parse_dimension(value: str | None) -> float | None:
    if value is None:
        return None
    stripped = value.strip().lower().rstrip("px")
    if not stripped:
        return None
    try:
        return float(stripped)
    except ValueError:
        return None


def _viewbox_dimensions(root: ET.Element) -> tuple[float | None, float | None]:
    viewbox = root.attrib.get("viewBox")
    if viewbox:
        parts = viewbox.replace(",", " ").split()
        if len(parts) == 4:
            try:
                width = float(parts[2])
                height = float(parts[3])
                return width, height
            except ValueError:
                pass
    width = _parse_dimension(root.attrib.get("width"))
    height = _parse_dimension(root.attrib.get("height"))
    return width, height


def _compute_scale_factor(root: ET.Element) -> float:
    width, height = _viewbox_dimensions(root)
    max_dim = 0.0
    if width and width > max_dim:
        max_dim = width
    if height and height > max_dim:
        max_dim = height
    if max_dim <= 0:
        max_dim = TARGET_VIEWBOX_SIZE
    return BASE_SCALE * (TARGET_VIEWBOX_SIZE / max_dim)


def _element_area(element: dict) -> float:
    width = float(element.get("width", 0.0))
    height = float(element.get("height", 0.0))
    return abs(width * height)


def _element_sort_key(index: int, element: dict) -> tuple[int, int, float]:
    """Sort elements by document order first, then by fill status and area.
    
    This preserves the original SVG layering where later elements appear on top,
    which is crucial for complex emojis like the abacus where rails should 
    appear over the colored beads.
    """
    background = element.get("backgroundColor", "transparent") or "transparent"
    is_filled = background.lower() != "transparent"
    area = _element_area(element)
    # Primary: document order (index), Secondary: filled elements first, Tertiary: larger areas first
    return (index, 0 if is_filled else 1, -area)


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


def _detect_ring_shape(polylines: List[List[Point]]) -> bool:
    """Detect if multiple polylines represent a ring/donut shape (outer shape with inner hole).
    
    This is more restrictive than just checking for 2 polylines - it ensures the shapes
    are rectangular-ish and the inner shape is a significant portion of the outer shape,
    like a true frame rather than just a letter with a small hole.
    """
    if len(polylines) != 2:
        return False
    
    # Check if both polylines are rectangular-ish (simplified check)
    bounds1 = polyline_bounds(polylines[0])
    bounds2 = polyline_bounds(polylines[1])
    
    # Determine which is outer and which is inner
    area1 = (bounds1[2] - bounds1[0]) * (bounds1[3] - bounds1[1])
    area2 = (bounds2[2] - bounds2[0]) * (bounds2[3] - bounds2[1])
    
    if area1 > area2:
        outer_bounds, inner_bounds = bounds1, bounds2
        outer_poly, inner_poly = polylines[0], polylines[1]
    else:
        outer_bounds, inner_bounds = bounds2, bounds1
        outer_poly, inner_poly = polylines[1], polylines[0]
    
    # Check if outer contains inner
    if not _bounds_contains(outer_bounds, inner_bounds, margin=2.0):
        return False
    
    # Check if both shapes are roughly rectangular (4-ish sides)
    # This helps distinguish frames from complex letter shapes
    if len(outer_poly) < 4 or len(inner_poly) < 4:
        return False
    
    # Check if the inner shape is a significant portion of the outer shape
    # Real frames have substantial borders, while letters have small holes
    outer_area = area1 if area1 > area2 else area2
    inner_area = area2 if area1 > area2 else area1
    
    area_ratio = inner_area / outer_area if outer_area > 0 else 0
    
    # For a true ring/frame, the inner area should be a reasonable portion (20-80%)
    # Letter holes are typically much smaller (< 20%)
    if area_ratio < 0.2 or area_ratio > 0.8:
        return False
    
    # Check if the inner shape is reasonably centered within the outer shape
    outer_center_x = (outer_bounds[0] + outer_bounds[2]) / 2
    outer_center_y = (outer_bounds[1] + outer_bounds[3]) / 2
    inner_center_x = (inner_bounds[0] + inner_bounds[2]) / 2
    inner_center_y = (inner_bounds[1] + inner_bounds[3]) / 2
    
    outer_width = outer_bounds[2] - outer_bounds[0]
    outer_height = outer_bounds[3] - outer_bounds[1]
    
    # Centers should be close (within 20% of the outer dimensions)
    center_tolerance_x = outer_width * 0.2
    center_tolerance_y = outer_height * 0.2
    
    if (abs(outer_center_x - inner_center_x) > center_tolerance_x or 
        abs(outer_center_y - inner_center_y) > center_tolerance_y):
        return False
    
    return True


def _element_center(bounds: tuple[float, float, float, float]) -> tuple[float, float]:
    """Calculate the center point of element bounds."""
    min_x, min_y, max_x, max_y = bounds
    return (min_x + max_x) / 2, (min_y + max_y) / 2


def _point_in_polygon(point: tuple[float, float], polygon_points: List[List[float]]) -> bool:
    """Check if a point is inside a polygon using ray casting algorithm."""
    x, y = point
    n = len(polygon_points)
    inside = False
    
    p1x, p1y = polygon_points[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon_points[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    
    return inside


def _is_center_inside_element(center: tuple[float, float], element: dict) -> bool:
    """Check if a center point is inside the filled area of an element."""
    # Adjust center point relative to element position
    element_x = float(element.get("x", 0.0))
    element_y = float(element.get("y", 0.0))
    relative_center = (center[0] - element_x, center[1] - element_y)
    
    # Get the element's points (for line elements)
    if element.get("type") == "line":
        points = element.get("points", [])
        if len(points) >= 3:  # Need at least 3 points for a polygon
            return _point_in_polygon(relative_center, points)
    
    # For rectangles and ellipses, use simple bounds checking
    elif element.get("type") in ["rectangle", "ellipse"]:
        width = float(element.get("width", 0.0))
        height = float(element.get("height", 0.0))
        return (0 <= relative_center[0] <= width and 0 <= relative_center[1] <= height)
    
    return False





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
        
        # Get the center point of this element
        center = _element_center(bounds)
        
        # Check if this element's center sits inside any larger filled element
        for larger_area, outer_element, outer_bounds, outer_color in larger_sorted:
            if larger_area <= area:
                break
            if outer_color != base_color:
                continue
                
            # Additional criteria to avoid false positives in complex icons:
            # 1. The smaller element should be smaller (less than 85% of outer area to allow substantial inner elements)
            # 2. The inner element should be simple (suggesting a symbol like X, +, checkmark)
            area_ratio = area / larger_area
            if area_ratio > 0.85:
                continue
                
            # Count points in inner element - simple symbols typically have fewer points
            inner_points = element.get("points", [])
            inner_complexity = len(inner_points) if inner_points else 0
            
            # Only apply overlay if inner element is reasonably simple (< 30 points) suggesting a symbol or inner content
            # Very complex icon parts typically have more points and are likely structural elements
            if inner_complexity > 30:
                continue
            
            # Check if the center of the smaller element is inside the larger element's filled area
            if _is_center_inside_element(center, outer_element):
                element["backgroundColor"] = OVERLAY_COLOR
                break
                
            # Check if the center of the smaller element is inside the larger element's filled area
            if _is_center_inside_element(center, outer_element):
                element["backgroundColor"] = OVERLAY_COLOR
                break


def _create_line(
    points: List[Point], *, fill_color: str, stroke_color: str, scale_factor: float, stroke_width: int = 2
) -> dict | None:
    if len(points) < 2:
        return None
    rel_points, min_x, min_y, width, height = _relative_points(points)
    if width < 1e-6 and height < 1e-6:
        return None
    rel_points = [[x * scale_factor, y * scale_factor] for x, y in rel_points]
    min_x *= scale_factor
    min_y *= scale_factor
    width *= scale_factor
    height *= scale_factor
    is_closed = len(points) > 2 and _points_close(points[0], points[-1])
    background = fill_color if is_closed else "transparent"
    return {
        "type": "line",
        "version": 1,
        "versionNonce": _random_int(),
        "isDeleted": False,
        "id": str(uuid.uuid4()),
        "fillStyle": "solid",
        "strokeWidth": stroke_width,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "angle": 0,
        "x": float(min_x),
        "y": float(min_y),
    "strokeColor": stroke_color,
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


def _create_rectangle(
    elem: ET.Element, *, fill_color: str, stroke_color: str, scale_factor: float
) -> dict | None:
    try:
        x = float(elem.attrib.get("x", "0")) * scale_factor
        y = float(elem.attrib.get("y", "0")) * scale_factor
        width = float(elem.attrib["width"]) * scale_factor
        height = float(elem.attrib["height"]) * scale_factor
    except (KeyError, ValueError):
        return None
    if width <= 0 or height <= 0:
        return None
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
        "strokeColor": stroke_color,
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
    bounds: Tuple[float, float, float, float], *, fill_color: str, stroke_color: str, scale_factor: float
) -> dict | None:
    min_x, min_y, width, height = bounds
    if width <= 0 or height <= 0:
        return None
    x = min_x * scale_factor
    y = min_y * scale_factor
    width *= scale_factor
    height *= scale_factor
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
        "strokeColor": stroke_color,
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
    bounds: Tuple[float, float, float, float], *, fill_color: str, stroke_color: str, scale_factor: float
) -> dict | None:
    min_x, min_y, width, height = bounds
    if width <= 0 or height <= 0:
        return None
    x = min_x * scale_factor
    y = min_y * scale_factor
    width *= scale_factor
    height *= scale_factor
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
        "strokeColor": stroke_color,
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


def svg_to_elements(
    svg_path: Path,
    *,
    filled: bool,
    preserve_fill: bool = False,
    preserve_stroke: bool = False,
) -> List[dict]:
    tree = ET.parse(svg_path)
    root = tree.getroot()
    elements: List[dict] = []

    scale_factor = _compute_scale_factor(root)
    paint_map = _build_paint_map(root) if (preserve_fill or preserve_stroke) else {}

    for rect in _collect_rects(root):
        fill_color = _resolve_fill_color(
            rect,
            filled_icon=filled,
            preserve_fill=preserve_fill,
            paint_map=paint_map,
        )
        stroke_color = _resolve_stroke_color(
            rect,
            preserve_stroke=preserve_stroke,
            paint_map=paint_map,
        )
        element = _create_rectangle(
            rect,
            fill_color=fill_color,
            stroke_color=stroke_color,
            scale_factor=scale_factor,
        )
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
        fill_color = _resolve_fill_color(
            path_elem,
            filled_icon=filled,
            preserve_fill=preserve_fill,
            paint_map=paint_map,
        )
        stroke_color = _resolve_stroke_color(
            path_elem,
            preserve_stroke=preserve_stroke,
            paint_map=paint_map,
        )
        
        # Check if this represents a ring/donut shape that should be stroked instead of filled
        if _detect_ring_shape(polylines) and fill_color != "transparent":
            # For ring shapes, create a stroked outline of the outer shape instead of filled shapes
            # Use a thicker stroke width to match the visual weight of the original SVG border
            outer_poly = polylines[0] if len(polylines[0]) > len(polylines[1]) else polylines[1]
            line = _create_line(
                outer_poly,
                fill_color="transparent",  # No fill for ring shapes
                stroke_color=fill_color,    # Use the fill color as stroke color
                scale_factor=scale_factor,
                stroke_width=8,  # Thicker stroke to match SVG border weight
            )
            if line:
                elements.append(line)
        else:
            # Normal processing for non-ring shapes
            for poly in polylines:
                shape_type, bounds = _classify_polyline(poly)
                if shape_type == "ellipse" and bounds is not None:
                    ellipse = _create_ellipse(
                        bounds,
                        fill_color=fill_color,
                        stroke_color=stroke_color,
                        scale_factor=scale_factor,
                    )
                    if ellipse:
                        elements.append(ellipse)
                    continue
                if shape_type == "rectangle" and bounds is not None:
                    rect = _create_rectangle_from_bounds(
                        bounds,
                        fill_color=fill_color,
                        stroke_color=stroke_color,
                        scale_factor=scale_factor,
                    )
                    if rect:
                        elements.append(rect)
                    continue
                line = _create_line(
                    poly,
                    fill_color=fill_color,
                    stroke_color=stroke_color,
                    scale_factor=scale_factor,
                )
                if line:
                    elements.append(line)

    return elements


def build_scene(elements: List[dict], *, preserve_colors: bool = False) -> dict:
    if not preserve_colors:
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


def convert_icons(input_dir: Path, output_dir: Path, *, preserve_colors: bool = False) -> None:
    svg_files = sorted(input_dir.rglob("*.svg"))
    if not svg_files:
        raise SystemExit(f"No SVG files found under {input_dir}")

    seen_outputs: set[Path] = set()
    total = len(svg_files)
    converted = 0
    duplicates = 0
    failed = 0

    for svg_file in svg_files:
        stem = svg_file.stem.lower()
        is_color_variant = "_color" in stem
        filled = "_filled" in stem or is_color_variant
        preserve_fill = preserve_colors or is_color_variant
        preserve_stroke = preserve_colors
        relative = svg_file.relative_to(input_dir)
        try:
            elements = svg_to_elements(
                svg_file,
                filled=filled,
                preserve_fill=preserve_fill,
                preserve_stroke=preserve_stroke,
            )
            scene = build_scene(elements, preserve_colors=preserve_fill)
        except Exception as exc:
            failed += 1
            print(f"Failed to convert {relative}: {exc}", file=sys.stderr)
            continue
        stripped_stem = _strip_size_token(relative.stem)
        output_name = f"{stripped_stem}.excalidraw"
        output_path = output_dir / relative.parent / output_name
        if output_path in seen_outputs:
            duplicates += 1
            continue
        seen_outputs.add(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as handle:
            json.dump(scene, handle, indent=2)
            handle.write("\n")
        converted += 1

    summary = (
        f"Processed {total} SVGs from {input_dir}: "
        f"{converted} converted, {duplicates} duplicates skipped"
    )
    if failed:
        summary += f", {failed} failed"
    print(summary)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path("vendor/icons/assets"),
        help="Directory containing Fluent UI SVG assets.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("artifacts/excalidraw"),
        help="Destination directory for generated Excalidraw JSON files.",
    )
    parser.add_argument(
        "--preserve-colors",
        action="store_true",
        help="Keep original SVG stroke and fill colors instead of applying default palette.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    random.seed(0)
    convert_icons(args.input_dir, args.output_dir, preserve_colors=args.preserve_colors)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
