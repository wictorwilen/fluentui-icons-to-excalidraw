# Azure Static Web Apps Deployment Guide

This guide explains how to deploy Fluent Jot to Azure Static Web Apps using GitHub Actions.

## Prerequisites

- Azure subscription
- GitHub repository with admin access
- Azure CLI installed (optional, for command-line setup)

## Setup Instructions

### 1. Create Azure Static Web App

#### Option A: Using Azure Portal

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Create a new resource → Static Web App
3. Configure the basic settings:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `fluent-jot` (or your preferred name)
   - **Plan type**: Free (sufficient for this project)
   - **Region**: Choose closest to your users
   - **Source**: GitHub
   - **GitHub account**: Connect your account
   - **Organization**: `wictorwilen`
   - **Repository**: `fluentui-icons-to-excalidraw`
   - **Branch**: `main`
   - **Build presets**: React
   - **App location**: `/web`
   - **Output location**: `build`

4. Click "Review + create" then "Create"

#### Option B: Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name rg-fluent-jot --location "East US"

# Create Static Web App
az staticwebapp create \
  --name fluent-jot \
  --resource-group rg-fluent-jot \
  --source https://github.com/wictorwilen/fluentui-icons-to-excalidraw \
  --location "East US" \
  --branch main \
  --app-location "/web" \
  --output-location "build" \
  --login-with-github
```

### 2. Configure GitHub Secrets

After creating the Static Web App, Azure will automatically:
1. Create a GitHub Actions workflow file
2. Add the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret to your repository

If you need to manually add the secret:
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Add new repository secret:
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: [Get from Azure Portal → Static Web App → Manage deployment token]

### 3. Custom Domain Setup (Optional)

To use the `fluentjot.design` domain:

1. In Azure Portal → Static Web App → Custom domains
2. Click "Add custom domain"
3. Enter `fluentjot.design`
4. Follow DNS configuration instructions
5. Add CNAME record pointing to your Azure Static Web App URL

Example DNS configuration:
```
Type: CNAME
Name: @
Value: [your-static-web-app].azurestaticapps.net
```

### 4. Environment Configuration

The workflow automatically handles:
- ✅ Node.js 18 setup
- ✅ Python 3.9 for data processing
- ✅ Dependency caching
- ✅ Artifact caching for faster builds
- ✅ Code quality checks (linting, type checking)
- ✅ Build optimization

### 5. Deployment Process

The deployment triggers automatically when:
- Pushing to `main` branch
- Creating/updating pull requests
- Changes are made to:
  - `web/**` (React application)
  - `scripts/**` (Python processing scripts)
  - `metadata/**` (Icon/emoji data)
  - `config/**` (Configuration files)

## Workflow Features

### 🚀 Automated Build Pipeline

1. **Setup Environment**
   - Node.js 18 with npm caching
   - Python 3.9 with pip caching
   - Artifact caching for faster builds

2. **Data Processing**
   - Generate Excalidraw files from SVG sources
   - Cache artifacts to avoid regeneration
   - Process 5,980 icons + 1,595 emojis

3. **Quality Assurance**
   - ESLint code quality checks
   - TypeScript type checking
   - Build optimization

4. **Deployment**
   - Deploy to Azure Static Web Apps
   - Preview deployments for pull requests
   - Automatic cleanup of closed PRs

### 📊 Build Optimization

The workflow includes several optimizations:
- **Caching**: Dependencies and generated files cached between builds
- **Conditional Generation**: Only regenerate Excalidraw files when source data changes
- **Memory Optimization**: Increased Node.js memory limit for large builds
- **Source Maps**: Disabled in production for smaller bundle size

### 🔍 Monitoring & Debugging

The workflow provides detailed logging:
- File counts and sizes
- Build performance metrics
- Deployment status and URLs
- Error details for troubleshooting

## Post-Deployment Configuration

### Application Insights (Recommended)

1. Create Application Insights resource in Azure
2. Copy the Instrumentation Key
3. Add to Static Web App configuration:
   - Azure Portal → Static Web App → Configuration
   - Add application setting:
     - Name: `APPLICATIONINSIGHTS_CONNECTION_STRING`
     - Value: Your connection string

### Custom Headers & Routing

The app includes `staticwebapp.config.json` with:
- Security headers (CSP, HSTS, etc.)
- Caching rules for static assets
- Routing configuration for SPA
- Mime type configurations

### SSL & Security

Azure Static Web Apps automatically provides:
- ✅ Free SSL certificates
- ✅ Global CDN distribution
- ✅ DDoS protection
- ✅ Custom domain support

## Troubleshooting

### Common Issues

**Build Failures:**
- Check that all required directories exist in the repository
- Verify Python dependencies are correctly installed
- Check Node.js memory limits for large builds

**Deployment Failures:**
- Verify `AZURE_STATIC_WEB_APPS_API_TOKEN` secret is correct
- Check app and output locations match workflow configuration
- Review Azure Static Web Apps logs in Azure Portal

**Performance Issues:**
- Monitor bundle size (currently ~711KB, needs optimization)
- Check Azure Static Web Apps quotas and limits
- Review Application Insights performance data

### Support Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)
- [Fluent Jot Issues](https://github.com/wictorwilen/fluentui-icons-to-excalidraw/issues)

## Cost Estimation

**Azure Static Web Apps (Free Tier):**
- ✅ 100GB bandwidth per month
- ✅ 0.5GB storage
- ✅ Custom domains with SSL
- ✅ Global CDN distribution
- ✅ Staging environments

**Expected Usage:**
- Bundle size: ~711KB (needs optimization)
- Static assets: ~2GB (Excalidraw files)
- Monthly bandwidth: <10GB (estimated)

The Free tier should be sufficient for most usage patterns. Monitor usage in Azure Portal and upgrade to Standard tier if needed.