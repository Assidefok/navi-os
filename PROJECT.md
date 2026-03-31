# PROJECT.md - Font única de veritat

_Last updated: 2026-03-31 Europe/Madrid_

## Objectiu actual
Completar l'Episodi 3 del bootcamp ClearMUd: Sistema Multi-Agent amb 4 Chiefs.

## Regla operativa
Aquest fitxer és la font única de veritat per a:
- estat del projecte
- progrés per episodis
- decisions
- incidències obertes
- següents passos

Altres fitxers serveixen de suport o historial:
- `MEMORY.md` = memòria estable i preferències
- `memory/*.md` = diari, logs i historial
- `team/DELEGATION-PLAYBOOK.md` = regles de delegació
- codi = implementació

---

## Episodi 3: Sistema Multi-Agent (EN PROGRÉS)

### Objectius Episodi 3
- [x] Crear 4 chief workspaces amb SOUL.md, IDENTITY.md, MEMORY.md, AGENTS.md, USER.md, TOOLS.md, BACKLOG.md, HEARTBEAT.md
- [x] Actualitzar org-chart.json amb els 4 chiefs (ELOM, WARREN, JEFF, SAM)
- [x] Crear DELEGATION-PLAYBOOK.md
- [ ] Registrar els 4 chiefs a OpenClaw gateway (heartbeats actius)
- [ ] Actualitzar PM Board per usar agents reals
- [ ] Construir sistema de standup autònom
- [ ] Verificar sistema complet

### Estructura Creada
```
team/
├── elom/      # Chief Visionary Officer (🚀 Elon Musk)
├── warren/    # Chief Quality Officer (📊 Warren Buffett)
├── jeff/      # Chief Operations Officer (⚡ Jeff Bezos)
├── sam/       # Chief AI Officer (🤖 Sam Altman)
├── meetings/  # Standup transcripts
└── DELEGATION-PLAYBOOK.md
```

### Chiefs Registrats (configs existents)
| Chief | ID | Heartbeat | Workspace |
|-------|-----|-----------|-----------|
| ELOM | elom | 120 min | /home/user/.openclaw/workspace/team/elom |
| WARREN | warren | 135 min | /home/user/.openclaw/workspace/team/warren |
| JEFF | jeff | 150 min | /home/user/.openclaw/workspace/team/jeff |
| SAM | sam | 180 min | /home/user/.openclaw/workspace/team/sam |

---

## Cron Jobs Actius (2026-03-31)

| Job | ID | Schedule | Status |
|-----|-----|----------|--------|
| Repo Backup | 546fb0ef | Daily 02:00 | ✅ ok |
| Overnight Audit | 9a7ceea6 | Daily 03:00 | ⚠️ error |
| Daily AI News | dc4e5c01 | Daily 07:00 | ⚠️ error |
| Daily Brief | 4182fba8 | Daily 08:00 | ✅ ok |
| **Daily Standup** | 1296613a | **8:30 AM weekdays** | 🆕 new |
| Rolling Docs | d7a060a0 | Daily 23:00 | ✅ ok |

### Nous Crons (2026-03-31)
| Job | ID | Schedule | Purpose |
|-----|-----|----------|---------|
| **BBQ Brand Research** | 5436545b | **In 2h (one-time)** | Deep market research |
| **Navi OS - Proposta Nocturna** | ac451081 | **Daily 23:00** | Proposa 5 millores |
| **Navi OS - Execució Diürna** | 96af6cc3 | **Daily 09:00 weekdays** | Implementa amb retry 3x |

---

## Projectes Actius

### Navi OS (React + Vite)
- **Location:** /home/user/.openclaw/workspace/navi-os
- **Port:** 8100 (NEVER CHANGE)
- **Estat:** Desenvolupament actiu
- **Episodis completats:** 1, 2
- **Episodi actual:** 3 (multi-agent)

### BBQ Brand
- **Location:** /home/user/.openclaw/workspace/projects/bbq-brand
- **Estat:** Recerca pendent (cron programat)
- **Objectiu:** Marca pròpia de barbacoes de disseny per Amazon

### Sistema de Millora Navi OS
- **Location:** /home/user/.openclaw/workspace/navi-os-improvement
- **Components:**
  - Proposta nocturna (23:00)
  - Execució diürna amb retry 3x (09:00)
  - Standup reports

---

## Bootcamp Status
| Episode | Titol | Status |
|---------|-------|--------|
| 1 | AI-Powered Dashboard | ✅ Complet |
| 2 | Full Operating System | ✅ Complet |
| 3 | Multi-Agent Team | 🔄 En curs |
| 4 | Automate Agents | 📋 Pendent |
| 5 | Production 24/7 | 📋 Pendent |

---

## Incidències Obertes

1. ⚠️ Overnight Audit cron error - cal revisar
2. ⚠️ Daily AI News cron error - cal revisar
3. [ ] Registrar chiefs a OpenClaw gateway (requereix configuració)
4. [ ] Verificar standup autònom funciona
5. [ ] Assignar tasques reals al PM board per als chiefs

---

## Decisions Preses (2026-03-31)

1. Es creen 4 chiefs basats en líders reals (Musk, Buffett, Bezos, Altman)
2. El routing map delega tasques segons tipus a chief appropriate
3. Standup autònom a les 8:30 AM dilluns-divendres
4. Sistema de millora Navi OS amb retry 3x abans de reportar error
5. BBQ Brand research via cron amb recerca profunda de mercat

---

## Pròximes Passos (Priority Order)

1. [ ] Verificar que el Daily Standup cron funciona (8:30 AM demà)
2. [ ] Revisar errors de Overnight Audit i Daily AI News
3. [ ] Testar el sistema de standup manualment
4. [ ] Assignar tasques reals als chiefs al PM board
5. [ ] Executar BBQ Brand research quan cron s'activi
6. [ ] Revisar primera proposta de millores Navi OS (demà al matí)

---

_Update this as the project evolves. Every significant change should be reflected here._
