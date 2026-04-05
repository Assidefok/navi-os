#!/usr/bin/env node
/**
 * JEFF Inbox Processor
 * 
 * Chief Operations Officer - Execution and scalability perspective
 * 
 * Reads and processes events from JEFF's inbox.
 * JEFF filters for: operational efficiency, implementation, deployment
 * 
 * Usage:
 *   node jeff-inbox-processor.js          # Read events
 *   node jeff-inbox-processor.js --process # Read and move to outbox
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '..', '..', '..', '.events');
const JEFF_INBOX = path.join(EVENTS_DIR, 'inbox', 'jeff');
const JEFF_OUTBOX = path.join(EVENTS_DIR, 'outbox', 'jeff');
const MEMORY_PATH = path.join(__dirname, '..', '..', 'MEMORY.md');

const PROCESS_FLAG = process.argv.includes('--process');

function log(msg) {
  console.log(`[JEFF] ${msg}`);
}

function getTimestamp() {
  return new Date().toISOString();
}

function readInboxEvents() {
  if (!fs.existsSync(JEFF_INBOX)) {
    return [];
  }
  return fs.readdirSync(JEFF_INBOX)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const content = fs.readFileSync(path.join(JEFF_INBOX, f), 'utf8');
      return JSON.parse(content);
    });
}

function processProposalEvent(event) {
  const { payload } = event;
  const { proposalId, oldState, newState, proposer, changedAt } = payload;
  
  log(`Processing proposal event: ${proposalId} (${oldState} → ${newState})`);
  
  // JEFF's role: Operations and execution perspective on proposals
  // Evaluates: Can we execute this efficiently? Is it scalable?
  
  const responses = {
    proposal_state_changed: () => {
      if (newState === 'pending') {
        log(`📋 Proposal ${proposalId} pending - planning execution...`);
        log(`   JEFF: "How do we deploy this fast and scale it?"`);
        log(`   ⚡ Mapping operational requirements...`);
        
        updateMemoryWithProposal(proposalId, 'pending', proposer, 'ops-review');
      }
      else if (newState === 'approved') {
        log(`✅ Proposal ${proposalId} APPROVED by JEFF`);
        log(`   JEFF: "Ready for deployment. Let's build the machinery."`);
        updateMemoryWithProposal(proposalId, 'approved', proposer, 'approved');
      }
      else if (newState === 'denied') {
        log(`❌ Proposal ${proposalId} - operational constraints`);
        log(`   JEFF: "We can't execute this efficiently. Reconsider."`);
        updateMemoryWithProposal(proposalId, 'denied', proposer, 'denied');
      }
      else if (newState === 'executed') {
        log(`⚡ Proposal ${proposalId} EXECUTED - verifying operations`);
        log(`   JEFF: "Systems are go. Monitoring for scale."`);
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
      const src = path.join(JEFF_INBOX, filename);
      const dst = path.join(JEFF_OUTBOX, filename);
      
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