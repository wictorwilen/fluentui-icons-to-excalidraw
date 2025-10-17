#!/bin/bash

# Script to update changelog with simplified, high-level entries
# This follows the guidelines in AGENTS.md for concise changelog maintenance

set -e

# Backup existing changelog
cp CHANGELOG.md CHANGELOG.md.backup

# Get the latest commits since last changelog update
LAST_UPDATE=$(git log --grep="docs: update changelog" --format="%H" -1 2>/dev/null || echo "")
if [ -n "$LAST_UPDATE" ]; then
    COMMITS=$(git log --format="%s" "${LAST_UPDATE}..HEAD" | grep -E "^(feat|fix|perf|refactor|enhance)" | head -5)
else
    # If no previous changelog commits, get recent meaningful commits
    COMMITS=$(git log --format="%s" | grep -E "^(feat|fix|perf|refactor|enhance)" | head -5)
fi

if [ -z "$COMMITS" ]; then
    echo "No significant changes found to add to changelog"
    rm CHANGELOG.md.backup
    exit 0
fi

# Create temporary file with new entries
TEMP_FILE=$(mktemp)

# Write the header
cat > $TEMP_FILE << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

EOF

# Process commits and add to changelog
HAS_FIXES=false
HAS_CHANGES=false
HAS_ADDED=false

FIXES=""
CHANGES=""
ADDED=""

while IFS= read -r commit; do
    if [ -z "$commit" ]; then
        continue
    fi
    
    # Clean up commit message - remove prefixes and technical details
    clean_msg=$(echo "$commit" | sed -E 's/^(feat|fix|perf|refactor|enhance)(\([^)]*\))?:\s*//i' | \
                sed -E 's/\b(threshold|parameter|function|implementation|algorithm|logic)\b//gi' | \
                sed -E 's/\s+/ /g' | \
                sed -E 's/^\s+|\s+$//g')
    
    # Skip if message is too short or too technical
    if [ ${#clean_msg} -lt 10 ]; then
        continue
    fi
    
    # Categorize based on original prefix
    if echo "$commit" | grep -qiE "^fix"; then
        if [ "$HAS_FIXES" = false ]; then
            FIXES="### Fixed\n"
            HAS_FIXES=true
        fi
        FIXES="${FIXES}- **${clean_msg}**\n"
    elif echo "$commit" | grep -qiE "^feat"; then
        if [ "$HAS_ADDED" = false ]; then
            ADDED="### Added\n"
            HAS_ADDED=true
        fi
        ADDED="${ADDED}- **${clean_msg}**\n"
    else
        if [ "$HAS_CHANGES" = false ]; then
            CHANGES="### Changed\n"
            HAS_CHANGES=true
        fi
        CHANGES="${CHANGES}- **${clean_msg}**\n"
    fi
done <<< "$COMMITS"

# Add sections to temp file
if [ "$HAS_ADDED" = true ]; then
    echo -e "$ADDED" >> $TEMP_FILE
fi

if [ "$HAS_FIXES" = true ]; then
    echo -e "$FIXES" >> $TEMP_FILE
fi

if [ "$HAS_CHANGES" = true ]; then
    echo -e "$CHANGES" >> $TEMP_FILE
fi

# Get existing changelog content after [Unreleased] section
EXISTING_CONTENT=$(sed -n '/## \[Unreleased\]/,$p' CHANGELOG.md.backup | tail -n +2)
if [ -n "$EXISTING_CONTENT" ]; then
    echo "" >> $TEMP_FILE
    echo "$EXISTING_CONTENT" >> $TEMP_FILE
fi

# Replace the changelog
mv $TEMP_FILE CHANGELOG.md
rm CHANGELOG.md.backup

echo "Changelog updated successfully"