# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
