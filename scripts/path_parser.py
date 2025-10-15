"""SVG path parsing helpers for converting to polylines."""

from __future__ import annotations

import math
import re
from typing import Iterable, Iterator, List, Sequence, Tuple

Point = Tuple[float, float]
COMMANDS = set("MmLlHhVvCcSsZz")
_TOKEN_RE = re.compile(r"[MmLlHhVvCcSsZz]|-?\d*\.?\d+(?:[eE][+-]?\d+)?")
SIMPLIFY_EPSILON = 0.2
SIMPLIFY_RELATIVE_SCALE = 0.02


class PathParseError(ValueError):
    """Raised when encountering malformed SVG path data."""


def _tokenize(path_data: str) -> Iterator[str]:
    for token in _TOKEN_RE.findall(path_data.replace(",", " ")):
        yield token


def _reflect(control: Point, anchor: Point) -> Point:
    return (2 * anchor[0] - control[0], 2 * anchor[1] - control[1])


def _sample_cubic(p0: Point, p1: Point, p2: Point, p3: Point, steps: int) -> List[Point]:
    pts: List[Point] = []
    for i in range(1, steps + 1):
        t = i / steps
        mt = 1 - t
        x = (
            mt * mt * mt * p0[0]
            + 3 * mt * mt * t * p1[0]
            + 3 * mt * t * t * p2[0]
            + t * t * t * p3[0]
        )
        y = (
            mt * mt * mt * p0[1]
            + 3 * mt * mt * t * p1[1]
            + 3 * mt * t * t * p2[1]
            + t * t * t * p3[1]
        )
        pts.append((x, y))
    return pts


def _append_point(polyline: List[Point], point: Point, *, eps: float = 1e-6) -> None:
    if not polyline:
        polyline.append(point)
        return
    last = polyline[-1]
    if abs(last[0] - point[0]) < eps and abs(last[1] - point[1]) < eps:
        return
    polyline.append(point)


def parse_path(path_data: str, *, cubic_steps: int = 6) -> List[List[Point]]:
    """Convert SVG path commands into polylines.

    Parameters
    ----------
    path_data:
        Contents of an SVG ``d`` attribute.
    cubic_steps:
        Number of segments to subdivide cubic Béziers into.
    """

    tokens = list(_tokenize(path_data))
    if not tokens:
        return []

    index = 0
    current_command = ""
    current_point: Point = (0.0, 0.0)
    subpath_start: Point | None = None
    last_control: Point | None = None
    polylines: List[List[Point]] = []
    current_polyline: List[Point] = []

    def next_number() -> float:
        nonlocal index
        if index >= len(tokens):
            raise PathParseError("Unexpected end of path data")
        value = tokens[index]
        index += 1
        try:
            return float(value)
        except ValueError as exc:
            raise PathParseError(f"Expected number, got '{value}'") from exc

    while index < len(tokens):
        token = tokens[index]
        if token in COMMANDS:
            current_command = token
            index += 1
        elif not current_command:
            raise PathParseError("Path data must start with a command letter")

        cmd = current_command
        absolute = cmd.isupper()
        lower = cmd.lower()

        if lower == "m":
            x = next_number()
            y = next_number()
            nx = x if absolute else current_point[0] + x
            ny = y if absolute else current_point[1] + y
            if current_polyline:
                polylines.append(current_polyline)
            current_polyline = [(nx, ny)]
            current_point = (nx, ny)
            subpath_start = current_point
            last_control = None
            # Additional coordinate pairs are treated as implicit line commands
            while index < len(tokens) and tokens[index] not in COMMANDS:
                x = next_number()
                y = next_number()
                nx = x if absolute else current_point[0] + x
                ny = y if absolute else current_point[1] + y
                _append_point(current_polyline, (nx, ny))
                current_point = (nx, ny)
                last_control = None
        elif lower == "l":
            while index < len(tokens) and tokens[index] not in COMMANDS:
                x = next_number()
                y = next_number()
                nx = x if absolute else current_point[0] + x
                ny = y if absolute else current_point[1] + y
                _append_point(current_polyline, (nx, ny))
                current_point = (nx, ny)
                last_control = None
        elif lower == "h":
            while index < len(tokens) and tokens[index] not in COMMANDS:
                value = next_number()
                nx = value if absolute else current_point[0] + value
                ny = current_point[1]
                _append_point(current_polyline, (nx, ny))
                current_point = (nx, ny)
                last_control = None
        elif lower == "v":
            while index < len(tokens) and tokens[index] not in COMMANDS:
                value = next_number()
                nx = current_point[0]
                ny = value if absolute else current_point[1] + value
                _append_point(current_polyline, (nx, ny))
                current_point = (nx, ny)
                last_control = None
        elif lower == "c":
            while index < len(tokens) and tokens[index] not in COMMANDS:
                x1 = next_number()
                y1 = next_number()
                x2 = next_number()
                y2 = next_number()
                x = next_number()
                y = next_number()
                if absolute:
                    p1 = (x1, y1)
                    p2 = (x2, y2)
                    p3 = (x, y)
                else:
                    p1 = (current_point[0] + x1, current_point[1] + y1)
                    p2 = (current_point[0] + x2, current_point[1] + y2)
                    p3 = (current_point[0] + x, current_point[1] + y)
                sampled = _sample_cubic(current_point, p1, p2, p3, cubic_steps)
                for pt in sampled:
                    _append_point(current_polyline, pt)
                current_point = p3
                last_control = p2
        elif lower == "s":
            while index < len(tokens) and tokens[index] not in COMMANDS:
                x2 = next_number()
                y2 = next_number()
                x = next_number()
                y = next_number()
                if last_control is None:
                    p1 = current_point
                else:
                    p1 = _reflect(last_control, current_point)
                if absolute:
                    p2 = (x2, y2)
                    p3 = (x, y)
                else:
                    p2 = (current_point[0] + x2, current_point[1] + y2)
                    p3 = (current_point[0] + x, current_point[1] + y)
                sampled = _sample_cubic(current_point, p1, p2, p3, cubic_steps)
                for pt in sampled:
                    _append_point(current_polyline, pt)
                current_point = p3
                last_control = p2
        elif lower == "z":
            if subpath_start is not None:
                _append_point(current_polyline, subpath_start)
            polylines.append(current_polyline)
            current_polyline = []
            last_control = None
            current_point = subpath_start if subpath_start is not None else current_point
            subpath_start = None
        else:
            raise PathParseError(f"Unsupported path command '{cmd}'")

    if current_polyline:
        polylines.append(current_polyline)

    simplified: List[List[Point]] = []
    for poly in polylines:
        if len(poly) < 2:
            continue
        simplified_poly = simplify_polyline(poly, SIMPLIFY_EPSILON)
        if len(simplified_poly) >= 2:
            simplified.append(simplified_poly)
    return simplified


def polyline_bounds(points: Sequence[Point]) -> Tuple[float, float, float, float]:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return min(xs), min(ys), max(xs), max(ys)


def translate(points: Iterable[Point], dx: float, dy: float) -> List[Point]:
    return [(x - dx, y - dy) for x, y in points]


def simplify_polyline(points: Sequence[Point], epsilon: float) -> List[Point]:
    if len(points) < 3:
        return list(points)

    closed = points[0] == points[-1]
    working: Sequence[Point]
    if closed:
        working = points[:-1]
    else:
        working = points

    xs = [p[0] for p in working]
    ys = [p[1] for p in working]
    max_dim = max((max(xs) - min(xs)), (max(ys) - min(ys)))
    effective_epsilon = max(epsilon, max_dim * SIMPLIFY_RELATIVE_SCALE)

    simplified = _rdp(working, effective_epsilon)
    if closed:
        if simplified[0] != simplified[-1]:
            simplified.append(simplified[0])
    return simplified


def _rdp(points: Sequence[Point], epsilon: float) -> List[Point]:
    if len(points) < 3:
        return list(points)

    start = points[0]
    end = points[-1]
    index = -1
    max_dist = -1.0

    for i in range(1, len(points) - 1):
        dist = _perpendicular_distance(points[i], start, end)
        if dist > max_dist:
            max_dist = dist
            index = i

    if max_dist <= epsilon or index == -1:
        return [start, end]

    first = _rdp(points[: index + 1], epsilon)
    second = _rdp(points[index:], epsilon)
    return first[:-1] + second


def _perpendicular_distance(point: Point, line_start: Point, line_end: Point) -> float:
    (x0, y0) = point
    (x1, y1) = line_start
    (x2, y2) = line_end
    dx = x2 - x1
    dy = y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x0 - x1, y0 - y1)
    numerator = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1)
    denominator = math.hypot(dx, dy)
    return numerator / denominator
