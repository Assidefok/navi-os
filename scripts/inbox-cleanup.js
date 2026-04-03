#!/usr/bin/env node
/**
 * INBOX CLEANUP - Memory Constitution Rule 6
 * 
 * Processa _inbox/ segons les regles de vida màxima (7 dies)
 * - Dia 0-3: Captura lliure
 * - Dia 4-6: Revisió obligatòria
 * - Dia 7+: Auto-processament
 * 
 * CRON: Dilluns 00:00
 */

const fs = require('fs');
const path = require('path');

const MEMORY_ROOT = '/home/user/.openclaw/workspace/memory';
const INBOX_PATH = `${MEMORY_ROOT}/_inbox`;
const ARCHIVE_PATH = `${MEMORY_ROOT}/_archive`;
const PROCESS_LOG = `${MEMORY_ROOT}/_meta/process-log.md`;
const DAYS_LIMIT = 7;

function log(msg, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'ERROR' ? '❌' : type === 'WARN' ? '⚠️' : type === 'INFO' ? '✅' : '📝';
  console.log(`${prefix} [${timestamp}] ${msg}`);
  return `[${timestamp}] [${type}] ${msg}`;
}

function getDaysOld(createdDate) {
  const created = new Date(createdDate);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function ensureArchiveFolder() {
  if (!fs.existsSync(ARCHIVE_PATH)) {
    fs.mkdirSync(ARCHIVE_PATH, { recursive: true });
    log(`Created archive folder: ${ARCHIVE_PATH}`);
  }
}

function appendToProcessLog(entry) {
  const logEntry = `\n- **${entry.action}**: ${entry.file} - ${entry.reason}`;
  fs.appendFileSync(PROCESS_LOG, logEntry);
}

function processExpiredEntries() {
  const files = fs.readdirSync(INBOX_PATH).filter(f => f.endsWith('.md'));
  
  log(`Inbox cleanup - ${files.length} fitxers a revisar`);
  
  const actions = {
    deleted: [],
    archived: [],
    movedToProject: [],
    addedToDaily: []
  };
  
  for (const file of files) {
    const filePath = path.join(INBOX_PATH, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extreure frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      log(`No frontmatter found in ${file}, skipping`, 'WARN');
      continue;
    }
    
    let frontmatter;
    try {
      frontmatter = JSON.parse(match[1].replace(/yaml/g, 'json').replace(/'/g, '"'));
    } catch (e) {
      // Try YAML parse
      log(`Cannot parse frontmatter in ${file}`, 'WARN');
      continue;
    }
    
    const created = frontmatter.created || '1970-01-01';
    const type = frontmatter.type || 'thought';
    const daysOld = getDaysOld(created);
    
    log(`  ${file}: ${daysOld} dies (type: ${type})`);
    
    if (daysOld > DAYS_LIMIT) {
      // Day 7+: Auto-process
      switch (type) {
        case 'task':
          // Move to _archive with task tag
          const archiveFile = path.join(ARCHIVE_PATH, `task-${file}`);
          fs.renameSync(filePath, archiveFile);
          actions.archived.push(file);
          appendToProcessLog({ action: 'ARCHIVED_TASK', file, reason: `Expired after ${daysOld} days` });
          log(`  → Archived (was task): ${file}`);
          break;
        case 'reference':
          fs.renameSync(filePath, path.join(ARCHIVE_PATH, `ref-${file}`));
          actions.archived.push(file);
          appendToProcessLog({ action: 'ARCHIVED_REFERENCE', file, reason: `Expired reference` });
          log(`  → Archived (was reference): ${file}`);
          break;
        case 'thought':
          // Add to today's daily
          const today = new Date().toISOString().split('T')[0];
          const dailyPath = `${MEMORY_ROOT}/Daily/${today}/notes.md`;
          if (fs.existsSync(dailyPath)) {
            const dailyContent = fs.readFileSync(dailyPath, 'utf-8');
            const thoughtEntry = `\n\n## 💭 Thought (expired inbox)\n${content.replace(/^---[\s\S]*?---\n/, '')}`;
            fs.writeFileSync(dailyPath, dailyContent + thoughtEntry);
            fs.unlinkSync(filePath);
            actions.addedToDaily.push(file);
            appendToProcessLog({ action: 'MOVED_TO_DAILY', file, reason: `Expired thought added to daily` });
            log(`  → Added to daily: ${file}`);
          } else {
            fs.renameSync(filePath, path.join(ARCHIVE_PATH, `thought-${file}`));
            actions.archived.push(file);
            appendToProcessLog({ action: 'ARCHIVED_ORPHAN_THOUGHT', file, reason: `No daily found` });
            log(`  → Archived (no daily found): ${file}`);
          }
          break;
        default:
          fs.renameSync(filePath, path.join(ARCHIVE_PATH, file));
          actions.archived.push(file);
          appendToProcessLog({ action: 'ARCHIVED_DEFAULT', file, reason: `Unknown type: ${type}` });
      }
    } else if (daysOld >= 4) {
      // Days 4-6: Warning
      log(`  → ⚠️ Expira en ${DAYS_LIMIT - daysOld} dies - cal revisar`, 'WARN');
    }
  }
  
  // Summary
  console.log('\n📊 INBOX CLEANUP SUMMARY');
  console.log('========================');
  console.log(`Archived: ${actions.archived.length}`);
  console.log(`Added to Daily: ${actions.addedToDaily.length}`);
  console.log(`Remaining in inbox: ${fs.readdirSync(INBOX_PATH).filter(f => f.endsWith('.md')).length}`);
  
  // Check inbox size
  const remaining = fs.readdirSync(INBOX_PATH).filter(f => f.endsWith('.md')).length;
  if (remaining > 20) {
    log(`⚠️ INBOX SOBRAREGAT: ${remaining} fitxers (màxim recomanat: 20)`, 'WARN');
  }
}

function main() {
  console.log('🧹 INBOX CLEANUP SCRIPT');
  console.log('=======================\n');
  
  ensureArchiveFolder();
  processExpiredEntries();
  
  console.log('\n✅ Inbox cleanup completat');
}

main();
