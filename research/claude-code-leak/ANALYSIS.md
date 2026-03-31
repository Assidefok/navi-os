# Claude Code Source Code Leak - Architectural Analysis

**Date:** March 31, 2026  
**Source:** `leeyeel/claude-code-sourcemap` GitHub mirror (TypeScript source extracted from npm source map)  
**Lines:** ~512,000 across ~1,900 files (source map reconstruction), ~199 TypeScript files in the extracted src/

---

## 1. Architecture Overview

Claude Code is a **production-grade agentic CLI tool** built with the following stack:

- **Runtime:** Bun (not Node.js) — chosen for faster startup and dead-code elimination for feature flags
- **UI Framework:** Ink (React for terminals) — component-based CLI UI with state management
- **Language:** TypeScript throughout
- **Validation:** Zod v4 for all schema validation (tool inputs, API responses, config files)
- **LLM SDK:** `@anthropic-ai/sdk` (custom vendored)
- **Protocol:** MCP (Model Context Protocol) for tool extensibility
- **Observability:** OpenTelemetry + Sentry (lazy-loaded)

### Directory Structure

```
src/
├── entrypoints/
│   └── cli.tsx          # Main CLI entry point (React component via Ink)
├── query.ts             # Core query engine — the "brain" (~516 lines)
├── permissions.ts      # Permission-gating system (~267 lines)
├── context.ts           # Context gathering (git status, directory structure, CLAUDE.md)
├── cost-tracker.ts      # Token cost tracking
├── tools.ts             # Tool registry (~59 lines)
├── tools/               # Individual tool implementations
│   ├── AgentTool/        # Sub-agent spawning
│   ├── BashTool/        # Command execution
│   ├── FileEditTool/    # Edit files
│   ├── FileReadTool/    # Read files
│   ├── FileWriteTool/   # Write files
│   ├── GlobTool/        # Pattern-based file search
│   ├── GrepTool/        # Content search
│   ├── LSTool/          # Directory listing
│   ├── ArchitectTool/   # Architecture analysis sub-agent
│   ├── MemoryReadTool/  # Persistent memory
│   ├── MemoryWriteTool/ # Persistent memory
│   ├── MCPTool/         # MCP protocol integration
│   └── ThinkTool/       # Extended thinking
├── services/
│   ├── claude.ts        # Anthropic API client with retry/logging
│   ├── mcpClient.ts     # MCP server connection manager
│   ├── statsig.ts       # Feature flags & analytics
│   ├── sentry.ts        # Error tracking
│   └── vcr.ts           # Recording/playback for testing
├── screens/
│   └── REPL.tsx         # Main interactive screen
├── components/           # React UI components (Ink)
├── hooks/               # React hooks
│   └── useCanUseTool.ts # Permission-request hook
├── constants/
│   └── prompts.ts       # System prompts
└── commands/            # Slash commands (/help, /compact, /init, etc.)
```

---

## 2. The Query Engine (query.ts) — Core Loop

The query engine is the heart of Claude Code. It's implemented as an **AsyncGenerator** that yields streaming messages:

```typescript
export async function* query(
  messages: Message[],
  systemPrompt: string[],
  context: { [k: string]: string },
  canUseTool: CanUseToolFn,
  toolUseContext: ToolUseContext,
): AsyncGenerator<Message, void>
```

### Key Design Patterns

**1. AsyncGenerator Streaming**
- The function `yield`s messages as they arrive (assistant messages, progress, tool results)
- The REPL screen consumes these with `for await (const message of query(...))`
- Each yielded message is pushed to the UI in real-time

**2. Recursive Tool Loop**
- After tool results are collected, the function recursively calls itself with accumulated messages:
  ```typescript
  yield* await query(
    [...messages, assistantMessage, ...orderedToolResults],
    systemPrompt, context, canUseTool, toolUseContext
  )
  ```
- This is the classic "agent loop" — query → tool use → result → query again → ...

**3. Concurrency: Serial vs Parallel**
- If ALL tools in a message are read-only → runs concurrently (`runToolsConcurrently`)
- Otherwise → runs serially (`runToolsSerially`)
- Max concurrency: `MAX_TOOL_USE_CONCURRENCY = 10`
- Read-only tools: `GlobTool`, `GrepTool`, `LSTool`, `FileReadTool`, `NotebookReadTool`, `MemoryReadTool`, `ThinkTool`, `ArchitectTool`

**4. Binary Feedback (Internal/ANT feature)**
- For internal testing, runs TWO parallel queries and presents both responses to a human for selection
- Only enabled when `USER_TYPE === 'ant'` and `shouldUseBinaryFeedback()` returns true
- This is a sophisticated RLHF mechanism baked into the core loop

**5. Progress Messages**
- Tools can yield `type: 'progress'` messages during execution (e.g., for streaming output)
- These are NOT sent back to the API but update the UI in real-time

---

## 3. The Tool System (~17 core tools + MCP)

### Tool Interface (reconstructed from usage)

Each tool is a plain object satisfying this interface pattern:

```typescript
interface Tool<T extends z.ZodType> {
  name: string
  inputSchema: T
  isReadOnly(): boolean
  isEnabled(): Promise<boolean>
  needsPermissions(input): boolean
  description(input?): Promise<string>
  prompt(): Promise<string>
  userFacingName(): string
  renderToolUseMessage(input, context): string
  renderToolUseRejectedMessage(): React.ReactNode
  validateInput(input, context): Promise<ValidationResult>
  *call(input, context, canUseTool): AsyncGenerator<Message>
  renderResultForAssistant(data): unknown
}
```

### Tool Categories

| Category | Tools |
|----------|-------|
| **File Operations** | FileReadTool, FileEditTool, FileWriteTool, NotebookReadTool, NotebookEditTool |
| **Search** | GlobTool (pattern), GrepTool (content), LSTool (listing) |
| **Execution** | BashTool (command execution) |
| **Sub-agents** | AgentTool (spawn sub-agents), ArchitectTool (codebase analysis) |
| **Thinking** | ThinkTool (extended thinking), StickerRequestTool |
| **Memory** | MemoryReadTool, MemoryWriteTool (ANT-only, disabled by default) |
| **Extensibility** | MCPTool (any MCP server) |

### Permission-Gated Tool Execution

The `checkPermissionsAndCallTool` function in `query.ts` handles the full lifecycle:

1. **Zod validation** — Input types validated before any logic runs
2. **Custom validation** — Each tool can implement `validateInput()` for semantic checks
3. **Permission check** — `canUseTool` hook checks project config (`allowedTools`)
4. **Execution** — Tool's `call()` generator yields results
5. **Error handling** — Errors formatted and returned as `tool_result` with `is_error: true`

### BashTool Security

BashTool has the most sophisticated permission system:
- **Banned commands** — Hardcoded blocklist
- **Command prefix analysis** — Uses Haiku to classify command intent
- **Subcommand permission chains** — `git commit` and `git push` are separate permissions
- **Command injection detection** — Flags potential injection patterns
- **Session-only vs persistent permissions** — File edit tools get session-only write permissions

---

## 4. Security Measures

### Permission Model

1. **Project-level allowed tools** — Stored in `.claude/settings.json`
2. **Permission flow:**
   - Read-only tools → generally allowed
   - BashTool → subcommand-level permission with prefix matching
   - File write tools → session-only permission, cleared on restart
   - Dangerous tools (Bash) → explicit user confirmation via UI dialog

3. **Permission dialog** — `useCanUseTool` hook shows React/Ink dialog with:
   - Tool description (generated by Haiku model)
   - Command prefix (for Bash)
   - "Allow once" / "Allow always" / "Reject" options
   - Risk scoring (logged to Statsig)

4. **DangerouslySkipPermissions flag** — Bypasses all permission checks (for testing/automated use)

### Malicious Code Detection

System prompt includes explicit instructions:
- Refuse to write malicious code
- Check filenames/directory structure before working
- Refuse if code appears malware-related

### Data Handling
- API key stored via OAuth, validated on startup
- Cost tracking per-session stored in project config
- Message logs stored with session ID (can be disabled)
- 30-day retention for feedback transcripts

---

## 5. Context Management

### Context Sources (gathered at session start)

```typescript
getContext(): {
  directoryStructure  // ls -R (1-second timeout, truncated)
  gitStatus           // branch, status, recent commits, user's commits
  codeStyle           // from CLAUDE.md
  claudeFiles         // paths to all CLAUDE.md files found
  readme              // README.md content (memoized)
  custom context      // user-defined key-value pairs
}
```

### CLAUDE.md System

A powerful pattern: `CLAUDE.md` in any directory is auto-discovered and added to context:
- Stores frequently used bash commands
- Records code style preferences
- Maintains codebase structure notes
- Agent proactively suggests adding info to CLAUDE.md during sessions

### Message Normalization

All messages go through `normalizeMessagesForAPI()` before being sent to the API:
- Removes internal-only `ProgressMessage` types
- Converts `tool_result` blocks to API format
- Handles synthetic messages (INTERRUPT, CANCEL, REJECT)

---

## 6. Multi-Agent / Sub-Agent System

### AgentTool

Allows the main agent to **spawn sub-agents** for parallel task execution:

```typescript
// In AgentTool/prompt.ts
export async function getAgentTools(dangerouslySkipPermissions): Promise<Tool[]> {
  return (await getTools()).filter(_ => _.name !== AgentTool.name)
}
// Note: "No recursive agents, yet.." — sub-agents cannot spawn further agents
```

Key constraints:
- Sub-agents get a **filtered tool set** (no recursive AgentTool)
- If `dangerouslySkipPermissions=false`: read-only tools only (no Bash, no file writes)
- If `dangerouslySkipPermissions=true`: full tool access
- **Stateless**: each agent invocation has no memory of prior calls
- Agent prompt must be **highly detailed** since no back-and-forth is possible
- **Concurrent agents** are encouraged: "use a single message with multiple tool uses"

### ArchitectTool

A specialized sub-agent with **restricted filesystem tools** only (no Bash, no file writes):
- Uses: LSTool, FileReadTool, FileWriteTool, GlobTool, GrepTool
- Used for deep codebase analysis without side effects
- Disabled by default (`isEnabled() => false`)

### Message Log Sidechains

Each sub-agent gets a unique "sidechain" log number to avoid conflicts:
```typescript
const getSidechainNumber = memoize(() =>
  getNextAvailableLogSidechainNumber(messageLogName, forkNumber),
)
```

---

## 7. IDE Bridge / MCP System

### MCP (Model Context Protocol) Integration

- Claude Code acts as an **MCP client**
- MCP servers are configured in `.mcprc` or project config
- Dynamic tool registration: `getMCPTools()` fetches tools from all configured MCP servers
- Tools loaded lazily at startup
- Supports both `stdio` and `SSE` transport

```typescript
// MCP tool registration
const tools = [...getAllTools(), ...(await getMCPTools())]
```

### VS Code Extension Bridge (referenced)

The system mentions a bidirectional IDE bridge via JWT-authenticated channels, connecting CLI to VS Code / JetBrains extensions. This enables the "Claude in your editor" experience.

---

## 8. Key Patterns for AI Agent Implementation

### Pattern 1: AsyncGenerator Streaming Loop

The core loop uses AsyncGenerator for non-blocking streaming:
```typescript
async function* query(...) {
  const response = await querySonnet(...)
  yield response  // Immediate yield for UI update
  
  for await (const toolResult of runToolsSerially(...)) {
    yield toolResult  // Real-time progress
  }
  
  // Recursive continuation
  yield* await query(accumulatedMessages, ...)
}
```

### Pattern 2: Permission Hook

Permission checking is abstracted into a `CanUseToolFn` hook, making it:
- Reusable across tools
- Pluggable (can be swapped for testing)
- UI-aware (triggers React state updates for dialogs)

### Pattern 3: Tool as Generator

Tools are generators that can yield progress during execution:
```typescript
async *call(input, context, canUseTool) {
  yield { type: 'progress', content: 'Starting...' }
  // ... long operation
  yield { type: 'result', data: result }
}
```

### Pattern 4: Context Memoization

Context gathering (git status, directory structure) is memoized to avoid re-computation:
```typescript
export const getGitStatus = memoize(async (): Promise<string | null> => {...})
export const getDirectoryStructure = memoize(async function (): Promise<string> => {...})
```

### Pattern 5: Configuration Scoping

Tools and settings support multiple scopes:
- `project` — per-project `.claude/settings.json`
- `global` — `~/.claude/settings.json`
- `mcprc` — `.mcprc` file for MCP servers

### Pattern 6: Lazy Loading Heavy Dependencies

OpenTelemetry, gRPC, Sentry are lazy-loaded to keep startup fast:
```typescript
// Sent via dynamic import in initSentry()
export function initSentry() { /* loaded on demand */ }
```

---

## 9. UI Architecture (Ink/React)

The terminal UI is built with **Ink** (React for CLI):

- `screens/REPL.tsx` — Main screen with message history, input, permission dialogs
- `components/` — Reusable UI components (Message, PermissionRequest, Spinner, etc.)
- `components/permissions/` — Permission request dialogs
- `components/binary-feedback/` — Binary feedback UI for internal testing

The REPL screen manages:
- Message history (with virtualization for long conversations)
- Permission dialogs (blocking modal UI)
- Prompt input (with arrow key history)
- Cost display (shown on exit)
- Message forking/resume (conversation recovery)

---

## 10. Slash Commands (~20 commands)

Located in `src/commands/` and `src/commands.ts`:

| Command | Purpose |
|---------|---------|
| `/help` | Show help |
| `/compact` | Compact context to continue long conversations |
| `/init` | Initialize new project |
| `/bug` | Report a bug |
| `/clear` | Clear conversation |
| `/config` | Configure settings |
| `/cost` | Show cost tracking |
| `/doctor` | Run diagnostics |
| `/login` / `/logout` | Authentication |
| `/resume` | Resume previous conversation |
| `/review` | Code review |
| `/pr_comments` | View PR comments |
| `/onboarding` | First-time setup |
| `/terminalSetup` | Terminal configuration |
| `approvedTools` | Manage approved tools |

---

## 11. Cost Tracking

```typescript
// Token cost calculation (from claude.ts)
HAIKU_COST_PER_MILLION = $0.8 input / $4 output
SONNET_COST_PER_MILLION = $3 input / $15 output
CACHE_WRITE = $1 / $3.75 per million
CACHE_READ = $0.08 / $0.30 per million (90-95% discount)
```

Prompt caching is used extensively:
```typescript
const PROMPT_CACHING_ENABLED = !process.env.DISABLE_PROMPT_CACHING
```

---

## 12. Potential OpenClaw Improvements

Based on this analysis, several patterns are directly applicable to OpenClaw:

### High Priority

1. **AsyncGenerator-based tool loop** — Replace polling-based loops with AsyncGenerator streaming for real-time UI feedback and better concurrency control

2. **Permission hook abstraction** — Implement a `CanUseToolFn` pattern so permission logic is decoupled from tool execution and testable in isolation

3. **Tool-as-generator model** — Allow tools to yield progress during execution (streaming output, intermediate results) rather than blocking until complete

4. **CLAUDE.md context pattern** — Implement per-directory `.md` files that auto-load into context for project-specific instructions, commands, and preferences

5. **Read-only vs write tool separation** — Implement concurrency optimization by distinguishing read-only tools (can run parallel) from write tools (must run serial)

6. **Zod schema validation everywhere** — Every tool input, API response, and config file should be validated with Zod

### Medium Priority

7. **Binary feedback mechanism** — For internal/automated testing, run parallel queries and present choices (could be useful for OpenClaw's self-verification)

8. **Memoized context gathering** — Git status, directory structure, and other expensive operations should be memoized per session

9. **MCP protocol integration** — Support MCP for extensible tool integrations (Anthropic's standard)

10. **Cost tracking with session persistence** — Track API costs per session, persist to project config for budgeting

11. **Slash commands as first-class system** — `/compact`, `/help`, `/resume` etc. provide discoverable, structured interactions

### Lower Priority

12. **Ink/React terminal UI** — React-based terminal UI is complex but enables rich, component-based CLI interfaces

13. **Sidechain message logs** — For sub-agent tracking and conversation recovery

14. **VCR recording for testing** — Record and replay API calls for deterministic testing

---

## 13. Summary

Claude Code's architecture reveals a **mature, production-grade agentic system** with careful attention to:

- **Reliability** — AsyncGenerator loops, retry logic, error boundaries, conversation recovery
- **Security** — Layered permission system, malicious code detection, data retention controls
- **UX** — Streaming UI, permission dialogs, cost tracking, conversation management
- **Extensibility** — MCP protocol, tool registry pattern, lazy-loaded modules
- **Observability** — Statsig feature flags, Sentry error tracking, structured logging

The most important architectural insight is the **AsyncGenerator streaming loop** combined with the **permission-gated tool pattern** — these two patterns together enable reliable, safe, and interactive agent execution in a CLI environment.

The system is NOT a simple "chat wrapper" around an API — it's a sophisticated harness with its own execution model, permission system, context management, and UI layer.
