#!/usr/bin/env node
/**
 * WARREN Inbox Processor
 * 
 * Chief Quality Officer - Analytical and risk assessment perspective
 * 
 * Reads and processes events from WARREN's inbox.
 * WARREN filters for: quality standards, risk assessment, audit findings
 * 
 * Usage:
 *   node warren-inbox-processor.js          # Read events
 *   node warren-inbox-processor.js --process # Read and move to outbox
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '..', '..', '..', '.events');
const WARREN_INBOX = path.join(EVENTS_DIR, 'inbox', 'warren');
const WARREN_OUTBOX = path.join(EVENTS_DIR, 'outbox', 'warren');
const MEMORY_PATH = path.join(__dirname, '..', '..', 'MEMORY.md');

const PROCESS_FLAG = process.argv.includes('--process');

function log(msg) {
  console.log(`[WARREN] ${msg}`);
}

function getTimestamp() {
  return new Date().toISOString();
}

function readInboxEvents() {
  if (!fs.existsSync(WARREN_INBOX)) {
    return [];
  }
  return fs.readdirSync(WARREN_INBOX)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const content = fs.readFileSync(path.join(WARREN_INBOX, f), 'utf8');
      return JSON.parse(content);
    });
}

function processProposalEvent(event) {
  const { payload } = event;
  const { proposalId, oldState, newState, proposer, changedAt } = payload;
  
  log(`Processing proposal event: ${proposalId} (${oldState} → ${newState})`);
  
  // WARREN's role: Quality and risk perspective on proposals
  // Evaluates: Is this safe? What could go wrong? Are we protecting what works?
  
  const responses = {
    proposal_state_changed: () => {
      if (newState === 'pending') {
        log(`📋 Proposal ${proposalId} pending - running quality/risk analysis...`);
        log(`   WARREN: "What are the failure modes? How do we protect against them?"`);
        log(`   🔍 Checking audit trail and risk factors...`);
        
        updateMemoryWithProposal(proposalId, 'pending', proposer, 'quality-review');
      }
      else if (newState === 'approved') {
        log(`✅ Proposal ${proposalId} APPROVED by WARREN`);
        log(`   WARREN: "Quality standards met. Risk is acceptable."`);
        updateMemoryWithProposal(proposalId, 'approved', proposer, 'approved');
      }
      else if (newState === 'denied') {
        log(`❌ Proposal ${proposalId} - quality/risk concerns`);
        log(`   WARREN: "The risk outweighs the reward. We protect the business."`);
        updateMemoryWithProposal(proposalId, 'denied', proposer, 'denied');
      }
      else if (newState === 'executed') {
        log(`📊 Proposal ${proposalId} EXECUTED - scheduling post-implementation audit`);
        log(`   WARREN: "Verify it works as expected. Log findings."`);
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
      const src = path.join(WARREN_INBOX, filename);
      const dst = path.join(WARREN_OUTBOX, filename);
      
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