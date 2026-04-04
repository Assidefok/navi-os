#!/usr/bin/env node
/**
 * Event Bus - Simple file-based event system for Chiefs
 * 
 * Events are JSON files in inbox/{chief}/ directories.
 * Format: {id, type, payload, timestamp, source}
 * 
 * Usage:
 *   node event-bus.js emit <chief> <event-type> <payload-json>
 *   node event-bus.js read <chief>      # Read and process inbox
 *   node event-bus.js list              # List all pending events
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EVENTS_DIR = path.join(__dirname, '..', '.events');
const CHIEFS = ['elom', 'warren', 'jeff', 'sam'];

function ensureDirs() {
  CHIEFS.forEach(chief => {
    fs.mkdirSync(path.join(EVENTS_DIR, 'inbox', chief), { recursive: true });
    fs.mkdirSync(path.join(EVENTS_DIR, 'outbox', chief), { recursive: true });
  });
}

function generateEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function emit(chief, eventType, payload) {
  if (!CHIEFS.includes(chief)) {
    console.error(`Unknown chief: ${chief}. Valid: ${CHIEFS.join(', ')}`);
    process.exit(1);
  }
  
  const event = {
    id: generateEventId(),
    type: eventType,
    payload: payload,
    timestamp: new Date().toISOString(),
    source: 'navi'
  };
  
  const filename = `${event.id}.json`;
  const filepath = path.join(EVENTS_DIR, 'inbox', chief, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(event, null, 2));
  console.log(`✓ Event ${event.id} (${eventType}) → ${chief}/inbox`);
}

function readInbox(chief) {
  const inboxDir = path.join(EVENTS_DIR, 'inbox', chief);
  
  if (!fs.existsSync(inboxDir)) {
    console.log(`No inbox for ${chief}`);
    return [];
  }
  
  const files = fs.readdirSync(inboxDir).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log(`No pending events for ${chief}`);
    return [];
  }
  
  console.log(`\n📬 ${chief.toUpperCase()} inbox (${files.length} events):\n`);
  
  const events = [];
  files.forEach(file => {
    const content = fs.readFileSync(path.join(inboxDir, file), 'utf8');
    const event = JSON.parse(content);
    events.push(event);
    console.log(`  [${event.id}] ${event.type}`);
    console.log(`    payload: ${JSON.stringify(event.payload)}`);
    console.log(`    time: ${event.timestamp}\n`);
  });
  
  return events;
}

function processInbox(chief) {
  const inboxDir = path.join(EVENTS_DIR, 'inbox', chief);
  
  if (!fs.existsSync(inboxDir)) return [];
  
  const files = fs.readdirSync(inboxDir).filter(f => f.endsWith('.json'));
  
  files.forEach(file => {
    const filepath = path.join(inboxDir, file);
    const content = fs.readFileSync(filepath, 'utf8');
    const event = JSON.parse(content);
    
    // Move to outbox after processing
    const outboxPath = path.join(EVENTS_DIR, 'outbox', chief, file);
    fs.renameSync(filepath, outboxPath);
    
    console.log(`✓ Processed: ${event.type} → ${chief}`);
  });
}

function listAll() {
  console.log('\n📋 Event Bus Status\n');
  
  CHIEFS.forEach(chief => {
    const inboxDir = path.join(EVENTS_DIR, 'inbox', chief);
    const outboxDir = path.join(EVENTS_DIR, 'outbox', chief);
    
    const inboxCount = fs.existsSync(inboxDir) 
      ? fs.readdirSync(inboxDir).filter(f => f.endsWith('.json')).length 
      : 0;
    const outboxCount = fs.existsSync(outboxDir) 
      ? fs.readdirSync(outboxDir).filter(f => f.endsWith('.json')).length 
      : 0;
    
    console.log(`  ${chief.padEnd(8)} inbox: ${inboxCount.toString().padStart(2)} | outbox: ${outboxCount}`);
  });
  
  console.log('');
}

function purgeOutbox(chief) {
  const outboxDir = path.join(EVENTS_DIR, 'outbox', chief);
  if (!fs.existsSync(outboxDir)) return;
  
  const files = fs.readdirSync(outboxDir).filter(f => f.endsWith('.json'));
  files.forEach(file => fs.unlinkSync(path.join(outboxDir, file)));
  console.log(`Purged ${files.length} events from ${chief} outbox`);
}

// CLI
const [,, cmd, arg1, arg2, arg3] = process.argv;

ensureDirs();

switch (cmd) {
  case 'emit':
    const payload = arg3 ? JSON.parse(arg3) : {};
    emit(arg1, arg2, payload);
    break;
  case 'read':
    readInbox(arg1);
    break;
  case 'process':
    processInbox(arg1);
    break;
  case 'list':
    listAll();
    break;
  case 'purge':
    purgeOutbox(arg1);
    break;
  default:
    console.log(`
Event Bus CLI
============
Usage:
  node event-bus.js emit <chief> <event-type> <payload-json>
  node event-bus.js read <chief>
  node event-bus.js process <chief>
  node event-bus.js list
  node event-bus.js purge <chief>

 Chiefs: ${CHIEFS.join(', ')}
`);
}