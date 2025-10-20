# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2025.10.20] - 2025-10-20 14:56:11 UTC


### Fixed
- **Corrected emoji z-index layering**: Fixed element ordering to preserve original SVG document order, ensuring proper layering in complex emojis like the Abacus where rails now correctly appear over colored beads
- **Fixed ring/donut shape rendering**: Complex shapes with holes (like the Abacus frame) now render as stroked outlines instead of filled rectangles, allowing interior elements to remain visible
- **Improved stroke width for outline shapes**: Ring/donut shapes now use thicker strokes (8px instead of 2px) to better match the visual weight of original SVG borders
- **Enhanced ring detection accuracy**: Improved ring shape detection to distinguish true frames from letters with small holes (like the "A" in AB button), preventing incorrect outline rendering of text characters

### Changed
- **Enhanced GitHub Actions workflow**: Now includes comprehensive emoji generation alongside icon processing, creating complete emoji libraries and categorized collections in automated releases
- **Improved emoji fetch progress reporting**: Added batch progress reporting every 100 downloads, consistent with icon fetching behavior

## [2025.10.20] - 2025-10-20 13:47:58 UTC


### Added
- **Pre-commit hook for automatic changelog versioning**: Automatically converts [Unreleased] sections to dated versions on commit

## [2025.10.20] - 2025-10-20 13:47:04 UTC


### Added
- **FluentUI Emoji Support**: Complete import system for Microsoft's FluentUI Emojis
  - New `fetch_emojis.py` script to download emoji SVGs and metadata from GitHub
  - New `emoji_to_excalidraw.py` converter with intelligent color mapping system
  - New `import_emojis.py` for streamlined end-to-end emoji import workflow
  - Uses "Flat" emoji style for optimal Excalidraw compatibility (avoids gradient issues)
  - Advanced color preservation that maps SVG colors to closest Excalidraw palette colors
  - Automatic skin tone variation handling for applicable emojis
  - Emoji categorization using existing category system with new "Emojis" category
  - Consistent hand-drawn styling that matches the existing icon aesthetic

### Fixed
- **Improved fill color strategy**: Fixed incorrect colors in complex icons like FPS numbers and fireplace
- **Corrected hole rendering**: Holes in letters and numbers now display proper negative space for better visual clarity

### Changed
- **Enhanced overlay detection**: Better handling of inner elements and overlay symbols for improved visual contrast
- **Expanded category system**: Added comprehensive emoji keywords to support emoji categorization
- **Improved emoji library spacing**: Increased cell sizes, padding, and label gaps to prevent text overlap and cramped layouts
- **Consistent workflow architecture**: Emoji workflow now follows the same 3-step pattern as icons (fetch → convert → combine) instead of using a combined orchestration script
