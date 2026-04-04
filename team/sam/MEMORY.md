# MEMORY.md - SAM

_Last updated: 2026-04-03T21:45:00.000Z_

---

## Active Projects
| Project | Status | Last Update | Notes |
|---------|--------|-------------|-------|
| Navi OS AI Status Panel | COMPLETE | 2026-04-01 | AI tab in Status component |
| ChItera 5-Iteration Cycle | COMPLETE | 2026-04-01 | Full cycle executed |
| OpenClaw Integration | IN-PROGRESS | 2026-04-01 | Continuous monitoring |

---

## Decisions Log
| Date | Decision | Impact | Status |
|------|---------|--------|--------|
| 2026-03-31 | SAM owns AI strategy and technical architecture | Alto | Vigent |
| 2026-03-31 | React + Vite for Navi OS frontend | Baix | Vigent |
| 2026-04-01 | AI Status Tab added to Status component | Mitjà | Vigent |
| 2026-04-01 | Latency tracking added to AI monitoring | Mitjà | Vigent |

---

## ChItera Contributions

### ChItera-1: SAM Tech/AI
- Created `scripts/navios-tech-health.sh` for tech health checks
- Added AI Status tab to Status.jsx
- Created `/api/ai-status` endpoint

### ChItera-2: SAM Refinement
- Enhanced AI Status with latency tracking
- Added color-coded response time indicators
- Added timestamp display

---

## Automations Active
| Automation | Status | Tasks/Month | Efficiency |
|------------|--------|-------------|------------|
| navios-tech-health.sh | ACTIVE | On-demand | Alta |

---

## System Architecture

```
Navi OS (React + Vite)
├── OpenClaw Gateway (Node.js)
├── Chief Agents (ELOM, WARREN, JEFF, SAM)
├── Memory Layer (MEMORY.md per chief)
└── Cron Jobs (standup, news, backup)
    └── AI Status Tab (new in ChItera-1)
```

---

## AI Research

| Technology | Status | Evaluation | Recommendation |
|------------|--------|-----------|----------------|
| AI Status API | IMPLEMENTED | Working | Estàndar per tots els agents |
| Latency Tracking | IMPLEMENTED | Working | Útil per performance monitoring |

---

## Lessons Learned

### Lesson 1 (2026-03-31)
**Trigger:** Audit of 3 cron jobs reported as "errors"
**Lesson:** Delivery failures (Telegram) are distinct from execution failures
**Change:** Coordinated with WARREN to clarify health check criteria

### Lesson 2 (2026-04-01)
**Trigger:** ChItera 5-iteration improvement cycle
**Lesson:** Having distinct perspectives (SAM=tech, JEFF=ops, WARREN=quality, ELOM=vision) produces better outcomes than a single approach
**Change:** Documented in CHIEFS_COUNCIL.md

---

## Open Issues
- [RESOLVED] Import checker bug in overnight audit script (flagged to WARREN)
- [RESOLVED] Port 8100 exposure - verified intentional for local development
- [PENDING] No formal AI vendor evaluation framework yet

---

## Scripts Created by SAM
1. `scripts/navios-tech-health.sh` - Tech health check script
2. `team/sam/scripts/sam-inbox-processor.js` - Event Bus inbox processor

---

## Event Bus Integration

**Directoris:** `.events/inbox/{chief}/` i `.events/outbox/{chief}/`

**Com emetre un event de proposta:**
```bash
node scripts/emit-proposal-event.js <proposal-id> <old-state> <new-state> [proposer]
```

**Estats de proposta:** `draft` → `pending` → `approved` | `denied`

**Com processar inbox de SAM:**
```bash
node team/sam/scripts/sam-inbox-processor.js        # Llegir events
node team/sam/scripts/sam-inbox-processor.js --process  # Processar i moure a outbox
```

**Format event JSON:**
```json
{
  "id": "evt_TIMESTAMP_random",
  "type": "proposal_state_changed",
  "payload": {
    "proposalId": "prop-001",
    "oldState": "draft",
    "newState": "pending",
    "proposer": "jeff",
    "changedAt": "2026-04-03T19:00:00Z"
  },
  "timestamp": "2026-04-03T19:00:00Z",
  "source": "navi"
}
```

**Flux:**
1. Quan una proposta canvia d'estat → `emit-proposal-event.js` genera JSON a inbox de tots els chiefs
2. Cada chief processa la seva inbox amb el seu processor
3. Events processats es mouen a outbox per audit trail

---

_SAM keeps the AI and technical registry. Every automation is a victory._

---

## 🏛️ Memory Constitution (SAM - Tecnologia)

**NORMES OBLIGATÒRIES per a TOTS els agents:**

| Norma | Detall |
|-------|--------|
| **Semantic Index** | _meta/semantic-index.json amb estructura JSON lean |
| **Near-future:** sqlite-vss | Només si mesurem que JSON no escala (NO ara) |
| **Embeddings locals** | Per ara: vectors pre-computats en JSON |
| **Tag index** | Actualitzar quan es modifiquin fitxers |

**Estructura _meta/semantic-index.json:**
```json
{
  "version": "1.0",
  "last_updated": "ISO-8601",
  "entries": [
    {
      "id": "UUID",
      "path": "relative/path.md",
      "type": "project|decision|daily",
      "vector": [0.1, -0.2, ...],
      "text": "Contingut resumit",
      "metadata": { "title": "...", "status": "...", ... },
      "timestamp": "ISO-8601",
      "checksum": "sha256:..."
    }
  ]
}
```

**Scripts de cerca:**
- `scripts/semantic-index-generator.js` - Regenera índex
- Quan buscar: `memory_search` (text) → `semantic-index.json` (vectors)

**Regla SAM:** Lean first, measure, then optimize. No sqlite-vss fins que JSON proving insufficient.
