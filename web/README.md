# Fluent Jot - Hand-drawn Fluent UI Icons & Emojis

A beautiful React-based web application that provides an intuitive interface for searching, previewing, and downloading Microsoft's Fluent UI icons and emojis in hand-drawn Excalidraw format. Visit us at [fluentjot.design](https://fluentjot.design).

## 🚀 Features

- **🔍 Smart Search**: Fuzzy search with autocomplete and filtering
- **🎨 Live Preview**: Real-time Excalidraw rendering
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile
- **🏷️ Category Filtering**: Organized by icon categories
- **⬇️ Easy Downloads**: Individual and batch download support
- **🌙 Theme Support**: Light and dark mode
- **⚡ Performance**: Virtual scrolling and optimized loading
- **♿ Accessible**: WCAG 2.1 compliant interface

## 🏗️ Architecture

This application follows a modern JAMstack architecture:

- **Frontend**: React 18 + TypeScript + Fluent UI React v9
- **Backend**: Static JSON files (no server-side code)
- **Hosting**: Azure Static Web Apps
- **Storage**: Static assets served via CDN
- **Search**: Client-side fuzzy search with Fuse.js

## 📋 Prerequisites

- Node.js 18+ and npm
- Azure account with active subscription
- GitHub account
- Visual Studio Code (recommended)

### Recommended VS Code Extensions
- Azure Static Web Apps
- Azure Functions
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer

## 🛠️ Development Setup

### 1. Environment Setup

```bash
# Install Node.js dependencies
cd web
npm install

# Install Azure Static Web Apps CLI globally
npm install -g @azure/static-web-apps-cli

# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### 2. Environment Variables (Optional)

Create a `.env.local` file in the `web` directory for optional features:

```env
# Google Analytics (optional)
# Get your GA4 Measurement ID from Google Analytics
# Format: G-XXXXXXXXXX
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX

# Application Insights (optional for development)
REACT_APP_APPINSIGHTS_INSTRUMENTATION_KEY=your-key-here

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_DEBUG=false
```

### Google Analytics Setup

To enable Google Analytics tracking:

1. Create a Google Analytics 4 property at [analytics.google.com](https://analytics.google.com)
2. Get your Measurement ID (format: `G-XXXXXXXXXX`)
3. Add it to your `.env.local` file as `REACT_APP_GA_TRACKING_ID`
4. Deploy or restart your development server

The Google Analytics script is loaded dynamically at runtime when a valid tracking ID is provided, ensuring optimal performance and compatibility with different deployment environments.

The application tracks:
- Page views and route changes
- Icon/emoji downloads and clipboard copies
- Search queries (debounced to avoid spam)
- Category selections and filtering
- External link clicks
- Application errors for debugging

### 3. Local Development

```bash
# Prepare static data from parent project
npm run prepare-data

# Start the development server
npm start

# Alternative: Start with SWA CLI for full simulation
npm run start:swa
```

The application will be available at `http://localhost:3000` serving static data files.

## 📁 Project Structure

```
web/
├── public/                 # Static assets
│   ├── index.html
│   ├── manifest.json
│   └── icons/
├── src/                   # React application source
│   ├── components/        # React components
│   │   ├── layout/
│   │   ├── search/
│   │   ├── icons/
│   │   ├── preview/
│   │   └── common/
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and utility services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Helper functions
│   ├── styles/           # CSS modules and global styles
│   └── App.tsx          # Main application component
├── public/              # Static assets (generated)
│   ├── data/           # JSON data files
│   ├── excalidraw/     # Excalidraw files
│   └── index.html
├── build-scripts/        # Build and deployment scripts
├── tests/               # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── staticwebapp.config.json  # Azure SWA configuration
├── package.json
└── README.md
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run all tests
npm run test:all
```

## 🏗️ Building for Production

```bash
# Build the React application
npm run build

# Test the production build locally
npm run serve

# Build and test with SWA CLI
npm run build:swa
npm run start:swa
```

## 🚀 Deployment

### Automatic Deployment via GitHub Actions ✅ CONFIGURED

The repository includes a comprehensive GitHub Actions workflow that automatically:

1. **🔧 Builds the application** with all dependencies
2. **🎨 Generates Excalidraw files** from SVG sources (5,980 icons + 1,595 emojis)
3. **✅ Runs quality checks** (linting, type checking)
4. **🚀 Deploys to Azure Static Web Apps** with optimizations

**To deploy:**
1. Create Azure Static Web App resource
2. Add `AZURE_STATIC_WEB_APPS_API_TOKEN` to GitHub repository secrets
3. Push to `main` branch - deployment triggers automatically!

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed setup instructions.

### Quick Setup Commands

```bash
# Test build locally (mimics GitHub Actions)
../scripts/build-for-deployment.sh

# Create Azure Static Web App (requires Azure CLI)
az staticwebapp create \
  --name fluent-jot \
  --resource-group rg-fluent-jot \
  --source https://github.com/wictorwilen/fluentui-icons-to-excalidraw \
  --location "East US" \
  --branch main \
  --app-location "/web" \
  --output-location "build"
```

### Deployment Features

- ✅ **Automated CI/CD** with GitHub Actions
- ✅ **Smart caching** for faster builds (dependencies + artifacts)
- ✅ **Quality gates** (linting, type checking, build verification)
- ✅ **Preview deployments** for pull requests
- ✅ **Custom domain support** (fluentjot.design ready)
- ✅ **Global CDN** with Azure Static Web Apps
- ✅ **Free SSL certificates** and security headers
- ✅ **Performance optimization** with asset caching

## 📊 Performance

The application is optimized for performance with:

- **Lighthouse Score**: Target 90+ across all metrics
- **First Contentful Paint**: < 1.2s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Performance Monitoring

Application performance is monitored using:
- Azure Application Insights
- Core Web Vitals tracking
- Custom performance metrics
- Real User Monitoring (RUM)

## 🔧 Configuration

### Azure Static Web Apps Configuration

The `staticwebapp.config.json` file configures:
- Routing rules
- Authentication (if needed)
- Custom headers
- Redirects and rewrites

### Build Configuration

Build process includes:
- TypeScript compilation
- CSS optimization and purging
- Bundle splitting and compression
- Asset optimization
- Service worker generation

## 🐛 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**API Connection Issues**
```bash
# Verify Function runtime is running
func start --port 7071
```

**Deployment Issues**
```bash
# Check deployment logs in Azure Portal
# Verify staticwebapp.config.json is valid
```

### Debugging

Enable debug mode:
```env
REACT_APP_DEBUG=true
NODE_ENV=development
```

View detailed logs:
```bash
# Frontend logs
npm start -- --verbose

# API logs
func start --verbose
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript and React best practices
- Write tests for new features
- Update documentation as needed
- Follow conventional commit messages
- Ensure accessibility compliance

## 📄 License & Attribution

### Original Content
- **Fluent UI System Icons**: Licensed under [Fluent UI System Icons License](https://github.com/microsoft/fluentui-system-icons)
- **Fluent UI Emojis**: Licensed under [MIT License](https://github.com/microsoft/fluentui-emoji)  
- **Ownership**: Microsoft Corporation
- **Source**: [Microsoft Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons)

### This Web Application
- **License**: MIT License - see the [LICENSE](../LICENSE) file for details
- **Purpose**: Tool for converting and accessing Microsoft's icons, not a replacement
- **Attribution**: Built with React, Fluent UI React, and Excalidraw

### 🚨 Important Usage Notes

**Icon Ownership**: All icons remain the property of Microsoft Corporation and are subject to Microsoft's licensing terms. This web application is a tool for accessing and converting these icons, not a redistribution of the icons themselves.

**License Compliance**: When using icons from this application:
1. ✅ **Do**: Attribute Microsoft as the source of the original icons
2. ✅ **Do**: Follow Microsoft's Fluent UI System Icons license terms
3. ✅ **Do**: Link back to the original Microsoft repositories
4. ❌ **Don't**: Claim ownership of the icon designs
5. ❌ **Don't**: Remove or modify Microsoft's copyright notices

**Commercial Use**: Commercial usage of the icons is governed by Microsoft's original license terms. Please review the [Fluent UI System Icons license](https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE) for specific terms.

## 🙏 Acknowledgments

- **Microsoft** for creating and open-sourcing the Fluent UI System Icons
- **Excalidraw** for the amazing hand-drawn style rendering engine
- **React and Fluent UI teams** for the excellent development frameworks
- **The open-source community** for inspiration and contributions

## 📞 Support

- 📧 Create an issue for bug reports
- 💬 Join discussions for questions
- 📖 Check the documentation for guidance

---

**Built with ❤️ using Azure Static Web Apps**