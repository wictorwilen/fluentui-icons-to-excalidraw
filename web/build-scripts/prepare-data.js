#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');

/**
 * Build script to prepare static data for the web application
 * Converts existing metadata and Excalidraw files into optimized static assets
 */

const ROOT_DIR = path.resolve(__dirname, '../..');
const WEB_DIR = path.resolve(__dirname, '..');
const METADATA_DIR = path.join(ROOT_DIR, 'metadata');
const ARTIFACTS_DIR = path.join(ROOT_DIR, 'artifacts');
const CONFIG_DIR = path.join(ROOT_DIR, 'config');
const PUBLIC_DIR = path.join(WEB_DIR, 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const EXCALIDRAW_DIR = path.join(PUBLIC_DIR, 'excalidraw');

console.log('🚀 Starting data preparation for Fluent Jot web app...');

// Ensure directories exist
fsExtra.ensureDirSync(DATA_DIR);
fsExtra.ensureDirSync(path.join(EXCALIDRAW_DIR, 'icons'));
fsExtra.ensureDirSync(path.join(EXCALIDRAW_DIR, 'emojis'));

// Copy metadata files
console.log('📋 Copying metadata files...');
if (fs.existsSync(path.join(METADATA_DIR, 'icons.json'))) {
  fsExtra.copySync(path.join(METADATA_DIR, 'icons.json'), path.join(DATA_DIR, 'icons.json'));
  console.log('  ✓ icons.json copied');
}
if (fs.existsSync(path.join(METADATA_DIR, 'emojis.json'))) {
  fsExtra.copySync(path.join(METADATA_DIR, 'emojis.json'), path.join(DATA_DIR, 'emojis.json'));
  console.log('  ✓ emojis.json copied');
}

/**
 * Extract icon name from file path
 * Example: "assets/Add/SVG/ic_fluent_add_24_filled.svg" -> "add"
 * Example: "assets/Agents/SVG/ic_fluent_agents_48_color.svg" -> "agents"
 */
function extractIconName(filePath) {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1];
  const match = filename.match(/ic_fluent_(.+?)_\d+_(filled|regular|light|color)\.svg/);
  return match ? match[1].replace(/_/g, '-') : filename.replace('.svg', '');
}

/**
 * Extract icon style from file path
 */
function extractStyle(filePath) {
  if (filePath.includes('_filled.svg')) return 'filled';
  if (filePath.includes('_light.svg')) return 'light';
  if (filePath.includes('_color.svg')) return 'color';
  return 'regular';
}

/**
 * Extract size from file path
 */
function extractSize(filePath) {
  const match = filePath.match(/_(\d+)_/);
  return match ? parseInt(match[1]) : 24;
}

/**
 * Generate display name from icon name
 */
function formatDisplayName(name) {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Map icon to category based on name and existing categories
 */
function mapIconToCategory(iconName, categories) {
  const name = iconName.toLowerCase();
  
  for (const [categoryName, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => name.includes(keyword.toLowerCase()))) {
      return categoryName;
    }
  }
  
  return 'Other';
}

/**
 * Generate keywords for search
 */
function generateKeywords(iconName, displayName, category) {
  const keywords = new Set();
  
  // Add name variations
  keywords.add(iconName);
  keywords.add(displayName.toLowerCase());
  
  // Add individual words
  iconName.split('-').forEach(word => keywords.add(word));
  displayName.split(' ').forEach(word => keywords.add(word.toLowerCase()));
  
  // Add category
  keywords.add(category.toLowerCase());
  
  // Add common synonyms
  const synonyms = {
    'add': ['plus', 'create', 'new'],
    'delete': ['remove', 'trash', 'bin'],
    'edit': ['modify', 'change', 'update'],
    'search': ['find', 'look', 'magnify'],
    'home': ['house', 'start', 'main'],
    'settings': ['config', 'preferences', 'options'],
    'user': ['person', 'profile', 'account'],
    'mail': ['email', 'message', 'envelope'],
    'phone': ['call', 'telephone', 'mobile'],
    'calendar': ['date', 'schedule', 'time']
  };
  
  Object.entries(synonyms).forEach(([key, values]) => {
    if (iconName.includes(key)) {
      values.forEach(synonym => keywords.add(synonym));
    }
  });
  
  return Array.from(keywords);
}

/**
 * Generate unique ID for icon
 */
function generateIconId(iconName, size, style) {
  return `${iconName}-${size}-${style}`;
}

async function processIcons(categories) {
  console.log('� Processing icons metadata...');
  
  const iconsJsonPath = path.join(METADATA_DIR, 'icons.json');
  
  if (!fs.existsSync(iconsJsonPath)) {
    throw new Error(`Icons metadata not found at ${iconsJsonPath}`);
  }
  
  const iconsData = JSON.parse(fs.readFileSync(iconsJsonPath, 'utf8'));
  
  console.log(`📋 Found ${iconsData.count} icons to process`);
  
  const processedIcons = [];
  const iconStats = { processed: 0, skipped: 0, errors: 0 };
  
  for (const iconData of iconsData.icons) {
    try {
      const iconName = extractIconName(iconData.path);
      const style = extractStyle(iconData.path);
      const size = iconData.size_px || extractSize(iconData.path);
      const displayName = formatDisplayName(iconName);
      const category = mapIconToCategory(iconName, categories);
      const keywords = generateKeywords(iconName, displayName, category);
      const id = generateIconId(iconName, size, style);
      
      // Look for corresponding Excalidraw file
      const excalidrawPath = findExcalidrawFile(iconData.path);
      
      if (excalidrawPath) {
        // Convert full file path to web path, preserving directory structure
        const relativePath = path.relative(path.join(ARTIFACTS_DIR, 'excalidraw'), excalidrawPath);
        processedIcons.push({
          id,
          name: iconName,
          displayName,
          category,
          style,
          keywords: keywords.slice(0, 8), // Limit keywords to 8 for size optimization
          excalidrawPath: `/excalidraw/icons/${relativePath.replace(/\\/g, '/')}`
          // Removed size field as requested
          // Removed originalPath to reduce file size
        });
        iconStats.processed++;
      } else {
        console.warn(`⚠️  No Excalidraw file found for ${iconData.path}`);
        iconStats.skipped++;
      }
    } catch (error) {
      console.error(`❌ Error processing icon ${iconData.path}:`, error.message);
      iconStats.errors++;
    }
  }
  
  console.log(`✅ Icons processed: ${iconStats.processed}, skipped: ${iconStats.skipped}, errors: ${iconStats.errors}`);
  
  return processedIcons;
}

async function processEmojis(categories) {
  console.log('😀 Processing emojis metadata...');
  
  const emojisJsonPath = path.join(METADATA_DIR, 'emojis.json');
  
  if (!fs.existsSync(emojisJsonPath)) {
    console.warn('⚠️  Emojis metadata not found, skipping emoji processing');
    return [];
  }
  
  const emojisData = JSON.parse(fs.readFileSync(emojisJsonPath, 'utf8'));
  const processedEmojis = [];
  const emojiStats = { processed: 0, skipped: 0, errors: 0 };
  
  console.log(`📋 Found ${emojisData.metadata.total_emojis} emojis to process`);
  
  for (const [emojiName, emojiInfo] of Object.entries(emojisData.emojis)) {
    try {
      // Process the default variant (usually flat style)
      const variant = emojiInfo.variants[0];
      if (!variant) {
        emojiStats.skipped++;
        continue;
      }
      
      const id = emojiName.toLowerCase().replace(/\s+/g, '-');
      const keywords = generateEmojiKeywords(emojiName, variant);
      
      // Look for corresponding Excalidraw file
      const excalidrawPath = findEmojiExcalidrawFile(emojiName);
      
      if (excalidrawPath) {
        const category = mapIconToCategory(emojiName, categories);
        
        processedEmojis.push({
          id,
          name: emojiName,
          displayName: variant.display_name,
          category: category,
          style: variant.style,
          skinTone: variant.skin_tone,
          keywords: keywords.slice(0, 8), // Limit keywords for size optimization  
          excalidrawPath: `/excalidraw/emojis/${path.basename(excalidrawPath)}`
          // Removed originalPath to reduce file size
        });
        emojiStats.processed++;
      } else {
        emojiStats.skipped++;
      }
    } catch (error) {
      console.error(`❌ Error processing emoji ${emojiName}:`, error.message);
      emojiStats.errors++;
    }
  }
  
  console.log(`✅ Emojis processed: ${emojiStats.processed}, skipped: ${emojiStats.skipped}, errors: ${emojiStats.errors}`);
  
  return processedEmojis;
}

function generateEmojiKeywords(emojiName, variant) {
  const keywords = new Set();
  
  keywords.add(emojiName.toLowerCase());
  keywords.add(variant.display_name.toLowerCase());
  
  // Add individual words
  emojiName.split(' ').forEach(word => keywords.add(word.toLowerCase()));
  variant.display_name.split(' ').forEach(word => keywords.add(word.toLowerCase()));
  
  // Add any provided keywords
  if (variant.keywords && Array.isArray(variant.keywords)) {
    variant.keywords.forEach(keyword => keywords.add(keyword.toLowerCase()));
  }
  
  return Array.from(keywords);
}

/**
 * Find corresponding Excalidraw file for an icon
 */
function findExcalidrawFile(iconPath) {
  // Convert SVG path to Excalidraw path
  // Example: "assets/Access Time/SVG/ic_fluent_access_time_24_filled.svg" -> "Access Time/SVG/ic_fluent_access_time_filled.excalidraw"
  
  // Remove "assets/" prefix if present
  let excalidrawPath = iconPath.startsWith('assets/') ? iconPath.substring('assets/'.length) : iconPath;
  
  // Replace .svg with .excalidraw and remove size information (_24_, _48_, etc.)
  excalidrawPath = excalidrawPath.replace('.svg', '.excalidraw').replace(/_\d+_(?=filled|regular|light|color)/, '_');
  
  const fullPath = path.join(ARTIFACTS_DIR, 'excalidraw', excalidrawPath);
  
  return fs.existsSync(fullPath) ? fullPath : null;
}

/**
 * Find corresponding Excalidraw file for an emoji
 */
function findEmojiExcalidrawFile(emojiName) {
  // Convert emoji name to filename format used by excalidraw files
  // Example: "1st place medal" -> "1st_place_medal.excalidraw"
  // Example: "Black medium-small square" -> "Black_medium_small_square.excalidraw"
  // Note: preserve original case, replace spaces and hyphens with underscores
  const id = emojiName.replace(/\s+/g, '_').replace(/-/g, '_');
  const excalidrawPath = path.join(ARTIFACTS_DIR, 'excalidraw_emojis', `${id}.excalidraw`);
  
  return fs.existsSync(excalidrawPath) ? excalidrawPath : null;
}

async function copyExcalidrawFiles() {
  console.log('📁 Copying Excalidraw files...');
  
  const iconsSource = path.join(ARTIFACTS_DIR, 'excalidraw');
  const emojisSource = path.join(ARTIFACTS_DIR, 'excalidraw_emojis');
  const iconsTarget = path.join(EXCALIDRAW_DIR, 'icons');
  const emojisTarget = path.join(EXCALIDRAW_DIR, 'emojis');
  
  let copiedFiles = 0;
  
  // Copy icon Excalidraw files
  if (fs.existsSync(iconsSource)) {
    await fsExtra.copy(iconsSource, iconsTarget);
    copiedFiles += countFiles(iconsTarget);
    console.log(`📄 Copied icon Excalidraw files to ${iconsTarget}`);
  }
  
  // Copy emoji Excalidraw files
  if (fs.existsSync(emojisSource)) {
    await fsExtra.copy(emojisSource, emojisTarget);
    copiedFiles += countFiles(emojisTarget);
    console.log(`😀 Copied emoji Excalidraw files to ${emojisTarget}`);
  }
  
  console.log(`✅ Copied ${copiedFiles} Excalidraw files total`);
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  
  let count = 0;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      count += countFiles(fullPath);
    } else if (item.endsWith('.excalidraw')) {
      count++;
    }
  }
  
  return count;
}

async function generateStaticFiles(icons, emojis) {
  console.log('📝 Generating static JSON files...');
  
  // Generate category mapping
  const categories = generateCategoryMapping(icons, emojis);
  
  // Generate search index
  const searchIndex = {
    icons: icons.map(icon => ({
      id: icon.id,
      searchText: [icon.name, icon.displayName, ...icon.keywords].join(' '),
      category: icon.category,
      size: icon.size,
      style: icon.style
    })),
    emojis: emojis.map(emoji => ({
      id: emoji.id,
      searchText: [emoji.name, emoji.displayName, ...emoji.keywords].join(' '),
      category: emoji.category
    }))
  };
  
  // Write files
  const files = {
    'icons.json': {
      metadata: {
        totalCount: icons.length,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      },
      icons
    },
    'emojis.json': {
      metadata: {
        totalCount: emojis.length,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      },
      emojis
    },
    'categories.json': { categories },
    'search-index.json': searchIndex
  };
  
  for (const [filename, data] of Object.entries(files)) {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    const size = (fs.statSync(filePath).size / 1024).toFixed(2);
    console.log(`📄 Generated ${filename} (${size} KB)`);
  }
  
  console.log('✅ All static files generated successfully');
}

function generateCategoryMapping(icons, emojis) {
  const categoryMap = {};
  
  // Count icons by category
  icons.forEach(icon => {
    if (!categoryMap[icon.category]) {
      categoryMap[icon.category] = { iconCount: 0, emojiCount: 0, items: [] };
    }
    categoryMap[icon.category].iconCount++;
    categoryMap[icon.category].items.push(icon.id);
  });
  
  // Count emojis by category
  emojis.forEach(emoji => {
    if (!categoryMap[emoji.category]) {
      categoryMap[emoji.category] = { iconCount: 0, emojiCount: 0, items: [] };
    }
    categoryMap[emoji.category].emojiCount++;
    categoryMap[emoji.category].items.push(emoji.id);
  });
  
  // Convert to array format
  return Object.entries(categoryMap).map(([name, data]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    iconCount: data.iconCount,
    emojiCount: data.emojiCount,
    totalCount: data.iconCount + data.emojiCount
  })).sort((a, b) => b.totalCount - a.totalCount);
}

async function main() {
  try {
    console.log('🌟 Starting data preparation process...\n');
    
    // Load categories configuration
    const categoriesJsonPath = path.join(CONFIG_DIR, 'icon_categories.json');
    if (!fs.existsSync(categoriesJsonPath)) {
      throw new Error(`Categories config not found at ${categoriesJsonPath}`);
    }
    const categories = JSON.parse(fs.readFileSync(categoriesJsonPath, 'utf8'));
    
    // Process metadata
    const icons = await processIcons(categories);
    const emojis = await processEmojis(categories);
    
    // Copy Excalidraw files
    await copyExcalidrawFiles();
    
    // Generate static JSON files
    await generateStaticFiles(icons, emojis);
    
    console.log('\n🎉 Data preparation completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Icons: ${icons.length}`);
    console.log(`   - Emojis: ${emojis.length}`);
    console.log(`   - Total assets: ${icons.length + emojis.length}`);
    
  } catch (error) {
    console.error('\n❌ Data preparation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };