import argparse
import json
import math
import random
import re
import time
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

STROKE_COLOR = "#1e1e1e"
DEFAULT_COLUMNS = 12
DEFAULT_CELL_WIDTH = 220.0
DEFAULT_CELL_HEIGHT = 240.0
DEFAULT_PADDING = 24.0
DEFAULT_LABEL_GAP = 12.0
LABEL_FONT_SIZE = 28.0
TEXT_WIDTH_FACTOR = 0.6


class CombineError(Exception):
    pass


def _now_ms() -> int:
    return int(time.time() * 1000)


def _random_int() -> int:
    return random.randint(0, 2**31 - 1)


def _load_elements(path: Path) -> List[Dict]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    elements = data.get("elements")
    if not isinstance(elements, list):
        raise CombineError(f"File {path} does not contain an elements list")
    return elements


def _element_bounds(element: Dict) -> Tuple[float, float, float, float]:
    x = float(element.get("x", 0.0))
    y = float(element.get("y", 0.0))
    width = float(element.get("width", 0.0))
    height = float(element.get("height", 0.0))
    min_x = min(x, x + width)
    min_y = min(y, y + height)
    max_x = max(x, x + width)
    max_y = max(y, y + height)
    return min_x, min_y, max_x, max_y


def _collection_bounds(elements: Sequence[Dict]) -> Tuple[float, float, float, float]:
    min_x = math.inf
    min_y = math.inf
    max_x = -math.inf
    max_y = -math.inf
    for element in elements:
        ex_min, ey_min, ex_max, ey_max = _element_bounds(element)
        min_x = min(min_x, ex_min)
        min_y = min(min_y, ey_min)
        max_x = max(max_x, ex_max)
        max_y = max(max_y, ey_max)
    if min_x is math.inf or min_y is math.inf:
        return 0.0, 0.0, 0.0, 0.0
    return min_x, min_y, max_x, max_y


def _clone_element(element: Dict, dx: float, dy: float) -> Dict:
    cloned = json.loads(json.dumps(element))
    cloned["id"] = str(uuid.uuid4())
    cloned["seed"] = _random_int()
    cloned["version"] = 1
    cloned["versionNonce"] = _random_int()
    cloned["x"] = float(cloned.get("x", 0.0)) + dx
    cloned["y"] = float(cloned.get("y", 0.0)) + dy
    cloned["updated"] = _now_ms()
    cloned["groupIds"] = []
    return cloned


def _estimate_text_width(text: str, font_size: float) -> float:
    if not text:
        return font_size
    return max(font_size, len(text) * font_size * TEXT_WIDTH_FACTOR)


def _normalize_label_from_path(path: Path) -> str:
    stem = path.stem
    prefix = "ic_fluent_"
    if stem.startswith(prefix):
        stem = stem[len(prefix) :]
    parts = [part for part in stem.split("_") if part and part != "24"]
    return " ".join(part.capitalize() for part in parts) if parts else path.stem


def _first_label_token(path: Path) -> str:
    label = _normalize_label_from_path(path)
    token = label.split()[0] if label else "#"
    return token or "#"


def _create_text_element(text: str, x: float, y: float) -> Dict:
    width = _estimate_text_width(text, LABEL_FONT_SIZE)
    height = LABEL_FONT_SIZE * 1.2
    return {
        "type": "text",
        "version": 1,
        "versionNonce": _random_int(),
        "isDeleted": False,
        "id": str(uuid.uuid4()),
        "fillStyle": "solid",
        "strokeWidth": 1,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "angle": 0,
        "x": x,
        "y": y,
        "strokeColor": STROKE_COLOR,
        "backgroundColor": "transparent",
        "width": width,
        "height": height,
        "seed": _random_int(),
        "groupIds": [],
        "boundElements": [],
        "updated": _now_ms(),
        "link": None,
        "locked": False,
        "fontSize": LABEL_FONT_SIZE,
        "fontFamily": 1,
        "text": text,
        "rawText": text,
        "baseline": LABEL_FONT_SIZE,
        "textAlign": "center",
        "verticalAlign": "top",
        "containerId": None,
        "originalText": text,
        "lineHeight": 1.2,
    }


def _gather_icon_files(input_dir: Path) -> List[Path]:
    return sorted(input_dir.rglob("*.excalidraw"))


def _group_files(
    files: Sequence[Path],
    *,
    input_dir: Path,
    strategy: str,
    batch_size: int | None,
) -> List[Tuple[str, List[Path]]]:
    if strategy == "none":
        return [("all", list(files))]
    if strategy == "directory":
        groups: Dict[str, List[Path]] = defaultdict(list)
        for file_path in files:
            try:
                relative = file_path.relative_to(input_dir)
                key = relative.parts[0] if len(relative.parts) > 1 else "root"
            except ValueError:
                key = file_path.parent.name or "root"
            groups[key].append(file_path)
        return sorted(groups.items(), key=lambda item: item[0].lower())
    if strategy == "letter":
        groups = defaultdict(list)
        for file_path in files:
            label = _normalize_label_from_path(file_path)
            key = label[:1].upper() if label else "#"
            if not key.isalpha():
                key = "#"
            groups[key].append(file_path)
        return sorted(groups.items(), key=lambda item: item[0])
    if strategy == "first-word":
        groups = defaultdict(list)
        for file_path in files:
            key = _first_label_token(file_path)
            groups[key].append(file_path)
        return sorted(groups.items(), key=lambda item: item[0].lower())
    if strategy == "batch":
        if not batch_size or batch_size <= 0:
            raise CombineError("Batch grouping requires a positive --batch-size value")
        ordered_files = list(files)
        grouped: List[Tuple[str, List[Path]]] = []
        for start in range(0, len(ordered_files), batch_size):
            end = min(start + batch_size, len(ordered_files))
            label = f"batch_{start + 1:04d}-{end:04d}"
            grouped.append((label, ordered_files[start:end]))
        return grouped
    raise CombineError(f"Unsupported grouping strategy: {strategy}")


def _layout_icons(
    files: Sequence[Path],
    *,
    columns: int,
    cell_width: float,
    cell_height: float,
    padding: float,
    label_gap: float,
) -> List[Dict]:
    combined: List[Dict] = []
    icon_area_height = cell_height - LABEL_FONT_SIZE - label_gap
    if icon_area_height <= 0:
        raise CombineError("Cell height too small for labels with provided padding")
    now = _now_ms()
    for index, file_path in enumerate(files):
        elements = _load_elements(file_path)
        if not elements:
            continue
        min_x, min_y, max_x, max_y = _collection_bounds(elements)
        icon_width = max_x - min_x
        icon_height = max_y - min_y
        col = index % columns
        row = index // columns
        origin_x = col * cell_width
        origin_y = row * cell_height
        available_width = max(cell_width - 2 * padding, 0.0)
        available_height = max(icon_area_height - 2 * padding, 0.0)
        offset_x = origin_x + padding + max((available_width - icon_width) / 2.0, 0.0) - min_x
        offset_y = origin_y + padding + max((available_height - icon_height) / 2.0, 0.0) - min_y
        cloned_icon_elements: List[Dict] = []
        for element in elements:
            cloned = _clone_element(element, offset_x, offset_y)
            cloned["updated"] = now
            cloned_icon_elements.append(cloned)
        if cloned_icon_elements:
            group_id = str(uuid.uuid4())
            for cloned in cloned_icon_elements:
                group_ids = list(cloned.get("groupIds", []))
                if group_id not in group_ids:
                    group_ids.append(group_id)
                cloned["groupIds"] = group_ids
            combined.extend(cloned_icon_elements)
        label = _normalize_label_from_path(file_path)
        text_width = _estimate_text_width(label, LABEL_FONT_SIZE)
        text_x = origin_x + (cell_width / 2.0) - (text_width / 2.0)
        text_y = origin_y + icon_area_height + label_gap
        text_element = _create_text_element(label, text_x, text_y)
        text_element["updated"] = now
        combined.append(text_element)
    return combined


def combine_icons(
    *,
    input_dir: Path,
    output_file: Path,
    columns: int,
    cell_width: float,
    cell_height: float,
    padding: float,
    label_gap: float,
    files: Sequence[Path] | None = None,
) -> None:
    if files is None:
        files = [path for path in _gather_icon_files(input_dir) if path != output_file]
    else:
        files = [path for path in files if path != output_file]
    if not files:
        raise CombineError(f"No .excalidraw files found under {input_dir}")
    elements = _layout_icons(
        files,
        columns=columns,
        cell_width=cell_width,
        cell_height=cell_height,
        padding=padding,
        label_gap=label_gap,
    )
    document = {
        "type": "excalidraw",
        "version": 2,
        "source": "fluentui-icons-to-excalidraw",
        "elements": elements,
        "appState": {
            "gridSize": None,
        },
        "files": {},
    }
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with output_file.open("w", encoding="utf-8") as handle:
        json.dump(document, handle, indent=2)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Combine Excalidraw icon files into a single scene")
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path("artifacts/excalidraw"),
        help="Directory containing per-icon .excalidraw files",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/all_icons.excalidraw"),
        help="Destination path for the combined Excalidraw file",
    )
    parser.add_argument(
        "--columns",
        type=int,
        default=DEFAULT_COLUMNS,
        help="Number of columns in the grid layout",
    )
    parser.add_argument(
        "--cell-width",
        type=float,
        default=DEFAULT_CELL_WIDTH,
        help="Width of each grid cell (in Excalidraw units)",
    )
    parser.add_argument(
        "--cell-height",
        type=float,
        default=DEFAULT_CELL_HEIGHT,
        help="Height of each grid cell (in Excalidraw units)",
    )
    parser.add_argument(
        "--padding",
        type=float,
        default=DEFAULT_PADDING,
        help="Padding inside each cell before placing an icon",
    )
    parser.add_argument(
        "--label-gap",
        type=float,
        default=DEFAULT_LABEL_GAP,
        help="Vertical gap between the icon and its label",
    )
    parser.add_argument(
    "--group-by",
    choices=["none", "directory", "letter", "first-word", "batch"],
        default="none",
        help="Optional grouping strategy to split output into multiple files",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help="Number of icons per batch when using --group-by batch",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    files = _gather_icon_files(args.input_dir)
    if not files:
        raise CombineError(f"No .excalidraw files found under {args.input_dir}")
    grouping = _group_files(
        files,
        input_dir=args.input_dir,
        strategy=args.group_by,
        batch_size=args.batch_size,
    )
    if args.group_by == "none":
        combine_icons(
            input_dir=args.input_dir,
            output_file=args.output,
            columns=args.columns,
            cell_width=args.cell_width,
            cell_height=args.cell_height,
            padding=args.padding,
            label_gap=args.label_gap,
            files=files,
        )
        return

    # When grouping, treat --output as a directory path.
    output_dir = args.output
    if output_dir.suffix:
        output_dir = output_dir.parent
    if not output_dir:
        raise CombineError("Please supply a directory path via --output when grouping")
    output_dir.mkdir(parents=True, exist_ok=True)

    for group_name, group_files in grouping:
        if not group_files:
            continue
        safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", group_name.strip()) or "group"
        target_path = output_dir / f"{safe_name}.excalidraw"
        combine_icons(
            input_dir=args.input_dir,
            output_file=target_path,
            columns=args.columns,
            cell_width=args.cell_width,
            cell_height=args.cell_height,
            padding=args.padding,
            label_gap=args.label_gap,
            files=group_files,
        )


if __name__ == "__main__":
    main()
