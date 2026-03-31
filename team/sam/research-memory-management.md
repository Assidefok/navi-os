# Research: AI Agent Memory Management Systems
## For Aleix's Multi-Agent System (Navi + Chiefs)

**Author:** SAM (Chief AI Officer)
**Date:** 2026-03-31
**Type:** Research Report

---

## 1. Executive Summary

**Bottom line:** For your use case (5 agents, Obsidian-style Markdown already in place, moderate scale), the best answer is **NOT binary (Markdown vs SQLite)**. The optimal solution is a **hybrid layered architecture** that:
- Keeps Markdown for human-readable content (daily logs, notes)
- Adds **SQLite as the query/retrieval index layer** (not the storage layer)
- Implements **automatic memory consolidation** so chiefs update their memories
- Uses **priority-based TTL decay** to manage content growth

**Key finding:** There are 372+ repositories on GitHub specifically for "agent-memory", and several are OpenClaw-native. This problem has been thoroughly solved in the open-source community.

---

## 2. Current State Analysis

Your current architecture:
```
workspace/
  MEMORY.md          ← Long-term curated memory (per agent)
  memory/YYYY-MM-DD.md ← Daily raw logs
  team/{elom,warren,jeff,sam}/  ← Chief-specific workspaces
    MEMORY.md
    index.json
```

**Pain points identified:**
1. Chiefs don't update memories automatically when learning new things
2. Content grows unbounded — no TTL, no decay, no prioritization
3. JSON index is flat — no semantic search, no hierarchy
4. No separation between short-term (session) and long-term (persistent) memory

---

## 3. Markdown + Index vs SQLite vs Vector DB

### Comparison Table

| Criteria | Markdown + JSON Index | SQLite | Vector DB (Chroma/PgVector) | Hybrid (Markdown + SQLite) |
|----------|---------------------|--------|----------------------------|----------------------------|
| **Human readability** | ✅ Excellent | ❌ Encrypted/binary | ❌ Embeddings only | ✅ Keep Markdown |
| **Semantic search** | ❌ Manual | ❌ Requires FTS5 | ✅ Native | ❌ Add embedding layer |
| **Scalability** | ❌ Degrades >100 files | ✅ Handles millions | ✅ Native | ✅ Good |
| **Auto-update triggers** | ❌ Manual | ✅ SQL triggers | ✅ Via API | ✅ Scriptable |
| **Setup complexity** | ✅ Already there | ⚡ Medium | ⚡ Medium | ⚡ Medium |
| **OpenClaw-native** | ✅ Native | ❌ Custom | ❌ Custom | ✅ Integratable |
| **Cross-agent sharing** | ⚡ Via files | ✅ Via schema | ✅ Via collections | ✅ Via schema |
| **Token optimization** | ❌ Loads all | ✅ Query selective | ✅ Query selective | ✅ Query selective |

### Verdict

**SQLite over Markdown-only is the right call** but NOT to replace Markdown — to *index* it. The architecture from `jzOcb/openclaw-memory-management` demonstrates this perfectly: keep Markdown as the source of truth, use SQLite + scripts for management/retrieval.

**Vector DBs are overkill** for your current scale (5 agents, moderate content volume) unless you add semantic/embedding search. If you want semantic search, consider adding it later as a layer on top.

---

## 4. Best Practices from Research

### 4.1 Short-term vs Long-term Memory Separation

From MemMachine, Memori, and MemOS research papers, the consensus architecture is **3-tier**:

```
┌─────────────────────────────────────────┐
│ WORKING MEMORY (per session)            │
│ - Current conversation context           │
│ - Loaded in every prompt                 │
│ - Max ~200 lines / 1,500 tokens          │
├─────────────────────────────────────────┤
│ EPISODIC MEMORY (cross-session)          │
│ - Summarized conversations               │
│ - Stored in SQLite/graph DB              │
│ - Queried on demand                      │
├─────────────────────────────────────────┤
│ PROFILE/SEMANTIC MEMORY (permanent)      │
│ - Facts, preferences, rules              │
│ - P0/P1/P2 priority with TTL             │
│ - Consolidated, not raw logs            │
└─────────────────────────────────────────┘
```

**For OpenClaw specifically:**
- `MEMORY.md` = Working + Profile Memory (hot, loaded every session)
- `memory/YYYY-MM-DD.md` = Episodic memory (raw, daily logs)
- `memory/lessons.jsonl` = Semantic memory (structured facts, searched)
- `memory/archive/` = Expired content (not loaded, searchable)

### 4.2 Memory Auto-Update Mechanisms

**This is the core problem — how to make agents update memories automatically.**

The community has converged on **lifecycle hooks + janitor scripts**:

**Approach A — Agent Lifecycle Hooks (Memori model)**
- Plugin intercepts after every LLM interaction
- Automatically extracts facts/preferences and stores them
- No agent willpower required — happens automatically
- Memori has an OpenClaw plugin: `openclaw plugins install @memorilabs/openclaw-memori`

**Approach B — Structured Output + Janitor Script (P0/P1/P2 model)**
- Agent is *expected* to write to `MEMORY.md` in structured format
- Janitor script (cron) runs daily:
  - Reads all `memory/` files
  - Applies TTL rules (P2=30d, P1=90d, P0=never)
  - Archives expired content
  - Consolidates lessons into `lessons.jsonl`
  - Updates index.json with new structure
- **Enforced discipline** over automatic magic

**Approach C — Memory-Like-A-Tree (Confidence-based)**
- Every knowledge block has a confidence score (0.0–1.0)
- Used knowledge → confidence goes UP
- Unused knowledge → confidence decays over time
- Below 0.3 → archived with essence extraction
- Nice metaphor: knowledge grows like a tree 🌳

### 4.3 Recommended for Your System

**Approach B + C hybrid** is best for OpenClaw because:
- You control the janitor script (no external dependency)
- P0/P1/P2 is simple to understand and implement
- Cron-based so it runs even if agents don't explicitly update
- Confidence decay handles the "chiefs don't update" problem passively

### 4.4 Retrieval Best Practices

From Memori benchmarks (LoCoMo benchmark, 81.95% accuracy at 1,294 tokens/query):
- **Structured memory >> flat context** — Store facts as structured records, not prose
- **Auto-recall beats manual injection** — The system should inject relevant context, not the agent
- **Session-aware** — Group memories by session, not just by date
- **Selective loading** — Only load what's relevant to current task (not entire history)

---

## 5. OpenClaw-Native Solutions Found

### 5.1 Directly Relevant Repos

| Repo | Stars | Description | Relevance |
|------|-------|-------------|-----------|
| [volcengine/OpenViking](https://github.com/volcengine/OpenViking) | 20.3k | Context database for AI agents (file-system paradigm, L0/L1/L2 tiered loading) | ⭐⭐⭐⭐⭐ OpenClaw explicitly mentioned |
| [jzOcb/openclaw-memory-management](https://github.com/jzOcb/openclaw-memory-management) | 37 | P0/P1/P2 + auto-archive, 78% token reduction | ⭐⭐⭐⭐⭐ Specifically for OpenClaw |
| [NevaMind-AI/memU](https://github.com/NevaMind-AI/memU) | — | Memory for 24/7 proactive agents (moltbot, clawdbot, openclaw) | ⭐⭐⭐⭐⭐ OpenClaw-specific |
| [MemTensor/MemOS](https://github.com/MemTensor/MemOS) | — | AI memory OS for LLM and Agent systems (moltbot, clawdbot, openclaw) | ⭐⭐⭐⭐ OpenClaw-specific |
| [EverMind-AI/EverMemOS](https://github.com/EverMind-AI/EverMemOS) | — | Memory OS for OpenClaw agents | ⭐⭐⭐⭐ OpenClaw-specific |
| [loryoncloud/Memory-Like-A-Tree](https://github.com/loryoncloud/Memory-Like-A-Tree) | 122 | Confidence-based lifecycle, auto-decay, Obsidian sync | ⭐⭐⭐⭐ Good fit |
| [MemoriLabs/Memori](https://github.com/MemoriLabs/Memori) | — | SQL-native, OpenClaw plugin available | ⭐⭐⭐⭐ Enterprise-grade |
| [MemMachine/MemMachine](https://github.com/MemMachine/MemMachine) | 5.4k | Universal memory layer, episodic + profile + working | ⭐⭐⭐ General purpose |
| [doobidoo/mcp-memory-service](https://github.com/doobidoo/mcp-memory-service) | 64 | MCP server for AI agent pipelines (LangGraph, CrewAI, AutoGen) | ⭐⭐⭐ MCP-compatible |
| [plastic-labs/honcho](https://github.com/plastic-labs/honcho) | — | Memory library for stateful agents | ⭐⭐⭐ Python-first |

### 5.2 Most Promising: OpenViking

OpenViking is specifically designed for OpenClaw and uses a **file-system paradigm**:
- **Hierarchical context** instead of flat vector storage
- **L0/L1/L2 tiered loading** — load on demand, reduce tokens
- **Directory recursive retrieval** — like a real filesystem
- **Visualized retrieval trajectory** — debuggable
- **Auto session management** — extracts long-term memory automatically

```bash
pip install openviking
```

### 5.3 Most Practical: openclaw-memory-management

The `jzOcb` repo is specifically for OpenClaw and solves exactly your problem:
- P0/P1/P2 priority system with TTL
- Auto-archive script (cron-based)
- Token reduction from 6,618 → 1,488 (-78%)
- Template + script ready to use

---

## 6. Concrete Recommendations

### 6.1 Immediate (No architecture change needed)

1. **Adopt P0/P1/P2 format** in all `MEMORY.md` files:
   ```markdown
   ## [P0] Core Identity — never expires
   ## [P1] Active projects — 90-day TTL  
   ## [P2] Temporary notes — 30-day TTL
   ```

2. **Install memory-janitor cron** from `jzOcb/openclaw-memory-management`:
   ```bash
   # Daily at 4 AM
   (crontab -l 2>/dev/null; echo "0 4 * * * python3 ~/.openclaw/workspace/scripts/memory-janitor.py >> ~/.openclaw/workspace/logs/memory-janitor.log 2>&1") | crontab -
   ```

3. **Enforce memory update discipline** — each chief MUST write a brief lesson to `memory/lessons/` after completing a significant task (even if the janitor handles it passively)

### 6.2 Short-term (Small changes, big impact)

4. **Add SQLite as the retrieval index** for `index.json`:
   - Keep Markdown as source of truth
   - Store metadata in SQLite (dates, tags, agent IDs, priority)
   - Query SQLite for fast retrieval, not full-text scan

5. **Implement per-chief memory hot path**:
   - Each chief's `MEMORY.md` = max 200 lines (enforced by janitor)
   - Older content goes to `memory/lessons.jsonl` 
   - Janitor summarizes and consolidates

### 6.3 Medium-term (If scale demands)

6. **Consider OpenViking** when content volume makes simple indexing insufficient
7. **Consider Memori plugin** (`@memorilabs/openclaw-memori`) for automatic fact extraction
8. **Add semantic search** via embeddings only when keyword search stops being sufficient

---

## 7. Implementation Proposal

### Phase 1: P0/P1/P2 + Janitor (1-2 hours)

```
workspace/
  scripts/
    memory-janitor.py      ← From jzOcb repo
  templates/
    MEMORY.md              ← P0/P1/P2 template
  memory/
    archive/               ← Expired content
    lessons/               ← Structured facts (.jsonl)
```

**Changes:**
- Add P0/P1/P2 tags to existing MEMORY.md content
- Install memory-janitor.py cron
- Create `memory/lessons/` directory for structured learning

### Phase 2: SQLite Index Layer (1 day)

```sql
CREATE TABLE memories (
  id INTEGER PRIMARY KEY,
  agent_id TEXT,          -- elom, warren, jeff, sam
  priority TEXT,          -- P0, P1, P2
  title TEXT,
  content TEXT,
  source_file TEXT,
  created_at DATETIME,
  expires_at DATETIME,
  accessed_at DATETIME,
  access_count INTEGER DEFAULT 0
);

CREATE INDEX idx_agent ON memories(agent_id);
CREATE INDEX idx_priority ON memories(priority);
CREATE INDEX idx_expires ON memories(expires_at);
```

**Benefits:**
- Sub-millisecond retrieval instead of scanning all Markdown files
- Filter by agent, priority, date range instantly
- Track access frequency for confidence scoring

### Phase 3: OpenViking Integration (If needed)

Only if Phase 1+2 prove insufficient after 3 months of real usage.

---

## 8. Answers to Concrete Questions

**Q: Is Markdown + indexes or SQLite better for this use case?**
A: **SQLite as index, Markdown as storage** — best of both worlds. SQLite gives you fast queries and structured data. Markdown stays human-readable for debugging and manual editing.

**Q: How to make agents update memories automatically?**
A: Three-pronged approach:
1. **Lifecycle hooks** — Memori plugin auto-extracts facts (zero agent effort)
2. **Cron janitor** — runs nightly, consolidates, archives, updates indexes (passive)
3. **Explicit prompts** — SOUL.md or AGENTS.md instructs chiefs to write to `memory/lessons/` after key decisions (active discipline)

**Q: Which structure is more scalable?**
A: **Layered (Markdown + SQLite + cron)** scales to ~10 agents and thousands of memories. For >10 agents or >100k memories, switch to OpenViking or MemMachine with graph DB backend.

---

## 9. References & Links

### GitHub Repos (Most Relevant)
- https://github.com/volcengine/OpenViking — Context DB for OpenClaw, file-system paradigm
- https://github.com/jzOcb/openclaw-memory-management — P0/P1/P2 for OpenClaw, 78% token reduction
- https://github.com/NevaMind-AI/memU — Memory for OpenClaw (moltbot, clawdbot, openclaw)
- https://github.com/MemTensor/MemOS — AI memory OS for OpenClaw
- https://github.com/EverMind-AI/EverMemOS — Memory OS for OpenClaw agents
- https://github.com/MemoriLabs/Memori — SQL-native, OpenClaw plugin, LoCoMo benchmark leader
- https://github.com/MemMachine/MemMachine — Universal memory layer, episodic + profile + working
- https://github.com/loryoncloud/Memory-Like-A-Tree — Confidence-based decay, Obsidian sync
- https://github.com/IAAR-Shanghai/Awesome-AI-Memory — Curated knowledge base on AI memory (372+ repos)

### Reddit (Search these manually — web scraping blocked)
- r/LocalLLM — search: "agent memory management", "multi-agent memory"
- r/LocalAI — search: "memory persistence", "context management"
- r/MachineLearning — search: "LLM memory architecture", "agent memory"

### Papers
- MemOS: An Operating System for Memory-Augmented Generation — arXiv:2507.03724
- Memori LoCoMo benchmark results — https://arxiv.org/abs/2603.19935

### OpenClaw Plugin Ecosystem
- `openclaw plugins install @memorilabs/openclaw-memori` — Memori OpenClaw plugin

---

## 10. Decision Matrix

| Scenario | Recommendation |
|----------|---------------|
| < 5 agents, < 500 memories | Keep Markdown + add P0/P1/P2 janitor |
| 5-10 agents, growing content | Add SQLite index layer |
| > 10 agents OR semantic search needed | Add OpenViking or MemMachine |
| Want zero-effort auto-memory | Use Memori plugin |
| Want full control, simple setup | jzOcb memory-janitor + P0/P1/P2 |

**For Aleix's current system:** Phase 1 (P0/P1/P2 + Janitor) + Phase 2 (SQLite index) is the right path. No need to change architecture fundamentally — evolve it.

---

*SAM — Chief AI Officer*
*Report compiled from GitHub research and open-source community best practices*
