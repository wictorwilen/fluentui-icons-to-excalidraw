#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Data optimization script for emojis.json
 * Applies the same optimization strategy as icons but for emoji data
 */

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const EMOJIS_JSON = path.join(DATA_DIR, 'emojis.json');
const OPTIMIZED_JSON = path.join(DATA_DIR, 'emojis-optimized.json');

/**
 * Optimization Strategy for Emojis:
 * 1. Create string dictionaries for repeated values (categories, styles, skin tones)
 * 2. Shorten field names 
 * 3. Use numeric IDs instead of verbose strings where possible
 * 4. Create separate search index for faster queries
 * 5. Remove redundant originalPath field
 */

function optimizeEmojisData() {
  console.log('😀 Optimizing emojis.json...');
  
  if (!fs.existsSync(EMOJIS_JSON)) {
    throw new Error(`Emojis file not found: ${EMOJIS_JSON}`);
  }
  
  const originalData = JSON.parse(fs.readFileSync(EMOJIS_JSON, 'utf8'));
  console.log(`📊 Original file size: ${(fs.statSync(EMOJIS_JSON).size / 1024 / 1024).toFixed(2)}MB`);
  
  // Create dictionaries for common strings
  const categories = [...new Set(originalData.emojis.map(emoji => emoji.category))];
  const styles = [...new Set(originalData.emojis.map(emoji => emoji.style))];
  const skinTones = [...new Set(originalData.emojis.map(emoji => emoji.skinTone).filter(Boolean))];
  const commonPaths = extractCommonEmojiPaths(originalData.emojis);
  
  console.log(`📋 Found ${categories.length} categories, ${styles.length} styles, ${skinTones.length} skin tones`);
  
  // Optimize emoji data structure
  const optimizedEmojis = originalData.emojis.map((emoji, index) => {
    const optimized = {
      // Shortened field names
      i: emoji.id,                                    // id
      n: emoji.name,                                  // name  
      d: emoji.displayName,                           // displayName
      c: categories.indexOf(emoji.category),          // category (index)
      s: styles.indexOf(emoji.style),                 // style (index)
      t: emoji.skinTone ? skinTones.indexOf(emoji.skinTone) : -1, // skinTone (index, -1 for null)
      k: compressKeywords(emoji.keywords),            // keywords (compressed)
      e: compressPath(emoji.excalidrawPath, commonPaths), // excalidrawPath (compressed)
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
        skinTones,
        commonPaths
      }
    },
    emojis: optimizedEmojis
  };
  
  // Write optimized file
  fs.writeFileSync(OPTIMIZED_JSON, JSON.stringify(optimizedData, null, 0)); // No formatting to save space
  
  const originalSize = fs.statSync(EMOJIS_JSON).size;
  const optimizedSize = fs.statSync(OPTIMIZED_JSON).size;
  const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
  
  console.log(`✅ Optimization complete!`);
  console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Optimized: ${(optimizedSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Savings: ${savings}% (${((originalSize - optimizedSize) / 1024 / 1024).toFixed(2)}MB)`);
  
  return optimizedData;
}

/**
 * Extract common path prefixes to create a compression dictionary for emojis
 */
function extractCommonEmojiPaths(emojis) {
  const paths = emojis.map(emoji => emoji.excalidrawPath);
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
    .slice(0, 10) // Keep top 10 for emojis (fewer than icons)
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
function createEmojiSearchIndex(emojis) {
  console.log('🔍 Creating emoji search index...');
  
  const searchIndex = emojis.map(emoji => ({
    i: emoji.i, // id reference
    t: `${emoji.n} ${emoji.d} ${emoji.k.join(' ')}`.toLowerCase() // searchable text
  }));
  
  const searchIndexPath = path.join(DATA_DIR, 'emoji-search-index.json');
  fs.writeFileSync(searchIndexPath, JSON.stringify({ index: searchIndex }, null, 0));
  
  console.log(`🔍 Emoji search index created: ${(fs.statSync(searchIndexPath).size / 1024).toFixed(1)}KB`);
}

/**
 * Create emoji categories file for filters
 */
function createEmojiCategoriesFile(categories) {
  const categoriesData = {
    categories: categories.map((name, index) => ({
      id: index,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }))
  };
  
  const categoriesPath = path.join(DATA_DIR, 'emoji-categories.json');
  fs.writeFileSync(categoriesPath, JSON.stringify(categoriesData, null, 2));
  
  console.log(`🏷️ Emoji categories file created: ${(fs.statSync(categoriesPath).size / 1024).toFixed(1)}KB`);
}

// Run optimization
try {
  const optimizedData = optimizeEmojisData();
  createEmojiSearchIndex(optimizedData.emojis);
  createEmojiCategoriesFile(optimizedData.meta.compression.categories);
  
  console.log('🎉 All emoji optimizations complete!');
  console.log('📝 Next steps:');
  console.log('   1. Update frontend to use optimized emoji format');
  console.log('   2. Replace emojis.json with emojis-optimized.json');
  console.log('   3. Update emoji search to use separate emoji-search-index.json');
  
} catch (error) {
  console.error('❌ Emoji optimization failed:', error.message);
  process.exit(1);
}