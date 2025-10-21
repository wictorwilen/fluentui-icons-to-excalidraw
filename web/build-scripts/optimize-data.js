#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Data optimization script for icons.json
 * Reduces file size through normalization, compression, and smart indexing
 */

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const ICONS_JSON = path.join(DATA_DIR, 'icons.json');
const OPTIMIZED_JSON = path.join(DATA_DIR, 'icons-optimized.json');

/**
 * Optimization Strategy:
 * 1. Remove 'size' field (no longer needed per user request)
 * 2. Create string dictionaries for repeated values (categories, styles, common paths)
 * 3. Shorten field names 
 * 4. Use numeric IDs instead of verbose strings where possible
 * 5. Separate search index from display data
 */

function optimizeIconsData() {
  console.log('🔧 Optimizing icons.json...');
  
  if (!fs.existsSync(ICONS_JSON)) {
    throw new Error(`Icons file not found: ${ICONS_JSON}`);
  }
  
  const originalData = JSON.parse(fs.readFileSync(ICONS_JSON, 'utf8'));
  console.log(`📊 Original file size: ${(fs.statSync(ICONS_JSON).size / 1024 / 1024).toFixed(2)}MB`);
  
  // Create dictionaries for common strings
  const categories = [...new Set(originalData.icons.map(icon => icon.category))];
  const styles = [...new Set(originalData.icons.map(icon => icon.style))];
  const commonPaths = extractCommonPaths(originalData.icons);
  
  console.log(`📋 Found ${categories.length} categories, ${styles.length} styles`);
  
  // Optimize icon data structure
  const optimizedIcons = originalData.icons.map((icon, index) => {
    const optimized = {
      // Shortened field names
      i: icon.id,                                    // id
      n: icon.name,                                  // name  
      d: icon.displayName,                           // displayName
      c: categories.indexOf(icon.category),          // category (index)
      s: styles.indexOf(icon.style),                 // style (index)
      k: compressKeywords(icon.keywords),            // keywords (compressed)
      e: compressPath(icon.excalidrawPath, commonPaths), // excalidrawPath (compressed)
      // Remove size field as requested
      // Remove originalPath to save space (not needed in frontend)
    };
    
    return optimized;
  });
  
  // Create optimized structure
  const optimizedData = {
    meta: {
      totalCount: originalData.metadata.totalCount,
      lastUpdated: originalData.metadata.lastUpdated,
      version: "2.0.0", // Mark as optimized version
      compression: {
        categories,
        styles,
        commonPaths
      }
    },
    icons: optimizedIcons
  };
  
  // Write optimized file
  fs.writeFileSync(OPTIMIZED_JSON, JSON.stringify(optimizedData, null, 0)); // No formatting to save space
  
  const originalSize = fs.statSync(ICONS_JSON).size;
  const optimizedSize = fs.statSync(OPTIMIZED_JSON).size;
  const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
  
  console.log(`✅ Optimization complete!`);
  console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Optimized: ${(optimizedSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Savings: ${savings}% (${((originalSize - optimizedSize) / 1024 / 1024).toFixed(2)}MB)`);
  
  return optimizedData;
}

/**
 * Extract common path prefixes to create a compression dictionary
 */
function extractCommonPaths(icons) {
  const paths = icons.map(icon => icon.excalidrawPath);
  const prefixes = {};
  
  // Find common prefixes
  paths.forEach(path => {
    const parts = path.split('/');
    for (let i = 1; i < parts.length - 1; i++) {
      const prefix = parts.slice(0, i + 1).join('/');
      prefixes[prefix] = (prefixes[prefix] || 0) + 1;
    }
  });
  
  // Keep only prefixes used frequently (saves space)
  return Object.entries(prefixes)
    .filter(([prefix, count]) => count > 10 && prefix.length > 10)
    .sort((a, b) => b[1] - a[1]) // Sort by frequency
    .slice(0, 20) // Keep top 20
    .map(([prefix]) => prefix);
}

/**
 * Compress file paths using dictionary
 */
function compressPath(path, commonPaths) {
  for (let i = 0; i < commonPaths.length; i++) {
    if (path.startsWith(commonPaths[i])) {
      return `${i}:${path.substring(commonPaths[i].length)}`;
    }
  }
  return path; // No compression possible
}

/**
 * Compress keywords by removing duplicates and common words
 */
function compressKeywords(keywords) {
  // Remove very common words that don't add search value
  const stopWords = new Set(['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for']);
  
  return keywords
    .filter(keyword => keyword.length > 1 && !stopWords.has(keyword))
    .filter((keyword, index, arr) => arr.indexOf(keyword) === index) // Remove duplicates
    .slice(0, 8); // Limit to 8 most relevant keywords
}

/**
 * Create separate search index for better performance
 */
function createSearchIndex(icons) {
  console.log('🔍 Creating search index...');
  
  const searchIndex = icons.map(icon => ({
    i: icon.i, // id reference
    t: `${icon.n} ${icon.d} ${icon.k.join(' ')}`.toLowerCase() // searchable text
  }));
  
  const searchIndexPath = path.join(DATA_DIR, 'search-index.json');
  fs.writeFileSync(searchIndexPath, JSON.stringify({ index: searchIndex }, null, 0));
  
  console.log(`🔍 Search index created: ${(fs.statSync(searchIndexPath).size / 1024).toFixed(1)}KB`);
}

/**
 * Create categories file for filters
 */
function createCategoriesFile(categories) {
  const categoriesData = {
    categories: categories.map((name, index) => ({
      id: index,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }))
  };
  
  const categoriesPath = path.join(DATA_DIR, 'categories.json');
  fs.writeFileSync(categoriesPath, JSON.stringify(categoriesData, null, 2));
  
  console.log(`🏷️ Categories file created: ${(fs.statSync(categoriesPath).size / 1024).toFixed(1)}KB`);
}

// Run optimization
try {
  const optimizedData = optimizeIconsData();
  createSearchIndex(optimizedData.icons);
  createCategoriesFile(optimizedData.meta.compression.categories);
  
  console.log('🎉 All optimizations complete!');
  console.log('📝 Next steps:');
  console.log('   1. Update frontend to use optimized format');
  console.log('   2. Replace icons.json with icons-optimized.json');
  console.log('   3. Update search to use separate search-index.json');
  
} catch (error) {
  console.error('❌ Optimization failed:', error.message);
  process.exit(1);
}