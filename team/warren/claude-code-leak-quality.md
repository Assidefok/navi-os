# Claude Code Leak — Quality & Risk Assessment

**Assessor:** WARREN (Chief Quality Officer)  
**Date:** March 31, 2026  
**Input:** /home/user/.openclaw/workspace/research/claude-code-leak/ANALYSIS.md  

---

## Executive Summary

The Claude Code source leak reveals a **production-grade agentic system** with impressive architectural discipline. However, several patterns carry hidden risks that would be dangerous to copy naively. Below is my assessment.

---

## Section 1: Quality Assessment of Key Patterns

### 1.1 AsyncGenerator Streaming Loop — **USE WITH CAUTION**

**What Claude Code does well:**
- Non-blocking streaming enables real-time UI feedback
- Recursive continuation keeps context intact
- Progress messages allow tools to report during execution

**What could go wrong if we copy this:**
- **Resource leaks**: AsyncGenerator state is hard to clean up on interruption. If the agent crashes mid-loop, dangling generators can hold file handles, API connections, or in-memory buffers.
- **Error propagation gaps**: Recursive `yield* await query(...)` means errors can bubble through multiple stack frames. Without explicit error boundaries at each level, a single tool failure can crash the entire session.
- **Memory growth**: Each recursive continuation accumulates messages in memory. Long sessions (Claude Code's `/compact` command exists for a reason) can balloon context size without bounds.

**Do not copy without:**
- Explicit cancellation tokens (`AbortSignal`) passed through every generator
- Memory budget monitoring with auto-compaction
- Error isolation — each tool call should be wrapped in its own try/catch boundary

---

### 1.2 Permission Hook Abstraction (CanUseToolFn) — **GOOD PATTERN, NEEDS STRENGTHENING**

**What Claude Code does well:**
- Decoupling permission logic from tool execution is the right instinct
- Allows swapping permission strategies (testing vs production vs user-confirmed)
- UI-aware hooks enable interactive dialogs without tool code knowing about them

**What could go wrong:**
- **The hook is only as strong as its implementation**: If `canUseTool` is a no-op or always-returns-true in certain modes (`dangerouslySkipPermissions`), the entire security model collapses silently.
- **BashTool's permission model is fragile**: Command prefix matching + Haiku classification is clever but brittle. Attackers can craft commands that bypass intent classification. The blocklist approach (vs allowlist) means new attack vectors aren't covered until someone thinks to add them.
- **Session-only permissions**: File write permissions are cleared on restart — but the file system state is not. Restarting the CLI doesn't undo what was written.

**Do not copy without:**
- **Allowlist-first permission model** (deny-by-default)
- **Immutable audit log** of all permission grants (not just Sentry — persistent, tamper-evident)
- **Permission escalation bounds**: If we grant a tool, what can it do downstream? Claude Code doesn't track transitive permissions (e.g., a BashTool that then runs `curl` to exfiltrate data).

---

### 1.3 Read-Only vs Write Tool Concurrency — **SOUND PATTERN, GOOD PRIORITY**

**What Claude Code does well:**
- Separating read-only tools (safe to parallelize) from write tools (must serialize) is architecturally correct
- `MAX_TOOL_USE_CONCURRENCY = 10` is a sensible cap

**What could go wrong:**
- **Read-only tools can still cause harm**: `GrepTool` reading sensitive files (`.env`, `~/.ssh/`), `LSTool` revealing directory structure for attack planning. "Read-only" ≠ "harmless."
- **TOCTOU race conditions**: Between checking `isReadOnly()` and actually executing, the filesystem state can change. A file read tool might read a file that was written by another concurrent tool.
- **Hidden state mutations**: `MemoryWriteTool` is marked as a tool but is ANT-only and disabled by default. Read-only classification depends on tools being honest about their side effects.

**Do not copy without:**
- **Read-only tools must be scoped**: FileReadTool should reject paths outside the working context
- **TOCTOU mitigations**: File locking or copy-on-read semantics
- **Side-channel analysis awareness**: Even "read-only" can leak sensitive directory structures, file names, or patterns

---

### 1.4 Sub-Agent System (AgentTool) — **HIGH RISK, COPY CAREFULLY**

**What Claude Code does well:**
- Sub-agents get filtered tool sets (no recursive AgentTool)
- Stateless execution prevents memory leaks across invocations
- Agent prompt must be self-contained (no back-and-forth possible)

**What could go wrong:**
- **No recursive agents, yet the sub-agent still has full tool access if `dangerouslySkipPermissions=true`**: This is the most dangerous pattern in the codebase. A single misconfiguration enables a sub-agent to run arbitrary Bash commands, write any file, and exfiltrate data.
- **Stateless = no accountability**: Each sub-agent invocation has no memory of prior calls. If an agent is used for malicious purposes, there's no chain of intent to reconstruct.
- **Agent prompt injection**: If the prompt passed to a sub-agent includes user-controlled content (e.g., filenames, git messages), prompt injection is possible. The sub-agent trusts its prompt.

**Do not copy without:**
- **Mandatory tool allowlisting per sub-agent type**, not just a flag to skip permissions
- **Sub-agent audit trail**: every sub-agent call logged with its input prompt, output, and caller identity
- **Input sanitization** before passing user content into sub-agent prompts

---

### 1.5 MCP Protocol Integration — **UNKNOWN RISK, TREAT AS UNTRUSTED**

**What Claude Code does well:**
- Dynamic tool registration from MCP servers
- Lazy loading keeps startup fast

**What could go wrong:**
- **MCP tools are third-party code running with the agent's permissions**: Any MCP server can register arbitrary tools. If a malicious or buggy MCP server is configured, it has the same trust level as the agent itself.
- **No MCP tool validation**: Zod schemas validate input format but not input legitimacy. An MCP tool could define `delete_all_files` with a valid Zod schema and the permission system would pass it through.
- **Transport security**: MCP over stdio is local, but SSE-based MCP servers make network connections. Man-in-the-middle attacks on SSE are plausible in certain configurations.

**Do not copy without:**
- **MCP tool sandboxing**: MCP tools should run in a separate process with restricted OS permissions
- **MCP tool allowlisting**: Only allow specific MCP servers, not arbitrary ones from `.mcprc`
- **Schema + semantics validation**: Beyond Zod format checking, understand what the tool actually does before presenting it to the user

---

## Section 2: Risk Matrix

| Pattern | Risk Level | Primary Threat |
|---------|------------|----------------|
| AsyncGenerator loop | **MEDIUM** | Resource leaks, memory growth, error cascade |
| CanUseToolFn hook | **HIGH** | Silent security bypass via `dangerouslySkipPermissions` |
| BashTool permission system | **HIGH** | Command injection, intent classification bypass |
| Read-only tool concurrency | **MEDIUM** | Side-channel data leakage, TOCTOU races |
| Sub-agent system | **HIGH** | Permission escalation, prompt injection, no audit trail |
| MCP integration | **HIGH** | Untrusted third-party tools with full agent permissions |
| CLAUDE.md context injection | **MEDIUM** | Context pollution, prompt injection via project files |
| Binary feedback (RLHF) | **LOW** | Internal use only, not a direct risk |
| Cost tracking | **LOW** | Informational, no direct risk |

---

## Section 3: "Do Not Copy" List

1. **Do NOT copy the `dangerouslySkipPermissions` pattern as-is**  
   This flag bypasses all security checks. It should be eliminated or replaced with granular override scopes (e.g., `allowFileWrites: true` with explicit audit logging).

2. **Do NOT copy BashTool's command prefix matching**  
   Haiku-based intent classification is opaque and can be fooled. Use explicit allowlists of approved commands and subcommands instead.

3. **Do NOT enable recursive agent spawning without additional sandboxing**  
   Even though Claude Code explicitly blocks it ("No recursive agents, yet.."), the pattern is fragile. If we implement sub-agents, they must be strictly sandboxed at the OS level.

4. **Do NOT trust MCP tools without additional vetting**  
   Third-party MCP servers should be treated as untrusted code. Do not give them the same permission scope as built-in tools.

5. **Do NOT rely on the blocklist approach for security**  
   Blocklists grow reactively. Use allowlists with explicit justification required to add exceptions.

---

## Section 4: 3 Quality Criteria for Our Agent Systems

### Criterion 1: **Zero-Trust Tool Execution**

Every tool call must be treated as potentially malicious, regardless of whether it comes from the core tool set or an extension.

**Implementation requirements:**
- All tools (core and MCP) run in isolated process contexts with minimal OS permissions
- Every tool invocation is logged with: caller identity, timestamp, input parameters, output hash, and duration
- Permission grants are **revocable** and **time-bounded** (not just session-scoped)
- The system must be able to revoke a tool's access in real-time without restarting

**Rationale:** Claude Code's permission model is good in design but weak in enforcement. We will not make the same mistake. A tool that can't be audited can't be trusted.

---

### Criterion 2: **Fail-Safe Default with Explicit Opt-In**

The default state of the system is locked down. Every capability must be explicitly enabled by the user.

**Implementation requirements:**
- **Deny-by-default**: No tool, no MCP server, no sub-agent runs without explicit user configuration
- **Capability manifest**: The system publishes what it *can* do; the user configures what it *may* do
- **Graceful degradation**: If a permission is denied, the system should explain why and offer guidance — not silently skip
- **Onboarding friction**: First-time setup should require at least one explicit decision from the user (not just "click OK to continue")

**Rationale:** The best security is invisible until it's needed. Claude Code's `dangerouslySkipPermissions` exists because someone needed to bypass the security for testing — but it became a backdoor. Our model should require explicit, audited opt-in for every privileged operation.

---

### Criterion 3: **Memory & Resource Bounds with Hard Limits**

No single operation, agent, or session can consume unbounded resources.

**Implementation requirements:**
- Every tool must declare its maximum resource consumption (memory, CPU time, I/O)
- Sub-agents have hard limits on execution time, memory, and token budget
- Long-running sessions must auto-compact context before a configurable threshold (e.g., 80% of context window)
- The system should monitor its own resource consumption and log warnings before hitting limits
- Panic/oom recovery: the system must be restartable without data loss (conversation recovery from persisted state)

**Rationale:** Claude Code's `/compact` command exists because someone had to deal with runaway context growth. We've seen that AsyncGenerator loops accumulate state. We will bake resource bounds into the architecture from day one, not patch them later.

---

## Section 5: Final Thoughts

Claude Code is a well-engineered system. Its AsyncGenerator loop, permission hook abstraction, and tool registry pattern are worth studying. But the leak also exposes how even carefully designed systems carry hidden risks — especially around permission escalation, sub-agent isolation, and third-party extensibility.

The most valuable lesson: **security is not a feature, it's a constraint**. Claude Code adds security on top of a capable system. For OpenClaw, we should design security into the core execution model from the start.

Quality is not about how impressive the system is when everything goes right. It's about how predictably it fails when something goes wrong.

— **WARREN**  
_Chief Quality Officer_

---

*Next action: Share this assessment with SAM (Chief AI Officer) for technical implementation review, and with JEFF (Chief Operations Officer) for process integration.*
