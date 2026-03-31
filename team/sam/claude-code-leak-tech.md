# Claude Code Leak — Technical Assessment by SAM

**Date:** March 31, 2026  
**From:** SAM (Chief AI Officer)  
**Re:** Architectural analysis of Anthropic's Claude Code source leak

---

## Executive Summary

Claude Code is a serious, production-grade system — not a prototype or a wrapper. The AsyncGenerator streaming loop combined with the permission hook abstraction is the real innovation here. Most of what they've built is *sound engineering* applied to a hard problem. Here's my honest assessment for OpenClaw.

---

## 1. AsyncGenerator Streaming Loop — The Core Innovation

**Verdict: HIGH priority, worth studying deeply.**

This is the most important architectural pattern in Claude Code. Let me explain why it matters:

```
async function* query(messages, systemPrompt, context, canUseTool, toolUseContext) {
  const response = await querySonnet(...)
  yield response  // Immediate — UI gets it in real-time

  for await (const toolResult of runToolsSerially(...)) {
    yield toolResult  // Progress streaming mid-execution
  }

  yield* await query(accumulatedMessages, ...)  // Recursive continuation
}
```

**Why this is better than a polling loop:**

1. **No polling overhead** — the caller `for await` on the generator; there's no `setInterval` or `setTimeout` burning CPU checking for results
2. **Backpressure is automatic** — if the UI can't consume fast enough, the generator suspends. No queue buildup
3. **Real-time progress** — tools can `yield { type: 'progress', ... }` during execution. Long operations like `grep -r` show output as it arrives, not after 30 seconds of silence
4. **Composability** — generators compose naturally with `yield*` for recursion

**For OpenClaw:** This is the pattern I want us to adopt. It changes the UX fundamentally — users see streaming output instead of waiting for "Thinking..." spinners. It's also more resource-efficient.

**Technical risk:** Recursive generators can be hard to debug. We'll need solid error boundaries and stack trace handling. Also, the recursive `yield* await query(...)` pattern could theoretically stack-overflow on very long conversations — but Claude Code mitigates this with context compaction (`/compact`).

---

## 2. Tool-as-Generator Pattern

**Verdict: HIGH priority, adopt.**

```typescript
async *call(input, context, canUseTool) {
  yield { type: 'progress', content: 'Starting file scan...' }
  const files = await glob(pattern)
  yield { type: 'progress', content: `Found ${files.length} files, reading...` }
  const content = await Promise.all(files.map(readFile))
  yield { type: 'result', data: content }
}
```

This is a clean abstraction. The tool doesn't just "return" a result — it streams it. The caller doesn't need to know if the tool is fast or slow; the interface is the same.

**Benefits for OpenClaw:**
- Long-running tools (code search, git operations, API calls) become non-blocking
- Users get feedback during execution — crucial for trust
- Tool authors get a simple mental model: yield progress, yield result

**Risk:** The `ProgressMessage` type is internal — it's stripped before sending back to the API. We need to be careful about what we expose. Also, tools that are not generators need to be wrapped — we can't have mixed sync/async behavior everywhere.

**Recommendation:** Start with a `ToolResult` union type that includes `{ type: 'progress' } | { type: 'result' } | { type: 'error' }`. Make all OpenClaw tools conform.

---

## 3. Permission Hook Abstraction (CanUseToolFn)

**Verdict: HIGH priority, adopt with modifications.**

```typescript
type CanUseToolFn = (
  toolName: string,
  input: unknown,
  context: ToolUseContext
) => Promise<'yes' | 'no' | 'ask'>
```

This is elegant because:
- Permission logic is **decoupled from tool execution** — testable in isolation
- It can trigger **UI dialogs** (returns `'ask'`) without the tool knowing about the UI
- It's **pluggable** — swap in a strict mode for production, permissive mode for testing

**Claude Code's permission model:**
- Read-only tools → generally allowed
- BashTool → subcommand-level permission with intent classification (Haiku)
- File write tools → session-only permission, cleared on restart
- Dangerous tools → explicit user confirmation

**For OpenClaw:** We currently handle permissions at the gateway level. The `CanUseToolFn` pattern lets us push permission checks *into* the tool execution layer, making it per-session and per-project. This is strictly better than our current approach.

**Risk:** The `canUseTool` function is async — every tool call goes through it. If it's slow, it adds latency. We should make it a fast in-memory lookup, not an async disk read.

---

## 4. Read-Only vs Write Tool Concurrency

**Verdict: HIGH priority, adopt.**

```typescript
if (allToolsReadOnly) {
  runToolsConcurrently(maxConcurrency: 10)
} else {
  runToolsSerially()
}
```

This is a simple, smart rule: read-only operations can't cause race conditions. Running them in parallel gives huge speedups — a `GlobTool` + `GrepTool` + `FileReadTool` all firing at once is dramatically faster than sequential execution.

**For OpenClaw:** We should tag every tool as `isReadOnly()` and implement this logic. It's a one-time classification that pays dividends in performance.

**Risk:** Some read-only tools might have side effects through indirect mechanisms (e.g., a `BashTool` running `git status` is read-only, but running `git push` is not). The `isReadOnly()` check must be on the *specific invocation*, not just the tool class. Claude Code handles this by checking the tool + specific input parameters.

---

## 5. MCP (Model Context Protocol) Integration

**Verdict: MEDIUM priority, watch and evaluate.**

MCP is Anthropic's standard for tool extensibility. Claude Code acts as an MCP *client* — it can load tools from any MCP *server* configured in `.mcprc`.

**Pros:**
- Standard protocol = ecosystem leverage
- Tools are dynamically discovered, not hardcoded
- Enables third-party integrations without modifying Claude Code itself

**Cons:**
- MCP is relatively new; the ecosystem is still small
- The protocol adds latency (serialization/deserialization over stdio or SSE)
- Debugging MCP tool failures is harder than debugging native tools

**For OpenClaw:** MCP is worth supporting as a client. We should be able to consume MCP tools from external servers. But building our own MCP *server* implementation is lower priority — let's consume first, serve later.

---

## 6. Zod v4 Validation Everywhere

**Verdict: MEDIUM priority, adopt incrementally.**

Claude Code uses Zod for:
- Tool input schemas
- API response validation
- Config file parsing
- Feature flag types

**The key insight:** Zod schemas *are* the documentation. You write the schema once, and you get runtime validation + TypeScript inference + documentation. No duplication.

**For OpenClaw:** Start with tool input schemas. Every tool should have a Zod schema. Then extend to config files and API responses.

**Risk:** Zod adds bundle size and runtime overhead. With Bun, the overhead is minimal. With Node.js, we should evaluate carefully.

---

## 7. CLAUDE.md per-directory Context

**Verdict: MEDIUM priority, adopt.**

```
# CLAUDE.md
- Project structure notes
- Frequently used bash commands
- Code style preferences
- Context for the agent
```

This is a dead-simple but powerful pattern: a markdown file in any directory that the agent auto-loads into context. It turns the filesystem itself into a configuration layer.

**Why it works:**
- No new config format — just markdown
- Lives with the code it describes
- Easy for users to edit without learning a new tool
- Enables per-project customization

**For OpenClaw:** This is a quick win. Implement a `CLAUDE.md` discovery mechanism that scans parent directories up to the workspace root, merging content into the system prompt.

**Risk:** None significant. One concern: if users put large files in CLAUDE.md, we bloat the context window. Add a size limit (e.g., 8KB per file, 32KB total).

---

## 8. Sub-Agent Pattern (AgentTool)

**Verdict: MEDIUM priority, evaluate carefully.**

Claude Code's `AgentTool` lets the main agent spawn sub-agents for parallel tasks:

```typescript
// Sub-agents get filtered tool set (no recursive AgentTool)
const filteredTools = allTools.filter(t => t.name !== 'AgentTool')
```

**What's good:**
- Stateless sub-agents (each invocation has no memory of prior calls)
- Filtered tool sets for safety
- Encourages concurrent agent use ("use a single message with multiple tool uses")

**What's concerning:**
- **No recursive agents** — they explicitly blocked sub-agents spawning sub-agents. This is a deliberate design choice to avoid complexity explosions
- **Prompt must be highly detailed** — no back-and-forth means the task description must be complete upfront
- **Statelessness cuts both ways** — great for isolation, terrible for tasks requiring context accumulation

**For OpenClaw:** We already have multi-agent coordination (that's our core value prop!). The AgentTool pattern is useful for parallel task decomposition, but we should keep our hierarchical chief/sub-agent model which is more structured.

---

## 9. Binary Feedback (Internal/ANT Feature)

**Verdict: LOW priority, interesting experiment.**

Claude Code has a hidden feature for internal testing: run TWO parallel queries, present both responses to a human for selection. This is a lightweight RLHF mechanism.

**Assessment:** Interesting from a research perspective, but not production-relevant for OpenClaw right now. We're not at the scale where we need to A/B test model responses in the CLI loop.

---

## 10. Context Memoization

**Verdict: MEDIUM priority, adopt.**

```typescript
export const getGitStatus = memoize(async (): Promise<string | null> => {...})
export const getDirectoryStructure = memoize(async function (): Promise<string> {...})
```

Expensive context operations (git status, directory tree scans) are memoized per session. This avoids redundant work when the underlying data hasn't changed.

**For OpenClaw:** Implement session-level memoization for git status, file tree, and any other context that might be queried multiple times in a session.

---

## Summary: Pattern Adoption Roadmap for OpenClaw

| Pattern | Priority | Effort | Notes |
|---------|----------|--------|-------|
| AsyncGenerator Streaming Loop | HIGH | Medium | Core UX improvement — streaming, non-blocking |
| Tool-as-Generator (progress yields) | HIGH | Medium | Requires wrapping all tools |
| CanUseToolFn Permission Hook | HIGH | Low | Decouples permission from execution |
| Read-Only/Write Concurrency | HIGH | Low | Simple rule, big performance gain |
| CLAUDE.md per-directory | MEDIUM | Low | Quick win, good UX |
| Context Memoization | MEDIUM | Low | One-time setup, session-wide benefit |
| Zod Schema Validation | MEDIUM | Medium | Start with tool inputs, extend later |
| MCP Client Integration | MEDIUM | Medium | Ecosystem leverage, latency trade-off |
| Sub-Agent Pattern | MEDIUM | High | Useful for parallel decomposition |
| Binary Feedback | LOW | High | Not relevant yet |
| Ink/React Terminal UI | LOW | High | Complex, only if we need rich CLI UI |

---

## Technical Risks and Concerns

### 1. Recursive Generator Stack Depth
The `yield* await query(...)` recursive pattern could theoretically stack-overflow in very long sessions. Claude Code mitigates with `/compact` context compression. **We need an equivalent compaction mechanism.**

### 2. Permission Hook Performance
The `canUseTool` function is async and called on every tool invocation. If it's slow (e.g., reads from disk), it adds latency to every tool. **Must be an in-memory cache.**

### 3. Generator Error Handling
When a generator throws mid-execution, the error must be caught and formatted as a `tool_result` with `is_error: true`. This is non-trivial to implement correctly. **We need comprehensive test coverage for error paths.**

### 4. Progress Message Leakage
Claude Code carefully strips `ProgressMessage` types before sending to the API. If we leak internal-only messages to the model, we corrupt the conversation. **Need strict type separation and validation at the boundary.**

### 5. MCP Tool Trust
External MCP tools are only as trustworthy as their implementors. There's no sandboxing. **Consider running MCP tools in a subprocess or isolated context.**

### 6. Bun Runtime Dependency
Claude Code uses Bun for performance (fast startup, small bundle). OpenClaw currently runs on Node.js. **We should evaluate Bun as a runtime option, but this is a larger migration decision.**

---

## What This Means for OpenClaw's Architecture

The key architectural shift I recommend:

**Current (hypothesized):**
```
Agent → Tool Executor (blocking) → Results → Agent → ...
```

**Target:**
```
Agent → AsyncGenerator Loop → Tool (yielding progress) → Streaming Results → Agent
     ↑
Permission Hook (CanUseToolFn) ← per-tool, per-session, async
```

This is a meaningful refactor but not a rewrite. The core agent logic stays the same; we replace the tool execution layer with the generator-based approach.

---

## My Recommendation

**Start with the AsyncGenerator loop + permission hook + read/write concurrency.** These three patterns together give us:
- Real-time streaming UX
- Safe, testable permission system
- Performance gains from parallel read-only execution

The CLAUDE.md pattern is a quick win we can ship immediately.

Everything else (MCP, sub-agents, Zod schemas) can follow in a second iteration.

---

*"Primera versio aviat, no versio perfecta mes tard."*

— SAM 🤖
