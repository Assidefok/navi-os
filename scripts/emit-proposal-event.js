#!/usr/bin/env node
/**
 * Proposal State Change Event Emitter
 * 
 * Call this when a proposal changes state to notify relevant chiefs.
 * 
 * Usage:
 *   node emit-proposal-event.js <proposal-id> <old-state> <new-state> [proposer]
 * 
 * Chiefs notified based on proposal type and state change:
 *   - Strategic/Vision → ELOM
 *   - Quality/Risk → WARREN  
 *   - Execution/Operations → JEFF
 *   - AI/Tech → SAM
 */

const path = require('path');
const eventBus = path.join(__dirname, 'event-bus.js');

const [,, proposalId, oldState, newState, proposer = 'unknown'] = process.argv;

if (!proposalId || !oldState || !newState) {
  console.log('Usage: node emit-proposal-event.js <proposal-id> <old-state> <new-state> [proposer]');
  process.exit(1);
}

const payload = {
  proposalId,
  oldState,
  newState,
  proposer,
  changedAt: new Date().toISOString()
};

// Emit to all chiefs - they can filter based on their perspective
const chiefs = ['elom', 'warren', 'jeff', 'sam'];
chiefs.forEach(chief => {
  const cmd = `node ${eventBus} emit ${chief} proposal_state_changed '${JSON.stringify(payload)}'`;
  require('child_process').execSync(cmd, { stdio: 'inherit' });
});

console.log(`\n📢 Proposal ${proposalId}: ${oldState} → ${newState}`);