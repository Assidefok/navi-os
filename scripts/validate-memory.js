#!/usr/bin/env node
/**
 * MEMORY VALIDATOR - Memory Constitution Enforcement
 * 
 * Aquest script valida TOTS els fitxers markdown del vault
 * per garantir compliment amb la Memory Constitution.
 * 
 * Ús: node validate-memory.js [--fix]
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const MEMORY_ROOT = '/home/user/.openclaw/workspace/memory';
const CONSTITUTION_PATH = `${MEMORY_ROOT}/_constitution/MEMORY-CONSTITUTION.md`;

// Categories vàlides (inclou legacy per compatibilitat)
const VALID_FOLDERS = [
  '_constitution', '_meta', '_templates', 'Projects', 'Decisions',
  'Processes', 'Daily', '_inbox', '_archive',
  'AI-News', 'Iran-War', 'World-News', 'Stock-Market', 'Trump-Stocks', 'Logs', 'Inbox',
  // Legacy folders (existent abans de la constitució)
  'Logs', 'Inbox', 'daily-legacy'
];

// Frontmatter obligatori per tipus
const REQUIRED_FRONTMATTER = {
  'Projects': ['id', 'created', 'updated', 'status', 'owner'],
  'Decisions': ['id', 'date', 'decision', 'impact', 'status'],
  'Daily': ['date', 'tags', 'summary'],
  '_inbox': ['created', 'expires', 'source', 'type']
};

// Status vàlids
const VALID_STATUS = {
  project: ['in-progress', 'blocked', 'on-hold', 'done'],
  decision: ['active', 'superseded', 'reverted'],
  inbox: ['thought', 'task', 'reference', 'question']
};

let errors = [];
let warnings = [];
let fixed = 0;

function log(msg, type = 'INFO') {
  const prefix = type === 'ERROR' ? '❌' : type === 'WARN' ? '⚠️' : '✅';
  console.log(`${prefix} [${type}] ${msg}`);
}

function validateFrontmatter(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const folder = relativePath.split('/')[0];
  
  // Extraure frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    errors.push(`Missing frontmatter: ${relativePath}`);
    return false;
  }
  
  try {
    const frontmatter = yaml.parse(match[1]);
    const required = REQUIRED_FRONTMATTER[folder] || [];
    
    for (const field of required) {
      if (!frontmatter[field] || frontmatter[field] === null || frontmatter[field] === '') {
        errors.push(`Missing field '${field}' in: ${relativePath}`);
      }
    }
    
    // Validar UUID
    if (frontmatter.id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(frontmatter.id)) {
        errors.push(`Invalid UUID '${frontmatter.id}' in: ${relativePath}`);
      }
    }
    
    // Validar status
    if (frontmatter.status && !VALID_STATUS.project.includes(frontmatter.status)) {
      errors.push(`Invalid status '${frontmatter.status}' in: ${relativePath}`);
    }
    
    return errors.length === 0;
  } catch (e) {
    errors.push(`YAML parse error in ${relativePath}: ${e.message}`);
    return false;
  }
}

function validateFilePath(filePath, relativePath) {
  // Legacy files (root level with date patterns) are valid
  if (!relativePath.includes('/')) {
    // Root level files - allow date-based files and index
    const basename = relativePath;
    if (basename.match(/^\d{4}-\d{2}-\d{2}/) || 
        basename.startsWith('approval-') || 
        basename.startsWith('deployed-') ||
        basename.startsWith('daily-') ||
        basename === 'index.md') {
      return true;
    }
  }
  
  const folder = relativePath.split('/')[0];
  if (!VALID_FOLDERS.includes(folder)) {
    errors.push(`File in invalid folder '${folder}': ${relativePath}`);
    return false;
  }
  return true;
}

function validateNomenclature(filePath, relativePath) {
  const basename = path.basename(filePath);
  
  // Check for spaces
  if (basename.includes(' ')) {
    errors.push(`Filename contains spaces: ${relativePath}`);
  }
  
  // Check for special characters
  const specialChars = /[?*:"<>|]/;
  if (specialChars.test(basename)) {
    errors.push(`Filename contains special characters: ${relativePath}`);
  }
  
  return true;
}

function validateAll() {
  console.log('🔍 Memory Constitution Validator');
  console.log('================================\n');
  
  const files = [];
  
  function walk(dir, baseDir = dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(MEMORY_ROOT, fullPath);
      
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath, baseDir);
      } else if (item.endsWith('.md')) {
        files.push({ fullPath, relativePath });
      }
    }
  }
  
  walk(MEMORY_ROOT);
  
  console.log(`📄 Total fitxers a validar: ${files.length}\n`);
  
  for (const { fullPath, relativePath } of files) {
    // Skip constitution itself
    if (relativePath.startsWith('_constitution/')) continue;
    
    validateFilePath(fullPath, relativePath);
    validateNomenclature(fullPath, relativePath);
    
    const folder = relativePath.split('/')[0];
    if (REQUIRED_FRONTMATTER[folder]) {
      validateFrontmatter(fullPath, relativePath);
    }
  }
  
  // Report
  console.log('\n📊 RESULTAT:');
  console.log('============');
  
  if (errors.length === 0) {
    log('Tots els fitxers són vàlids!', 'INFO');
    process.exit(0);
  } else {
    log(`Errors trobats: ${errors.length}`, 'ERROR');
    errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  }
}

// Auto-fix mode
function autoFix() {
  console.log('🔧 AUTO-FIX MODE');
  console.log('================\n');
  // Per implementar: auto-fix frontmatter, move misplaced files, etc.
  console.log('⚠️ Auto-fix no implementat encara. Executa manualment.');
}

const args = process.argv.slice(2);
if (args.includes('--fix')) {
  autoFix();
} else {
  validateAll();
}
