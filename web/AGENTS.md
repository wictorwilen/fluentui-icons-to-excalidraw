# Fluent Jot - Web Application Agent Operations Guide

This directory contains the "Fluent Jot" React-based Static Web App for browsing, searching, and downloading Fluent UI icons and emojis in beautiful hand-drawn Excalidraw format. Available at [fluentjot.design](https://fluentjot.design).

## Purpose

Provide a modern, responsive web interface branded as "Fluent Jot" for users to:
- Search and browse 5,980+ Fluent UI icons and 1,595+ emojis
- Preview items in hand-drawn Excalidraw format with live rendering  
- Download individual or multiple Excalidraw files
- Experience beautiful TailwindCSS styling with Syntax design inspiration
- Filter by categories, sizes, and styles
- Experience fast, client-side search with fuzzy matching

## Architecture Overview

This is a **pure static web application** hosted on Azure Static Web Apps with no Azure Functions or server-side APIs. All data is served as static JSON files and Excalidraw assets are delivered directly from the CDN.

### Key Design Decisions
- **No Backend APIs**: All data served as static JSON files for better performance and caching
- **Client-Side Search**: Fuse.js provides instant search results without API calls
- **Static Assets**: All Excalidraw files served directly from `/public/excalidraw/`
- **Progressive Loading**: Optimized data loading for better user experience

## Environment Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to parent directory metadata and artifacts

### Development Setup
```bash
# Install dependencies
npm install

# Prepare static data from parent project
npm run prepare-data

# Start development server
npm run dev
```

**IMPORTANT - Developer Responsibility**: 
- The **developer/user is responsible** for running `npm run dev` to start the development server
- **Agents should NOT automatically start the development server** to avoid port collisions and multiple running instances
- Agents should periodically remind developers to start/restart the dev server when needed
- If development server issues arise, guide the developer to restart it manually
- **Agents CAN automatically open the built-in web browser** to inspect results once the developer has started the server

### Build and Deploy
```bash
# Build for production
npm run build

# Deploy to Azure Static Web Apps
npm run deploy:swa
```

## Project Structure

```
web/
├── public/                     # Static assets (generated)
│   ├── data/                   # JSON data files
│   │   ├── icons.json         # Complete icon metadata
│   │   ├── emojis.json        # Complete emoji metadata  
│   │   ├── categories.json    # Category hierarchy
│   │   └── search-index.json  # Optimized search data
│   ├── excalidraw/            # Excalidraw files
│   │   ├── icons/             # Icon .excalidraw files
│   │   └── emojis/            # Emoji .excalidraw files
│   └── index.html
├── src/                       # React application source
│   ├── components/            # React components
│   │   ├── layout/           # Layout components (Header, Sidebar)
│   │   ├── search/           # Search interface components
│   │   ├── icons/            # Icon display components
│   │   ├── preview/          # Preview modal components
│   │   └── common/           # Shared components
│   ├── hooks/                # Custom React hooks
│   ├── services/             # Data loading and utility services
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Helper functions and constants
│   └── styles/               # CSS modules and global styles
├── build-scripts/            # Data preparation scripts
│   └── prepare-data.js       # Main data processing script
├── tests/                    # Test files
├── build/                    # Production build output
└── README.md
```

## Data Flow

### 1. Build-Time Data Preparation
The `prepare-data.js` script processes source data:

```bash
npm run prepare-data
```

This script:
- Reads `../metadata/icons.json` and `../metadata/emojis.json`
- Processes and optimizes data for client-side usage
- Copies Excalidraw files from `../artifacts/excalidraw*` to `public/excalidraw/`
- Generates optimized JSON files in `public/data/`
- Creates search indexes for Fuse.js

### 2. Runtime Data Loading
The React app loads data progressively:

1. **Initial Load**: Loads search index (smaller file) first
2. **Background**: Loads full metadata for detailed views
3. **On-Demand**: Loads Excalidraw files when previewing/downloading

### 3. Search Implementation
Client-side search using Fuse.js:
- Fuzzy matching across icon names, categories, and keywords
- Real-time filtering by category, size, and style
- Debounced input (300ms) for performance
- Virtual scrolling for large result sets

## Key Components

### Search System
- **SearchBar**: Main search input with autocomplete
- **SearchFilters**: Category, size, and style filters
- **SearchResults**: Virtualized results grid

### Icon Display
- **IconGrid**: Virtual scrolling grid of icons
- **IconCard**: Individual icon display with metadata
- **IconPreview**: Modal with Excalidraw rendering

### Preview System
- **ExcalidrawViewer**: Embeds Excalidraw for live preview
- **DownloadButton**: Handles file downloads
- **PreviewModal**: Full-screen preview interface

## Performance Optimizations

### Client-Side Optimizations
- **Virtual Scrolling**: Handle 5,000+ items efficiently
- **Code Splitting**: Route and component-based lazy loading
- **Memoization**: React.memo for expensive components
- **Debounced Search**: 300ms delay to reduce computation
- **Progressive Loading**: Load critical data first

### Static Asset Optimizations
- **CDN Caching**: Long cache headers for immutable assets
- **Compression**: Gzip compression for JSON files  
- **Bundle Splitting**: Separate vendor and app bundles
- **Tree Shaking**: Remove unused code

### Search Performance
```typescript
// Optimized search service with caching
class SearchService {
  private fuse: Fuse<SearchItem>;
  private cache = new Map<string, SearchResult>();
  
  search(query: string, filters: SearchFilters): SearchResult {
    const cacheKey = `${query}:${JSON.stringify(filters)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    // ... search implementation
  }
}
```

## Data Schema

### Icon Data Structure
```typescript
interface Icon {
  id: string;                    // "add-24-filled"
  name: string;                  // "add"
  displayName: string;           // "Add"
  category: string;              // "Actions"
  size: number;                  // 24
  style: 'filled' | 'regular' | 'light';
  keywords: string[];            // ["plus", "create", "new"]
  excalidrawPath: string;        // "/excalidraw/icons/add-24-filled.excalidraw"
  originalPath: string;          // Original SVG path reference
}
```

### Search Index Structure
```typescript
interface SearchIndex {
  icons: Array<{
    id: string;
    searchText: string;          // Flattened searchable text
    category: string;
    size: number;
    style: string;
  }>;
  emojis: Array<{
    id: string;
    searchText: string;
    category: string;
  }>;
}
```

## Maintenance Tasks

### Data Updates
When parent project metadata changes:
```bash
# Regenerate static data
npm run prepare-data

# Rebuild application
npm run build
```

### Performance Monitoring
- Monitor Core Web Vitals in Application Insights
- Track search performance and popular queries
- Monitor download success rates
- Watch for client-side errors

### Content Updates
- Icons: Automatically updated from parent project metadata
- Categories: Update based on `../config/icon_categories.json`
- Search keywords: Enhanced through synonym mapping

## Testing Strategy

### Unit Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

### Integration Tests
```bash
npm run test:integration   # API integration tests
```

### End-to-End Tests
```bash
npm run test:e2e          # Playwright E2E tests
```

### Performance Testing
- Lighthouse CI in GitHub Actions
- Bundle size monitoring
- Search performance benchmarks

## Deployment

### Azure Static Web Apps
Deployment is automatic via GitHub Actions:

1. **Trigger**: Push to main branch
2. **Build**: Runs `npm run build` (includes data preparation)
3. **Deploy**: Deploys to Azure Static Web Apps
4. **CDN**: Assets distributed globally

### Configuration
- **staticwebapp.config.json**: Routing and caching rules
- **Environment Variables**: None required (fully static)
- **Custom Domain**: Configured in Azure portal

## Troubleshooting

### Common Issues

**Development Server Not Running**
- **Developer Action Required**: Run `npm run dev` to start the development server
- **Agent Reminder**: Agents should guide developers to start the server, not do it automatically
- **Port Conflicts**: If port 3000 is busy, the developer should stop other instances or use a different port

**Build Fails - Missing Data**
```bash
# Ensure parent project has generated artifacts
cd .. && python scripts/svg_to_excalidraw.py
cd web && npm run prepare-data
```

**Search Performance Issues**
- Check search index size in browser dev tools
- Monitor memory usage with large result sets
- Consider pagination for very large datasets

**Preview Not Working**
- Verify Excalidraw files are copied correctly
- Check browser console for CORS issues
- Ensure files have correct Content-Type headers

### Debug Mode
```bash
# Enable detailed logging
REACT_APP_DEBUG=true npm start
```

### Performance Debugging
```bash
# Analyze bundle size
npm run analyze

# Run performance audit
npm run test:e2e -- --headed
```

## License and Attribution

### Original Content
- **Fluent UI System Icons**: Licensed under [Fluent UI System Icons License](https://github.com/microsoft/fluentui-system-icons)
- **Fluent UI Emojis**: Licensed under [MIT License](https://github.com/microsoft/fluentui-emoji)
- **Ownership**: Microsoft Corporation

### Web Application Code
- **License**: MIT License (see ../LICENSE)
- **Attribution**: Built with React, Fluent UI React, and Excalidraw

### Required Attribution Display
The application **MUST** prominently display:
- Original icon source and Microsoft ownership
- Link to Microsoft's Fluent UI System Icons repository
- License information and usage terms
- Clear distinction between Microsoft's icons and this tool

### Usage Restrictions
- Icons remain subject to Microsoft's licensing terms
- Commercial usage governed by original licenses
- Attribution requirements must be maintained
- Trademark usage restrictions apply

## Future Enhancements

### Planned Features
- **Advanced Search**: Semantic search with AI
- **User Preferences**: Save favorites and settings
- **Batch Operations**: Multi-select and bulk download
- **Custom Themes**: Personalized Excalidraw styling
- **Collaboration**: Share icon collections

### Technical Improvements
- **Service Worker**: Better offline support
- **PWA**: Install as app on devices
- **Performance**: Further optimization for mobile
- **Analytics**: Enhanced usage tracking
- **API**: Public API for third-party integration

## Agent Guidelines

### Development Server Management
- **NEVER automatically start the development server** (`npm run dev`, `npm start`, etc.)
- **Always remind the developer** to start/restart the server when changes require it
- **Avoid port collisions** by ensuring only the developer controls server instances
- **Periodically check** if the developer needs to restart the server for changes to take effect
- **Guide troubleshooting** but let the developer execute server commands
- **DO automatically open the built-in web browser** to inspect results and show changes to the developer
- **Use the built-in browser** to verify functionality after code changes are made

Example reminder phrases:
- "Please run `npm run dev` to start the development server and see your changes"
- "You may need to restart your development server for these changes to take effect"  
- "Don't forget to start the dev server with `npm run dev` if it's not already running"
- "Let me open the built-in browser to show you the results once your server is running"

### Code Quality
- Follow TypeScript strict mode
- Use ESLint and Prettier configurations
- Maintain 80%+ test coverage
- Document complex algorithms

### Performance
- Profile search operations regularly
- Monitor bundle size growth
- Optimize for mobile-first experience
- Use React DevTools Profiler

### Accessibility
- Maintain WCAG 2.1 AA compliance
- Test with screen readers
- Ensure keyboard navigation
- Provide alternative text for icons

### Monitoring
- Track user engagement metrics
- Monitor error rates and performance
- Analyze search patterns
- Report usage statistics

---

**This guide provides comprehensive instructions for maintaining and extending the Fluent UI Icons to Excalidraw web application. All operations should maintain the static, serverless architecture while providing optimal user experience.**