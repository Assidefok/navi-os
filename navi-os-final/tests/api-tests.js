/**
 * Navi OS - API Test Suite
 * Run: node tests/api-tests.js
 */

const BASE = 'http://localhost:3001'

// Color codes for terminal output
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`${GREEN}✓${RESET} ${name}`)
    passed++
  } catch (err) {
    console.log(`${RED}✗${RESET} ${name}`)
    console.log(`  ${RED}Error: ${err.message}${RESET}`)
    failed++
  }
}

async function httpGet(path) {
  const res = await globalThis.fetch(`${BASE}${path}`)
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text) }
  } catch {
    return { status: res.status, data: text }
  }
}

async function httpPost(path, body) {
  const res = await globalThis.fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text) }
  } catch {
    return { status: res.status, data: text }
  }
}

console.log('\n🧪 Navi OS - Test Suite\n')
console.log('─'.repeat(50))

// Core API Tests
await test('GET /api/pm-board - returns valid JSON', async () => {
  const { status, data } = await httpGet('/api/pm-board')
  if (status !== 200) throw new Error(`Status ${status}`)
  if (!data.meta) throw new Error('Missing meta field')
  if (!Array.isArray(data.tasks)) throw new Error('Missing tasks array')
})

await test('GET /api/org-chart - returns org structure', async () => {
  const { status, data } = await httpGet('/api/org-chart')
  if (status !== 200) throw new Error(`Status ${status}`)
  if (!data.human) throw new Error('Missing human field')
})

await test('GET /api/cron-health - returns cron job status', async () => {
  const { status, data } = await httpGet('/api/cron-health')
  if (status !== 200) throw new Error(`Status ${status}`)
  if (!Array.isArray(data.jobs)) throw new Error('Missing jobs array')
})

await test('GET /api/ai-status - returns AI model status', async () => {
  const { status, data } = await httpGet('/api/ai-status')
  if (status !== 200) throw new Error(`Status ${status}`)
  if (!data.model) throw new Error('Missing model field')
})

await test('GET /api/pm2-status - returns PM2 process status', async () => {
  const { status, data } = await httpGet('/api/pm2-status')
  if (status !== 200) throw new Error(`Status ${status}`)
  if (!Array.isArray(data.processes)) throw new Error('Missing processes array')
})

await test('GET /api/backups - returns backup list', async () => {
  const { status, data } = await httpGet('/api/backups')
  if (status !== 200) throw new Error(`Status ${status}`)
  if (!Array.isArray(data.backups)) throw new Error('Missing backups array')
})

await test('GET /api/proposals - returns proposals', async () => {
  const { status, data } = await httpGet('/api/proposals')
  if (status !== 200) throw new Error(`Status ${status}`)
  if (!Array.isArray(data.proposals)) throw new Error('Missing proposals array')
})

await test('GET /api/inbox - returns inbox items', async () => {
  const { status, data } = await httpGet('/api/inbox')
  if (status !== 200) throw new Error(`Status ${status}`)
  if (!Array.isArray(data.items)) throw new Error('Missing items array')
})

await test('GET /api/standups - returns standup list', async () => {
  const { status, data } = await httpGet('/api/standups')
  if (status !== 200) throw new Error(`Status ${status}`)
  if (!Array.isArray(data.meetings)) throw new Error('Missing meetings array')
})

await test('GET /api/skills - returns skills list', async () => {
  const { status, data } = await httpGet('/api/skills')
  if (status !== 200) throw new Error(`Status ${status}`)
})

await test('GET /api/sessions - returns sessions', async () => {
  const { status, data } = await httpGet('/api/sessions')
  if (status !== 200) throw new Error(`Status ${status}`)
})

await test('GET /api/agents - returns agents list', async () => {
  const { status, data } = await httpGet('/api/agents')
  if (status !== 200) throw new Error(`Status ${status}`)
})

await test('GET /api/automations - returns automations', async () => {
  const { status, data } = await httpGet('/api/automations')
  if (status !== 200) throw new Error(`Status ${status}`)
})

await test('GET /api/chiefs-council - returns chiefs council', async () => {
  const { status, data } = await httpGet('/api/chiefs-council')
  if (status !== 200) throw new Error(`Status ${status}`)
})

await test('GET /api/git-log - returns git history', async () => {
  const { status, data } = await httpGet('/api/git-log')
  if (status !== 200) throw new Error(`Status ${status}`)
})

await test('GET /api/system-metrics - returns system metrics', async () => {
  const { status, data } = await httpGet('/api/system-metrics')
  if (status !== 200) throw new Error(`Status ${status}`)
})

await test('GET /api/tools - returns tools list', async () => {
  const { status, data } = await httpGet('/api/tools')
  if (status !== 200) throw new Error(`Status ${status}`)
})

// Somiar endpoints
await test('GET /api/somiar/dia/status - returns day dreaming status', async () => {
  const { status, data } = await httpGet('/api/somiar/dia/status')
  if (status !== 200) throw new Error(`Status ${status}`)
})

await test('GET /api/somiar/nit/status - returns night dreaming status', async () => {
  const { status, data } = await httpGet('/api/somiar/nit/status')
  if (status !== 200) throw new Error(`Status ${status}`)
})

// Memory endpoints
await test('GET /api/memory/files - returns memory files', async () => {
  const { status, data } = await httpGet('/api/memory/files')
  if (status !== 200) throw new Error(`Status ${status}`)
  if (!Array.isArray(data.files)) throw new Error('Missing files array')
})

// POST /api/pm-board - task update
await test('POST /api/file - rejects malformed JSON', async () => {
  const res = await httpPost('/api/file', 'not json')
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`)
})

// Ideas endpoints
await test('GET /api/ideas - returns ideas', async () => {
  const { status, data } = await httpGet('/api/ideas')
  if (status !== 200) throw new Error(`Status ${status}`)
})

// Integrations
await test('GET /api/integrations - returns integrations', async () => {
  const { status, data } = await httpGet('/api/integrations')
  if (status !== 200) throw new Error(`Status ${status}`)
})

// Chief status
await test('GET /api/chief/warren/status - returns chief status', async () => {
  const { status, data } = await httpGet('/api/chief/warren/status')
  if (status !== 200) throw new Error(`Status ${status}`)
})

// Gateway security
await test('GET /api/gateway-security - returns gateway security info', async () => {
  const { status, data } = await httpGet('/api/gateway-security')
  if (status !== 200) throw new Error(`Status ${status}`)
})

// Workspace files
await test('GET /api/workspace-files - returns workspace files', async () => {
  const { status, data } = await httpGet('/api/workspace-files')
  if (status !== 200) throw new Error(`Status ${status}`)
})

// Logs
await test('GET /api/logs - returns logs', async () => {
  const { status, data } = await httpGet('/api/logs')
  if (status !== 200) throw new Error(`Status ${status}`)
})

// Briefs
await test('GET /api/briefs - returns briefs', async () => {
  const { status, data } = await httpGet('/api/briefs')
  if (status !== 200) throw new Error(`Status ${status}`)
})

// Prototypes
await test('GET /api/prototypes - returns prototypes', async () => {
  const { status, data } = await httpGet('/api/prototypes')
  if (status !== 200) throw new Error(`Status ${status}`)
})

// Current model
await test('GET /api/current-model - returns current model', async () => {
  const { status, data } = await httpGet('/api/current-model')
  if (status !== 200) throw new Error(`Status ${status}`)
})

console.log('─'.repeat(50))
console.log(`\n${GREEN}✓${RESET} ${passed} passed`)
if (failed > 0) {
  console.log(`${RED}✗${RESET} ${failed} failed`)
  process.exit(1)
} else {
  console.log(`${GREEN}All tests passed!${RESET}\n`)
}
