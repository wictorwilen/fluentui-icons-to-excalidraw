#!/bin/bash

# Fluent Jot - Local Build and Deployment Preparation Script
# This script mimics the GitHub Actions workflow for local testing

set -e  # Exit on any error

echo "🚀 Fluent Jot - Build and Deployment Preparation"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi
print_success "Python 3 found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is required but not installed"
    exit 1
fi
print_success "npm found: $(npm --version)"

# Install Python dependencies
print_status "Installing Python dependencies..."
python3 -m pip install --upgrade pip
pip install -r requirements.txt
print_success "Python dependencies installed"

# Check if data directories exist
print_status "Verifying data directories..."
if [ ! -d "metadata" ]; then
    print_error "metadata directory not found"
    exit 1
fi

if [ ! -d "vendor/icons/assets" ]; then
    print_error "vendor/icons/assets directory not found"
    print_warning "Run icon fetching scripts first"
fi

if [ ! -d "vendor/emojis/assets" ]; then
    print_error "vendor/emojis/assets directory not found"
    print_warning "Run emoji fetching scripts first"
fi

# Generate Excalidraw files for icons
print_status "Generating Excalidraw files for icons..."
if [ ! -d "artifacts/excalidraw" ] || [ "metadata/icons.json" -nt "artifacts/excalidraw" ]; then
    mkdir -p artifacts/excalidraw
    python3 scripts/svg_to_excalidraw.py --input-dir vendor/icons/assets --output-dir artifacts/excalidraw
    icon_count=$(find artifacts/excalidraw -name '*.excalidraw' | wc -l)
    print_success "Generated $icon_count icon Excalidraw files"
else
    icon_count=$(find artifacts/excalidraw -name '*.excalidraw' | wc -l)
    print_success "Using cached icon Excalidraw files ($icon_count files)"
fi

# Generate Excalidraw files for emojis
print_status "Generating Excalidraw files for emojis..."
if [ ! -d "artifacts/excalidraw_emojis" ] || [ "metadata/emojis.json" -nt "artifacts/excalidraw_emojis" ]; then
    mkdir -p artifacts/excalidraw_emojis
    python3 scripts/emoji_to_excalidraw.py --input-dir vendor/emojis/assets --output-dir artifacts/excalidraw_emojis
    emoji_count=$(find artifacts/excalidraw_emojis -name '*.excalidraw' | wc -l)
    print_success "Generated $emoji_count emoji Excalidraw files"
else
    emoji_count=$(find artifacts/excalidraw_emojis -name '*.excalidraw' | wc -l)
    print_success "Using cached emoji Excalidraw files ($emoji_count files)"
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
cd web
npm ci --no-optional
print_success "Node.js dependencies installed"

# Run code quality checks
print_status "Running code quality checks..."
npm run lint:check
npm run type-check
print_success "Code quality checks passed"

# Build the application
print_status "Building Fluent Jot application..."
npm run build
print_success "Build completed successfully"

# Display build information
print_status "Build size analysis:"
build_size=$(du -sh build/ | cut -f1)
echo "  📦 Total build size: $build_size"

js_files=$(find build/static/js -name "*.js" | wc -l)
css_files=$(find build/static/css -name "*.css" | wc -l)
total_files=$(find build -type f | wc -l)

echo "  📊 Build contents:"
echo "    - JavaScript files: $js_files"
echo "    - CSS files: $css_files"
echo "    - Total files: $total_files"

# Show largest files
echo "  📋 Largest files:"
find build -type f -exec du -h {} + | sort -hr | head -5 | sed 's/^/    /'

cd ..

print_success "Build preparation complete!"
echo ""
print_status "Summary:"
echo "  🎨 Icons available: $icon_count"
echo "  😀 Emojis available: $emoji_count"
echo "  📦 Build size: $build_size"
echo "  📁 Build location: web/build/"
echo ""
print_status "Ready for deployment to Azure Static Web Apps!"

echo ""
print_warning "Next steps:"
echo "  1. Commit and push changes to trigger GitHub Actions deployment"
echo "  2. Or manually deploy using Azure CLI:"
echo "     az staticwebapp deploy --name fluent-jot --source ./web/build"
echo "  3. Monitor deployment at: https://github.com/wictorwilen/fluentui-icons-to-excalidraw/actions"