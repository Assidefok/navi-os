# MEMORY.md - Long-Term Memory

_Last updated: 2026-04-01_

---

## Telegram Configuration
- **Chat ID:** 267107022
- **Username:** @Assidefok
- **Note:** Aleix's personal Telegram for direct messaging

---

## Active Rules (non-negotiable)

1. **Always respond in Catalan** when talking to Aleix
2. **NO Chinese characters** — standard Latin script only
3. **Ask before external actions** (emails, posts, public things)
4. **Navi OS port 8100** — never change

---

## Stable Preferences

- Aleix writes in Spanish (Windows voice dictation limitation)
- Aleix uses voice dictation from Windows session
- Aleix prefers concise, practical responses
- Aleix is systematic — builds incrementally

---

## About Aleix

- **Name:** Aleix
- **Age:** 36
- **Profession:** Industrial Electronic and Automatic Engineer
- **Background:** Self-taught since age 13 (first computer), trial-and-error learner
- **University:** Chose industrial electronic engineering over CS
- **Passions:** Technology, robotics, programming, electronics
- **Goals:**
  - Build OpenClaw implementation company
  - Continuous improvement with small apps
  - Find work in AI sector
  - Develop something meaningful

## Identity Reminders

- **I am Navi** (the fairy) - NOT Goat
- **Goat** = assistant from the ClearMUd course Aleix is following
- **Navi-OS** = the operating system I'm building
- Goat follows the course instructions; I maintain my fairy personality

---

## Memory Vault (Obsidian-style)

El sistema de memòria utilitza estructura estilo Obsidian per a la base de coneixement de notícies.

### Estructura
```
memory/
├── index.md                    # Vault principal
├── AI-News/
│   ├── index.md               # Índex categoria (Obsidian)
│   ├── index.json             # Índex machine-readable
│   └── YYYY-MM-DD-HH.MM.md   # Entrades individuals
├── World-News/
│   ├── index.md
│   ├── index.json
│   └── YYYY-MM-DD-HH.MM.md
└── Iran-War/
    ├── index.md
    ├── index.json
    └── YYYY-MM-DD-HH.MM.md
```

### Skills de Notícies
| Skill | Funció |
|-------|---------|
| `ai-news` | Notícies IA (HN, TechCrunch, The Verge) |
| `world-news` | Notícies mundials (BBC, Al Jazeera, Guardian, NYT) |
| `iran-war-news` | Guerra d'Iran (filtrat per keywords) |
| `brief-news` | Orquestrador de notícies |
| `morning-brief` | Compila brief per Telegram |

### Cron News (06:45)
```
75a20229-b033-4e82-8a8b-3757d9a781d1 - Brief News Orchestrator
```

### Retorn de Skills
- `OK` → Fitxer generat, index actualitzat
- `ERROR` → Ha fallat
- `NOT_EXECUTED` → Ja executat aquesta hora

## Current Projects

### Project Source of Truth
- **Operational source of truth:** `/home/user/.openclaw/workspace/PROJECT.md`
- Use `PROJECT.md` for current status, episode progress, decisions, open issues, and next steps
- `MEMORY.md` remains long-term stable memory, not the main operational tracker


### Navi OS (React + Vite)
- Personal operating system dashboard
- Location: /home/user/.openclaw/workspace/navi-os
- Port: 8100 (NEVER CHANGE)
- 3 modules: Ops (⚙️), Brain (🧠), Lab (🧪)
- Ops té 4 vistes: Mission Control, Org Chart, PM Board (Kanban), Task Manager
- OrgChart ara llegeix de `src/data/org-chart.js` (en comptes de hardcoded)
- USER.md té camp `visible` (bool, per defecte false) per controlar visibilitat a l'organigrama
- Navi ara és clickable a OrgChart (obre modal amb SOUL/IDENTITY/USER)
- AgentDetailModal i loadAgentDetailsFromWorkspace ara s'exporten de TeamOverview per reutilització
- Migrated from vanilla JS to React following Aleix's course
- Episode 1: COMPLETAT
- Episode 2: COMPLETAT (Mission Control, Org Chart, Task Manager, PM Boards, Brain, Lab)
- Status: Active development

### Trump Jr. Stock Tracker (FUTUR)
- Projecte guardat a: `/home/user/.openclaw/workspace/projects/trump-jr-tracker/`
- Objectiu:监控系统 i analitzar moviments bursàtils de Donald Trump Jr.
- Estat: PROPOSAT (31/03/2026)
- Analisi feta per ELOM + WARREN
- Veure README del projecte per detalls complets

### OpenClaw Implementation Business
- Aleix wants to build a business implementing OpenClaw for clients
- Looking for work in AI sector
- Building production-ready skeleton

### ClearMUd Bootcamp Progress
| Episode | Titol | Status |
|---------|-------|--------|
| 1 | AI-Powered Dashboard | ✅ Complet |
| 2 | Full Operating System | ✅ Implementat |
| 3 | Multi-Agent Team | 📋 Pendent |
| 4 | Automate Agents | 📋 Pendent |
| 5 | Production 24/7 | 📋 Pendent |

### Automation Setup (5 Cron Jobs)
| Job | Schedule |
|-----|----------|
| Repo Backup | Daily 02:00 |
| Overnight Audit | Daily 03:00 |
| Daily Brief | Daily 08:00 |
| Daily News | Daily 07:00 |
| Rolling Docs | Daily 23:00 |

Scripts: /home/user/.openclaw/workspace/scripts/
Rollback guide: /home/user/.openclaw/workspace/docs/ROLLBACK-GUIDE.md
Course videos: /home/user/.openclaw/workspace/course/video-reports.md

---

## Lessons Learned

- When Aleix says "remember", write it to a file — not mental notes
- Don't try to infer or repeat old tasks from prior chats
- Aleix corrects me directly (name = Aleix, not Alex)
- Windows voice dictation doesn't support Catalan → he writes Spanish, I respond Catalan
- Aleix wants practical, production-ready solutions not just proofs-of-concept
- Audit script `02-overnight-audit.sh` had 2 bugs: (1) `${path#../}` only stripped ONE `../` prefix, failing for multi-level paths; (2) didn't try `.jsx`/`.js` extensions when checking file existence. Both fixed. Always validate broken-import detections manually — the script produced 16 false positives.

---

## Workspace Structure

```
/home/user/.openclaw/workspace/
├── SOUL.md          # Identity and values
├── USER.md          # Aleix's profile
├── AGENTS.md        # Operational handbook
├── TOOLS.md         # Local environment notes
├── MEMORY.md        # This file
├── HEARTBEAT.md     # Periodic checks
├── navi-os/         # React OS dashboard (active)
│   └── src/
│       ├── components/  # TopBar, Dock
│       └── modules/     # Ops, Brain, Lab
├── Navi-OS/         # Old vanilla version (deprecated)
├── scripts/         # Automation scripts (4 crons)
├── docs/            # System reference, rollback guide
└── memory/          # Daily logs, backups, audits
```

---

## 10-Minute Setup Checklist (Session Start)

Run this to validate everything loads correctly:

- [ ] Read SOUL.md
- [ ] Read USER.md
- [ ] Check today/yesterday in memory/
- [ ] If main session: read MEMORY.md
- [ ] Verify Catalan responses enabled
- [ ] Verify NO Chinese characters
- [ ] Check Navi OS port 8100 is running
- [ ] Review HEARTBEAT.md for pending tasks

---

## Cron Jobs (Active)

To manage crons:
```bash
# List all crons
cron list

# Run immediately for testing
cron run <jobId>

# Check run history
cron runs --id <jobId>
```

| Job | Cron ID | Schedule | Purpose |
|-----|---------|----------|---------|
| Repo Backup | `546fb0ef-986e-4298-9b52-e7ef1796c596` | Daily 02:00 | Git push to private repo |
| Overnight Audit | `9a7ceea6-bcd7-4999-a2d5-d735ee78ed20` | Daily 03:00 | Self-improvement audit |
| Daily AI News | `dc4e5c01-6ea5-4317-8905-039f008aade1` | Daily 07:00 | AI news digest |
| Daily Brief | `4182fba8-0791-4016-a2b1-08fb81064fdb` | Daily 08:00 | Morning summary |
| Daily Standup | `1296613a-de11-4046-8944-2bd7b20fc71a` | Mon-Fri 08:30 | Multi-agent standup |
| Rolling Docs | `d7a060a0-dc95-4d6a-814a-6398248610b7` | Daily 23:00 | Update system docs |
| Navi OS Proposta | `ac451081-9ec2-40ff-b17c-4fbcc393c358` | Daily 23:00 | Propose improvements |
| Navi OS Execucio | `96af6cc3-b6aa-4d53-9ea8-6ea5ac0c6187` | Mon-Fri 09:00 | Execute improvements |

---

## PM2 Startup (Auto-resurrect)

PM2 manages Navi OS processes with auto-restart on reboot.

**Processes managed:**
| Name | Command | Port | Status |
|------|---------|------|--------|
| navi-os-api | `node server.js` | 3001 | online |
| vite | `node node_modules/vite/bin/vite.js --port 8100` | 8100 | online |

**Commands:**
```bash
# View status
npx pm2 list

# View logs
npx pm2 logs

# Restart all
npx pm2 restart all

# Auto-save after changes
npx pm2 save
```

**Auto-start on reboot:** crontab `@reboot cd /home/user/.openclaw/workspace/navi-os && npx pm2 resurrect`

---

_Review and update this file periodically (every few days during heartbeats)._
