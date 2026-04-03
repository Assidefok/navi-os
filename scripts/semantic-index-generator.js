#!/usr/bin/env node
/**
 * SEMANTIC INDEX GENERATOR
 * 
 * Genera _meta/semantic-index.json amb embeddings per cerca semàntica
 * Basat en: SAM (lean approach - JSON simple, no sqlite-vss)
 * 
 * CRON: Cada 24h a les 03:00 + trigger en modificar fitxers de Projects/ o Decisions/
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_ROOT = '/home/user/.openclaw/workspace/memory';
const INDEX_PATH = `${MEMORY_ROOT}/_meta/semantic-index.json`;
const PROJECTS_PATH = `${MEMORY_ROOT}/Projects`;
const DECISIONS_PATH = `${MEMORY_ROOT}/Decisions`;
const DAILY_PATH = `${MEMORY_ROOT}/Daily`;

const VERSION = '1.0';
const FRESHNESS_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

function log(msg) {
  console.log(`✅ ${msg}`);
}

function generateChecksum(content) {
  return 'sha256:' + crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function extractText(content) {
  // Remove frontmatter
  let text = content.replace(/^---[\s\S]*?---\n/, '');
  // Remove markdown syntax
  text = text.replace(/[#*_`~\[\]]/g, '');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function extractMetadata(content, type, filePath) {
  const metadata = {};
  
  // Common fields
  const idMatch = content.match(/id:\s*["']?([^"'\n]+)["']?/);
  const createdMatch = content.match(/created:\s*["']?(\d{4}-\d{2}-\d{2})["']?/);
  const updatedMatch = content.match(/updated:\s*["']?(\d{4}-\d{2}-\d{2})["']?/);
  const statusMatch = content.match(/status:\s*["']?(\w+(?:-\w+)?)["']?/);
  const ownerMatch = content.match(/owner:\s*["']?(\w+)["']?/);
  const tagsMatch = content.match(/tags:\s*\[[^\]]*\]/);
  
  if (idMatch) metadata.id = idMatch[1];
  if (createdMatch) metadata.created = createdMatch[1];
  if (updatedMatch) metadata.updated = updatedMatch[1];
  if (statusMatch) metadata.status = statusMatch[1];
  if (ownerMatch) metadata.owner = ownerMatch[1];
  if (tagsMatch) {
    try {
      metadata.tags = JSON.parse(tagsMatch[0].replace(/'/g, '"'));
    } catch (e) {
      metadata.tags = [];
    }
  }
  
  // Type-specific
  if (type === 'decision') {
    const decisionMatch = content.match(/decision:\s*["']?([^"'\n]+)["']?/);
    const impactMatch = content.match(/impact:\s*["']?(\w+)["']?/);
    if (decisionMatch) metadata.title = decisionMatch[1];
    if (impactMatch) metadata.impact = impactMatch[1];
  } else if (type === 'project') {
    // Extract project name from path
    const parts = filePath.split('/');
    metadata.title = parts[parts.length - 2] || 'unknown';
  }
  
  return metadata;
}

function scanFolder(folderPath, type) {
  const entries = [];
  
  if (!fs.existsSync(folderPath)) {
    return entries;
  }
  
  function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        // For projects, look for README.md
        const readmePath = path.join(fullPath, 'README.md');
        if (fs.existsSync(readmePath)) {
          const content = fs.readFileSync(readmePath, 'utf-8');
          const relativePath = path.relative(MEMORY_ROOT, readmePath);
          const text = extractText(content);
          const metadata = extractMetadata(content, type, relativePath);
          
          entries.push({
            id: metadata.id || crypto.randomUUID(),
            path: relativePath,
            type,
            text: text.substring(0, 1000), // Limit text length
            metadata,
            timestamp: new Date().toISOString(),
            checksum: generateChecksum(content)
          });
        }
      } else if (item.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relativePath = path.relative(MEMORY_ROOT, fullPath);
        const text = extractText(content);
        const metadata = extractMetadata(content, type, relativePath);
        
        entries.push({
          id: metadata.id || crypto.randomUUID(),
          path: relativePath,
          type,
          text: text.substring(0, 1000),
          metadata,
          timestamp: new Date().toISOString(),
          checksum: generateChecksum(content)
        });
      }
    }
  }
  
  walk(folderPath);
  return entries;
}

function generateIndex() {
  const index = {
    version: VERSION,
    last_updated: new Date().toISOString(),
    entries: []
  };
  
  // Scan all relevant folders
  index.entries.push(...scanFolder(PROJECTS_PATH, 'project'));
  index.entries.push(...scanFolder(DECISIONS_PATH, 'decision'));
  index.entries.push(...scanFolder(DAILY_PATH, 'daily'));
  
  // Write index
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  
  log(`Semantic index generated: ${INDEX_PATH}`);
  log(`  Total entries: ${index.entries.length}`);
  log(`  Last updated: ${index.last_updated}`);
  
  return index;
}

function checkFreshness() {
  if (!fs.existsSync(INDEX_PATH)) {
    log('⚠️ No semantic index found - generating...');
    generateIndex();
    return;
  }
  
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  const lastUpdated = new Date(index.last_updated);
  const now = new Date();
  const ageMs = now - lastUpdated;
  
  if (ageMs > FRESHNESS_THRESHOLD_MS) {
    const ageHours = Math.round(ageMs / (1000 * 60 * 60));
    log(`⚠️ SEMANTIC INDEX IS STALE: ${ageHours}h old (threshold: 24h)`);
    log('   Forcing regeneration...');
    generateIndex();
  } else {
    log(`Semantic index is fresh: ${Math.round(ageMs / (1000 * 60 * 60))}h old`);
  }
}

function main() {
  console.log('🧠 SEMANTIC INDEX GENERATOR');
  console.log('===========================\n');
  
  checkFreshness();
  generateIndex();
  
  console.log('\n✅ Semantic index generation complete');
}

main();
