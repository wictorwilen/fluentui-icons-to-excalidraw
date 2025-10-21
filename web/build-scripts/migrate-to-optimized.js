#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Migration script to replace legacy icons.json with optimized format
 * This ensures the web application uses the smaller, faster format
 */

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const LEGACY_FILE = path.join(DATA_DIR, 'icons.json');
const OPTIMIZED_FILE = path.join(DATA_DIR, 'icons-optimized.json');
const BACKUP_FILE = path.join(DATA_DIR, 'icons-legacy-backup.json');

console.log('🔄 Migrating to optimized data format...');

try {
  // Check if optimized file exists
  if (!fs.existsSync(OPTIMIZED_FILE)) {
    console.error('❌ Optimized file not found. Run "npm run optimize-data" first.');
    process.exit(1);
  }

  // Backup legacy file
  if (fs.existsSync(LEGACY_FILE)) {
    fs.copyFileSync(LEGACY_FILE, BACKUP_FILE);
    console.log('📋 Created backup of legacy file');
  }

  // Replace legacy with optimized
  fs.copyFileSync(OPTIMIZED_FILE, LEGACY_FILE);
  console.log('✅ Replaced icons.json with optimized version');

  // Clean up optimized file (no longer needed)
  fs.unlinkSync(OPTIMIZED_FILE);
  console.log('🗑️ Cleaned up temporary optimized file');

  // Show size comparison
  const currentSize = fs.statSync(LEGACY_FILE).size;
  const backupSize = fs.statSync(BACKUP_FILE).size;
  const savings = ((backupSize - currentSize) / backupSize * 100).toFixed(1);

  console.log('📊 Migration complete!');
  console.log(`   New size: ${(currentSize / 1024 / 1024).toFixed(2)}MB`); 
  console.log(`   Old size: ${(backupSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Savings: ${savings}% (${((backupSize - currentSize) / 1024 / 1024).toFixed(2)}MB)`);
  console.log('');
  console.log('🚀 Web application will now use the optimized format!');
  console.log('📝 To rollback: cp icons-legacy-backup.json icons.json');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}