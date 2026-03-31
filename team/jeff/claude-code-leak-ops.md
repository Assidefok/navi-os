# Claude Code Leak — JEFF Operations Analysis

**Date:** March 31, 2026  
**From:** Subagent (Navi delegation)  
**Task:** Review Claude Code architectural leak analysis, extract operational patterns, identify implementation priorities

---

## Context: What We Found

On March 31 2026, Anthropic's Claude Code CLI source code leaked via npm source map. We analyzed ~512K lines across ~1,900 files. Key findings:

- **AsyncGenerator streaming query loop** — tools yield progress in real-time
- **~17 core tools + MCP extensibility** — tool registry pattern
- **Read-only vs write tool concurrency model** — read-only tools run in parallel (up to 10x concurrency), write tools run serial
- **Bun runtime, Zod v4 validation** — schema-first input validation everywhere
- **Ink (React) for terminal UI** — component-based CLI UI
- **Memoization throughout** — expensive context ops (git status, directory structure) cached per session
- **Permission hook abstraction** — `CanUseToolFn` decouples permission logic from tool execution
- **Binary feedback** (internal) — runs two parallel queries, human picks best

---

## JEFF's Evaluation

### Operational Patterns: What We Could Operationalize in OpenClaw

**Pattern 1: Read-only vs Write Tool Concurrency**
This is the single highest-value operational pattern. The insight: if all tools in a message are read-only (Glob, Grep, LS, Read, Think), run them concurrently up to MAX_CONCURRENCY=10. If ANY write tool is present, fall back to serial. 

For our OpenClaw implementation business:
- **Wins:** Parallel file reads across a client codebase = 10x faster context gathering
- **Process change:** Tool definitions need an `isReadOnly()` flag. Every new tool must declare it.
- **Risk:** We must be certain the read-only flag is accurate. A bug here = race conditions on writes.

**Pattern 2: Tool-as-Generator with Progress Yielding**
Tools don't return; they `yield` progress messages. Long operations (bash commands, glob searches) stream output back to the UI in real-time rather than blocking.

For our workflows:
- **Wins:** Better UX, earlier error detection, no "stuck" tool feeling
- **Process change:** Our tool interface spec needs a generator-based `call()` method, not Promise-based
- **Risk:** Migration cost is high. Every existing tool needs refactoring.

**Pattern 3: Permission Hook Abstraction (CanUseToolFn)**
Permissions are a first-class concept, not scattered if-checks. A `canUseTool: CanUseToolFn` is injected into every tool call. The hook is UI-aware (triggers dialogs) and testable in isolation.

For our client delivery:
- **Wins:** Different clients have different security postures. A pluggable permission system means we can ship "allowlist mode" for security-sensitive clients and "warn-only mode" for internal.
- **Process change:** We need a permission policy registry. Not just "allowed tools" but granular: which bash subcommands, which directories, which MCP servers.
- **Risk:** Complexity. Every tool permission request is a UX interruption. Strike a balance.

**Pattern 4: CLAUDE.md Per-Directory Context**
A `.md` file in any directory auto-loads into the agent context. Stores project-specific commands, code style, frequently-used operations.

For our implementation business:
- **Wins:** We ship client projects with a `CLAUDE.md` that encodes their operational preferences. Next agent that touches their codebase knows the context immediately.
- **Process change:** We need a `claude-code-leak-ops.md` template for client onboarding.

**Pattern 5: Memoized Context Gathering**
`getGitStatus = memoize(async () => ...)` and `getDirectoryStructure = memoize(async () => ...)`. Expensive operations run once per session.

For our operations:
- **Wins:** Faster session startup, fewer API calls, less context pollution
- **Process change:** Any context op that might be called multiple times needs a memo wrapper.

---

## 2-3 Implementation Priorities

### Priority 1: Read-Only/Write Concurrency Model (HIGHEST)
**Why first:** Highest bang-for-buck. Massive performance improvement with moderate implementation complexity. Zero UX changes required — purely under the hood.

**What to do:**
1. Add `isReadOnly(): boolean` to every tool in our registry
2. Implement `runToolsConcurrently(tools, maxConcurrency=10)` and `runToolsSerially(tools)`
3. At message-handling time, check if all tools are read-only → route accordingly
4. Ship it behind a feature flag per client

**Success metric:** Context gathering time for multi-file operations drops by estimated 60-80%.

---

### Priority 2: Permission Hook Abstraction
**Why second:** Client delivery requires trust. Different clients have different security requirements. Having a pluggable permission system means we can bid on both "startup with loose permissions" and "enterprise with strict allowlist" engagements.

**What to do:**
1. Define `CanUseToolFn` interface: `(toolName, input) => Promise<Allow|Deny|Ask>`
2. Build three policy implementations: `PermissivePolicy`, `AskPolicy`, `AllowlistPolicy`
3. Wire into tool execution layer (replaces scattered if-checks)
4. Add permission audit log per session (persisted to project config)

**Success metric:** New client onboard in <2 hours with custom permission policy.

---

### Priority 3: CLAUDE.md Per-Directory Context Pattern
**Why third:** This is our client delivery multiplier. Ship a project with a `CLAUDE.md` that encodes everything an agent needs to work on that codebase: build commands, deployment process, client preferences, operational notes.

**What to do:**
1. Implement `discoverCLAUDEMDs(directory)` that walks up from cwd collecting all `CLAUDE.md` files
2. Append their content to system prompt (with clear markers for which directory each came from)
3. Create a `CLAUDE.md` template for new client projects
4. During standups, Navi proactively updates the relevant `CLAUDE.md` with new learnings

**Success metric:** New agent session on existing client project achieves useful output in <10 minutes (vs. hours of context gathering).

---

## What We Should NOT Do

**Don't adopt Ink/React terminal UI** — Not our core competency right now. Rich CLI output is a distraction from building reliable agent workflows.

**Don't adopt Binary Feedback** — This is an internal RLHF mechanism. Interesting research but not operationally relevant for client delivery.

**Don't adopt VCR recording** — Testing infrastructure is nice-to-have. We need working agents first.

---

## Summary

| Pattern | Operational Value | Effort | Priority |
|---------|------------------|--------|----------|
| Read/Write concurrency | HIGH | MEDIUM | 1 |
| Permission hook abstraction | HIGH | MEDIUM | 2 |
| CLAUDE.md context | MEDIUM-HIGH | LOW | 3 |
| Tool-as-generator (progress) | MEDIUM | HIGH | Later |
| Memoized context | MEDIUM | LOW | 3 (bundle) |
| MCP extensibility | MEDIUM | HIGH | Later |

**Bottom line:** Start with Priority 1. It's the biggest operational win, it's contained, and it teaches us how to extend the tool system properly. Then Priority 2 (trust is everything in client delivery). Then Priority 3 (our client delivery flywheel.

---

*JEFF | COO | ⚡ Execution is the only strategy that matters.*
