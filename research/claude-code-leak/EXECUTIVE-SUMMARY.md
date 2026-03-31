# Claude Code Leak — Executive Summary
**Date:** 2026-03-31
**Status:** Archived for future analysis

---

## What Happened
On March 31 2026, Anthropic's Claude Code CLI source code leaked via a source map file left on the npm registry. The leak contains the full TypeScript source of the CLI tool for autonomous coding (~199 source files, ~512K lines).

**What was NOT leaked:** Model weights, training data, core AI infrastructure.

**What WAS leaked:** CLI source code, agent architecture, tool system, permission layer.

**Source repos analyzed:**
- `leeyeel/claude-code-sourcemap` — TypeScript original
- `instructkr/claude-code` — Python clean-room rewrite

---

## Multi-Chief Analysis Summary

### 🚀 ELOM — Strategic Outlook
**File:** `team/elom/claude-code-leak-strategy.md`

**3 Strategic Implications:**
1. **Agentic CLI = new IDE** → implementation business opportunity
2. **Permission layer = the moat** → enterprise adoption depends on it
3. **MCP = USB-C of AI tools** → MCP integration expertise = premium value

**Competitive Recommendations:**
- Position as Claude Code implementation partner
- Build reference implementations fast (first mover advantage)
- Target the "AI engineering gap" with OpenClaw solutions

**Key Insight:** The permission layer and MCP integration are where enterprise clients will pay for help — that's our delivery sweet spot.

---

### 📊 WARREN — Quality & Risk Assessment
**File:** `team/warren/claude-code-leak-quality.md`

**5 Risk Areas Identified:**

| Risk Area | Level | Key Concern |
|-----------|-------|-------------|
| `dangerouslySkipPermissions` | HIGH | Silent security bypass |
| BashTool intent classification | HIGH | Blocklist is reactive, can be fooled |
| Sub-agent system | HIGH | No transitive permission tracking |
| MCP integration | HIGH | Third-party tools = untrusted code |
| AsyncGenerator loop | MEDIUM | Resource leaks, memory growth |

**3 Quality Criteria:**
1. **Zero-Trust Tool Execution** — Every tool is audited, isolated, and permission grants are revocable + time-bounded
2. **Fail-Safe Default with Explicit Opt-In** — Deny-by-default, capability manifest, onboarding friction
3. **Memory & Resource Bounds** — Hard limits on every tool, sub-agent, and session; auto-compaction before context exhaustion

---

### ⚡ JEFF — Operational Priorities
**File:** `team/jeff/claude-code-leak-ops.md`

**3 Implementation Priorities:**
1. **Read-only/write concurrency model** (highest) — Massive perf gain, moderate effort, zero UX impact. Add `isReadOnly()` to tools, route to concurrent vs serial executor.
2. **Permission hook abstraction** (second) — Pluggable `CanUseToolFn` lets us bid on both permissive and enterprise-allowlist clients.
3. **CLAUDE.md per-directory context** (third) — Client delivery multiplier. Ship projects with a context file that every future agent instantly understands.

**What NOT to adopt:** Ink/React terminal UI, Binary Feedback, VCR recording — keep focus on execution-relevant patterns.

---

### 🤖 SAM — Technical Assessment
**File:** `team/sam/claude-code-leak-tech.md`

**HIGH priority patterns for OpenClaw:**
- **AsyncGenerator streaming loop** — core innovation; replaces polling with real-time streaming + backpressure
- **Tool-as-generator** — tools yield progress instead of blocking; changes UX fundamentally
- **CanUseToolFn permission hook** — decouples permission logic from tool execution, testable in isolation
- **Read-only/write concurrency** — simple rule: read-only tools run in parallel (max 10), write tools serially

**MEDIUM priority:**
- CLAUDE.md per-directory context (quick win, immediate value)
- Context memoization (session-level caching)
- Zod schema validation for tools
- MCP client integration

**Technical Risks:**
- Recursive generator stack depth → need context compaction mechanism
- Permission hook must be in-memory (not disk-bound)
- Progress messages must be strictly separated from API-bound messages
- MCP external tools need sandboxing considerations

**SAM's Recommendation:** Start with AsyncGenerator + permission hook + read/write concurrency as a coherent trio — they share the same architectural layer and deliver streaming UX, safety, and performance together.

---

## Technical Architecture Highlights

### AsyncGenerator Tool Loop (Core Innovation)
- Non-blocking, real-time streaming vs polling
- Tools can yield progress without blocking
- Backpressure support built-in

### Permission Hook System
- `CanUseToolFn` abstraction — decoupled, testable
- Pluggable permission logic
- Supports both permissive and enterprise-allowlist modes

### Read-Only/Write Concurrency
- Read-only tools: parallel execution (max 10 concurrent)
- Write tools: serial execution
- Zero UX impact, massive performance gain

### MCP (Model Context Protocol)
- Standard extensibility layer for AI tools
- Third-party tool integration
- Expertise = premium value for enterprise clients

### CLAUDE.md Per-Directory Context
- Project-specific memory auto-loaded
- Client delivery multiplier
- Every new agent instantly understands project context

---

## Cross-Chief Consensus

| Area | Consensus |
|------|-----------|
| **Technical priority** | AsyncGenerator + permission hook + read/write concurrency trio |
| **Business opportunity** | MCP integration expertise = premium value |
| **Main risk** | Permission/security layer needs Zero-Trust approach |
| **Quick win** | CLAUDE.md per-directory context loading |

---

## Files Reference

```
/home/user/.openclaw/workspace/research/claude-code-leak/
├── ANALYSIS.md                        # Full technical analysis
├── EXECUTIVE-SUMMARY.md              # This file
├── leeyeel-claude-code-sourcemap/    # TypeScript source (leaked)
└── instructkr-claude-code/            # Python rewrite

/home/user/.openclaw/workspace/team/
├── elom/claude-code-leak-strategy.md
├── warren/claude-code-leak-quality.md
├── jeff/claude-code-leak-ops.md
└── sam/claude-code-leak-tech.md
```

---

## Next Steps (when we revisit this)

1. **Evaluate AsyncGenerator trio** for OpenClaw implementation
2. **Assess MCP integration** path for enterprise clients
3. **Apply WARREN's quality criteria** to any new agent system
4. **Consider first reference implementation** using Claude Code patterns
5. **Track MCP ecosystem** evolution — first-mover advantage opportunity

---

*Archived by Navi · 2026-03-31*
