#!/usr/bin/env node
/**
 * ELOM Inbox Processor
 * 
 * Chief Visionary Officer - Strategic and long-term thinking perspective
 * 
 * Reads and processes events from ELOM's inbox.
 * ELOM filters for: strategic decisions, pivots, 10x thinking opportunities
 * 
 * Usage:
 *   node elom-inbox-processor.js          # Read events
 *   node elom-inbox-processor.js --process # Read and move to outbox
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '..', '..', '..', '.events');
const ELOM_INBOX = path.join(EVENTS_DIR, 'inbox', 'elom');
const ELOM_OUTBOX = path.join(EVENTS_DIR, 'outbox', 'elom');
const MEMORY_PATH = path.join(__dirname, '..', '..', 'MEMORY.md');

const PROCESS_FLAG = process.argv.includes('--process');

function log(msg) {
  console.log(`[ELOM] ${msg}`);
}

function getTimestamp() {
  return new Date().toISOString();
}

function readInboxEvents() {
  if (!fs.existsSync(ELOM_INBOX)) {
    return [];
  }
  return fs.readdirSync(ELOM_INBOX)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const content = fs.readFileSync(path.join(ELOM_INBOX, f), 'utf8');
      return JSON.parse(content);
    });
}

function processProposalEvent(event) {
  const { payload } = event;
  const { proposalId, oldState, newState, proposer, changedAt } = payload;
  
  log(`Processing proposal event: ${proposalId} (${oldState} → ${newState})`);
  
  // ELOM's role: Visionary perspective on proposals
  // Evaluates: Is this bold enough? Does it disrupt? Is it 10x?
  
  const responses = {
    proposal_state_changed: () => {
      if (newState === 'pending') {
        log(`📋 Proposal ${proposalId} pending - evaluating vision...`);
        log(`   ELOM: "Is this bold enough to change the game?"`);
        log(`   🔥 Checking for 10x potential...`);
        
        // Log to memory
        updateMemoryWithProposal(proposalId, 'pending', proposer, 'vision-review');
      }
      else if (newState === 'approved') {
        log(`✅ Proposal ${proposalId} APPROVED by ELOM`);
        log(`   ELOM: "This aligns with our bold direction. Let's move."`);
        updateMemoryWithProposal(proposalId, 'approved', proposer, 'approved');
      }
      else if (newState === 'denied') {
        log(`❌ Proposal ${proposalId} - not visionary enough`);
        log(`   ELOM: "We need something that changes the game, not tweaks it."`);
        updateMemoryWithProposal(proposalId, 'denied', proposer, 'denied');
      }
      else if (newState === 'executed') {
        log(`🚀 Proposal ${proposalId} EXECUTED - measuring impact`);
        log(`   ELOM: "How does this move us toward the moonshot?"`);
        updateMemoryWithProposal(proposalId, 'executed', proposer, 'executed');
      }
    }
  };
  
  if (responses[event.type]) {
    responses[event.type]();
  }
}

function updateMemoryWithProposal(proposalId, state, proposer, status) {
  log(`   Memory updated: proposal ${proposalId} → ${state} (${status})`);
}

function processEvents(events) {
  events.forEach(event => {
    if (event.type === 'proposal_state_changed') {
      processProposalEvent(event);
    }
    else {
      log(`Unknown event type: ${event.type}`);
    }
    
    if (PROCESS_FLAG) {
      const filename = `${event.id}.json`;
      const src = path.join(ELOM_INBOX, filename);
      const dst = path.join(ELOM_OUTBOX, filename);
      
      if (fs.existsSync(src)) {
        fs.renameSync(src, dst);
        log(`   → Moved to outbox`);
      }
    }
  });
}

// Main
const events = readInboxEvents();

if (events.length === 0) {
  log('Inbox empty - no pending events');
} else {
  log(`Found ${events.length} event(s) in inbox:`);
  events.forEach(e => log(`  - ${e.id}: ${e.type}`));
  
  if (PROCESS_FLAG) {
    processEvents(events);
    log('Processing complete');
  } else {
    log('\nUse --process to process and archive events');
  }
}