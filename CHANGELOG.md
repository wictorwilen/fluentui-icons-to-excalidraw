# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2025.10.23] - 2025-10-23 08:33:51 UTC


### Added
- **Enhanced Analytics Tracking**: Added comprehensive tracking for user interactions including favorite toggles (add/remove with item names) and style filter selections (individual styles, select all, clear all) to better understand user preferences and behavior patterns

## [2025.10.23] - 2025-10-23 07:41:28 UTC


### Changed
- **Moved Google Analytics to HTML**: Relocated GA initialization script from JavaScript to index.html using %REACT_APP_GA_TRACKING_ID% environment variable substitution for improved performance and simpler management

## [2025.10.22] - 2025-10-22 18:32:56 UTC


### Changed
- **Simplified Google Analytics**: Replaced complex Consent Mode v2 with standard GA implementation that only loads when user consents to analytics
- **Streamlined Consent Management**: Simplified consent handling to basic on/off analytics tracking instead of granular consent modes

### Fixed
- **Cookie Consent Bug**: Fixed critical bug where analytics service used incorrect cookie key, preventing proper consent checking
- **Production Debug Mode**: Google Analytics debug mode now only enabled in development environment instead of always being active
- **Code Organization**: Consolidated cookie consent constants into shared file to prevent future inconsistencies

## [2025.10.22] - 2025-10-22 09:44:59 UTC


### Added
- **EU Cookie Consent**: Comprehensive GDPR-compliant cookie consent system with granular controls for necessary, analytics, marketing, and preference cookies
- **Cookie Preferences Management**: Users can customize cookie settings through modal interface accessible from header and footer
- **Privacy-Aware Analytics**: Google Analytics initialization now respects user cookie preferences and only loads when consent is granted
- **Cookie Settings Persistence**: User preferences are stored for one year and can be updated at any time through the interface
- **Help Email Link**: Added "Help" link in footer that opens email client to contact help@fluentjot.design

## [2025.10.22] - 2025-10-22 06:26:53 UTC


### Added
- **Google Analytics Integration**: Comprehensive analytics tracking including page views, downloads, search queries, category selections, and external link clicks
- **Analytics Services**: Created dedicated analytics utilities and React hooks for consistent tracking across the application

## [2025.10.21] - 2025-10-21 15:03:10 UTC


### Added
- **Azure Blob Storage Integration**: Excalidraw files now served from Azure Blob Storage CDN instead of being bundled with the web app, enabling better scalability and performance

### Changed
- **Separated Deployment Workflows**: Split deployment into two focused workflows - `azure-swa-deploy.yml` for web app deployment and `azure-blob-deploy.yml` for Excalidraw assets
- **Optimized Deployment Pipeline**: Deployment workflow now downloads pre-built Excalidraw files from GitHub releases instead of regenerating from source SVGs, dramatically reducing deployment time and infrastructure load
- **Hybrid Storage Architecture**: Web app (2MB) deploys to Azure SWA while Excalidraw assets (108MB, 7000+ files) are served from Azure Blob Storage with CDN caching

### Fixed
- **Metadata Consistency**: Deployment workflow now downloads metadata files from the same release as Excalidraw artifacts, preventing warnings about missing files due to version mismatches
- **Azure SWA File Limits**: Moved large Excalidraw file collection to blob storage to avoid Azure Static Web Apps deployment size and file count limitations

## [2025.10.21] - 2025-10-21 14:53:19 UTC


### Added
- **Favorites System**: Complete favorites functionality with star icons on each item, localStorage persistence, and dedicated Favorites category in sidebar for easy access to bookmarked icons and emojis

### Changed
- **Improved Card Layout**: Moved action buttons (favorite, copy, download) to bottom of preview cards for better accessibility and removed hidden dropdown menu for cleaner, more intuitive interface

### Fixed
- **Favorites Category Display**: Fixed issue where favorites weren't displaying when Favorites category was selected in sidebar due to conflicting filter states
- **Favorites Title and Empty State**: Fixed title to show "Favorites" instead of "All items" when favorites filter is active, and improved empty state message to guide users when no favorites are saved
- **Emoji Favorites Reliability**: Completely rewrote favorites system with simplified, unified storage approach that explicitly tracks item type, eliminating complex classification logic that caused emoji favorites to be lost or stored incorrectly

## [2025.10.21] - 2025-10-21 12:59:53 UTC


### Fixed
- **Bundle Size Optimization**: Dramatically reduced main bundle size from 704KB to 57KB (91% reduction) through lazy loading of Excalidraw component and replacement of heavyweight icon dependencies with minimal inline SVG components

## [2025.10.21] - 2025-10-21 12:21:53 UTC


### Fixed
- **Deployment Configuration**: Fixed Azure Static Web App route ordering issue where wildcard route was covering specific /index.html route

## [2025.10.21] - 2025-10-21 11:20:01 UTC


### Fixed

## [2025.10.21] - 2025-10-21 09:25:50 UTC


### Added
- **Data Optimization System**: Comprehensive data compression strategy reducing total payload from 3.87MB to 1.69MB (56% reduction)
- **Icon Data Compression**: Optimized icons.json from 3.22MB to 1.44MB with field name shortening, category indexing, and path compression
- **Emoji Data Compression**: Optimized emojis.json from 667KB to 255KB using similar compression techniques with skin tone indexing
- **Dedicated Search Indices**: Separate search index files for faster query performance (806KB for icons, 134KB for emojis)
- **Intelligent Caching**: Enhanced GitHub Actions workflow with smart SVG asset caching and Excalidraw artifact caching
- **TypeScript Integration**: Complete type safety for optimized data formats with automatic fallback to legacy formats
- **Build Pipeline Enhancement**: Automated optimization and migration scripts integrated into build process

### Changed
- **Removed Size Field**: Eliminated size attribute from icon and emoji data as requested
- **Improved GitHub Actions**: Optimized deployment workflow with comprehensive caching strategy reducing build times from 15+ minutes to ~3 minutes on cache hits
- **Enhanced Documentation**: Reorganized README.md as concise introduction with detailed technical docs moved to DOCUMENTATION.md

### Fixed
- **Bundle Size Optimization**: Significantly reduced web application bundle size through data compression and removal of redundant fields
- **Performance Improvements**: Faster search and filtering through dedicated search indices and compressed data structures

## [2025.10.21] - 2025-10-21 07:19:19 UTC


### Added
- Complete rebranding to "Fluent Jot" with new domain fluentjot.design
- Modern TailwindCSS web application with Syntax design inspiration
- Responsive React interface for browsing icons and emojis
- Smart search functionality with Fuse.js fuzzy matching
- Dark mode support with persistent preferences
- Category-based navigation and filtering
- Professional branding and SEO optimization
- **Static Web App Architecture**: Created fully static React web application using client-side search and static JSON data files, eliminating need for Azure Functions or server-side APIs
- **Build-Time Data Processing**: Implemented comprehensive build script that processes existing metadata and copies Excalidraw files to create optimized static assets for web deployment
- **Web Application Framework**: Complete React 18 + TypeScript setup with Fluent UI React v9, client-side fuzzy search using Fuse.js, and virtual scrolling for performance
- **Static Asset Organization**: Structured public directory with optimized JSON data files and organized Excalidraw file storage for direct CDN serving
- **Development Environment**: Full development setup with ESLint, Prettier, testing frameworks, and Azure Static Web Apps CLI integration
- **License Attribution**: Comprehensive license documentation clearly attributing Microsoft's ownership of Fluent UI icons and proper usage guidelines

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
