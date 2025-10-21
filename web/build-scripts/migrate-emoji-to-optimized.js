#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Migration script to replace legacy emojis.json with optimized format
 * This ensures the web application uses the smaller, faster emoji format
 */

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const LEGACY_FILE = path.join(DATA_DIR, 'emojis.json');
const OPTIMIZED_FILE = path.join(DATA_DIR, 'emojis-optimized.json');
const BACKUP_FILE = path.join(DATA_DIR, 'emojis-legacy-backup.json');

console.log('🔄 Migrating emojis to optimized data format...');

try {
  // Check if optimized file exists
  if (!fs.existsSync(OPTIMIZED_FILE)) {
    console.error('❌ Optimized emoji file not found. Run "npm run optimize-emoji-data" first.');
    process.exit(1);
  }

  // Backup legacy file
  if (fs.existsSync(LEGACY_FILE)) {
    fs.copyFileSync(LEGACY_FILE, BACKUP_FILE);
    console.log('📋 Created backup of legacy emoji file');
  }

  // Replace legacy with optimized
  fs.copyFileSync(OPTIMIZED_FILE, LEGACY_FILE);
  console.log('✅ Replaced emojis.json with optimized version');

  // Clean up optimized file (no longer needed)
  fs.unlinkSync(OPTIMIZED_FILE);
  console.log('🗑️ Cleaned up temporary optimized emoji file');

  // Show size comparison
  const currentSize = fs.statSync(LEGACY_FILE).size;
  const backupSize = fs.statSync(BACKUP_FILE).size;
  const savings = ((backupSize - currentSize) / backupSize * 100).toFixed(1);

  console.log('📊 Emoji migration complete!');
  console.log(`   New size: ${(currentSize / 1024 / 1024).toFixed(2)}MB`); 
  console.log(`   Old size: ${(backupSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Savings: ${savings}% (${((backupSize - currentSize) / 1024 / 1024).toFixed(2)}MB)`);
  console.log('');
  console.log('🚀 Web application will now use the optimized emoji format!');
  console.log('📝 To rollback: cp emojis-legacy-backup.json emojis.json');

} catch (error) {
  console.error('❌ Emoji migration failed:', error.message);
  process.exit(1);
}