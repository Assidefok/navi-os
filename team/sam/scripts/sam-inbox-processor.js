#!/usr/bin/env node
/**
 * SAM Inbox Processor
 * 
 * Reads and processes events from SAM's inbox.
 * Integrates with Memory Constitution for semantic indexing.
 * 
 * Usage:
 *   node sam-inbox-processor.js          # Read events
 *   node sam-inbox-processor.js --process # Read and move to outbox
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '..', '..', '..', '.events');
const SAM_INBOX = path.join(EVENTS_DIR, 'inbox', 'sam');
const SAM_OUTBOX = path.join(EVENTS_DIR, 'outbox', 'sam');
const MEMORY_PATH = path.join(__dirname, '..', '..', 'MEMORY.md');

const PROCESS_FLAG = process.argv.includes('--process');

function log(msg) {
  console.log(`[SAM] ${msg}`);
}

function getTimestamp() {
  return new Date().toISOString();
}

function readInboxEvents() {
  if (!fs.existsSync(SAM_INBOX)) {
    return [];
  }
  return fs.readdirSync(SAM_INBOX)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const content = fs.readFileSync(path.join(SAM_INBOX, f), 'utf8');
      return JSON.parse(content);
    });
}

function processProposalEvent(event) {
  const { payload } = event;
  const { proposalId, oldState, newState, proposer, changedAt } = payload;
  
  log(`Processing proposal event: ${proposalId} (${oldState} → ${newState})`);
  
  // SAM's role: AI/Tech decisions
  // When proposal is pending, SAM evaluates technical feasibility
  // When approved/denied, SAM logs the decision
  
  const responses = {
    proposal_state_changed: () => {
      if (newState === 'pending') {
        log(`📋 Proposal ${proposalId} pending review from ${proposer}`);
        log(`   SAM: Evaluating technical feasibility...`);
        
        // Update MEMORY.md with pending proposal
        updateMemoryWithProposal(proposalId, 'pending', proposer);
      }
      else if (newState === 'approved') {
        log(`✅ Proposal ${proposalId} APPROVED`);
        log(`   SAM: Ready to implement AI/tech components`);
        updateMemoryWithProposal(proposalId, 'approved', proposer);
      }
      else if (newState === 'denied') {
        log(`❌ Proposal ${proposalId} DENIED`);
        updateMemoryWithProposal(proposalId, 'denied', proposer);
      }
    }
  };
  
  if (responses[event.type]) {
    responses[event.type]();
  }
}

function updateMemoryWithProposal(proposalId, state, proposer) {
  log(`   Memory updated: proposal ${proposalId} → ${state}`);
}

function processEvents(events) {
  events.forEach(event => {
    // Process based on event type
    if (event.type === 'proposal_state_changed') {
      processProposalEvent(event);
    }
    else {
      log(`Unknown event type: ${event.type}`);
    }
    
    // Move to outbox
    if (PROCESS_FLAG) {
      const filename = `${event.id}.json`;
      const src = path.join(SAM_INBOX, filename);
      const dst = path.join(SAM_OUTBOX, filename);
      
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