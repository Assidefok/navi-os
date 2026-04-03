# Proposta de Millores Navi OS — 2026-04-02 (Nocturna)

**Analista:** Navi OS Improvement Proposer  
**Data:** 2026-04-02  
**Hora:** 23:00 (Europe/Madrid)  
**Versio Navi OS:** 0.0.0 (build activa)

---

## Analisi de Salut del Codi

### Components mes grans (linies)

| Fitxer | Linies | Estat |
|--------|--------|-------|
| modules/Ops.jsx | 934 | CRITIC - cal refactor urgent |
| modules/Lab.jsx | 765 | CRITIC - cal split |
| ProposalsBoard.jsx | 636 | GRAN - acceptable |
| AutomationsBoard.jsx | 457 | GRAN |
| components/Files.jsx | 416 | MITJANA |
| ChiefsCouncil.jsx | 413 | MITJANA |
| components/Status.jsx | 405 | GRAN |
| modules/Brain.jsx | 400 | GRAN |
| components/TaskPipeline.jsx | 283 | OK |
| components/Sync.jsx | 322 | GRAN |

### Analisi de CSS

| Fitxer | Linies | Estat |
|--------|--------|-------|
| modules/Ops.css | 1176 | CRITIC - massa gran |
| AutomationsBoard.css | 954 | CRITIC - massa gran |
| modules/Lab.css | 928 | CRITIC - massa gran |
| modules/MissionControl.css | 830 | CRITIC - massa gran |
| ProposalsBoard.css | 660 | GRAN |

**Total CSS:** 11,470 línies entre 28 fitxers. No hi ha design tokens, colors hardcoded arreu.

### server.js (2,488 línies)

- `execSync` usat a 18 llocs per comandos del sistema (git, top, free, df, pm2, openclaw)
- **Cap timeout en cap `execSync`** — un comando blocant pot penjar el servidor
- 0 ús de `async/await` al server (tot sincron)
- No hi ha caching de respostes (metrics, git log, pm2)
- 0 request validation

### API / Frontend Integration

- `TaskPipeline` fa fetch a `/api/pm-board` i `/api/pm-board/:id`
- No hi ha retry logic — si el server tarda, l'usuari veu error
- No hi ha loading skeleton real (només text "Carregant...")
- `marked` + `DOMPurify` importats directament a Lab.jsx — duplicable

### Dependencies

- React 19.2.4 (最新)
- Express 5.2.1 (beta! experimental en produccio)
- marked 17.0.5 (最新)
- PM2 6.0.14 (ok)
- **Express 5 encara en beta** — risc per a produccio

### Tech Debt detectada

1. **Express 5 en produccio** — API server usa versio beta
2. **execSync everywhere** — bloqueja event loop, sense timeouts
3. **No CSS architecture** — 11.4k línies CSS sense sistema
4. **Lab.jsx 765 línies** — component gegant impossible de mantenir
5. **Ops.jsx 934 línies** — el pitjor offender
6. **No loading skeletons** — UX pobra durant càrrega
7. **No error retry** — TaskPipeline mor si API cau
8. **Duplicació renderMarkdown** — logic copiada a cada lloc

---

## Millores Proposades (per prioritat)

---

### NAVIOS-2026-04-02-01 — Express 5 → Express 4 (production stability)

**Area:** Backend / Dependencies  
**Type:** bug  
**Priority:** 🔴 CRITICA  
**Impact:** Alta | Express 5.2.1 és beta. Risc de crash inesperat en produccio.  
**Risk:** Baix | Canvi de versio trivial, API compatible

**Implementation Steps:**
1. `cd /home/user/.openclaw/workspace/navi-os && npm install express@^4.21.0 --save`
2. Verificar que `npm run dev:server` arrenca sense errors
3. Testejar endpoints: `/api/pm-board`, `/api/ideas`, `/api/backups`
4. Validar que el proxy de Vite segueix funcionant

**Why Critical:** Express 5 encara és "beta" segons npm. No s'hauria d'usar en un sistema de negoci.

---

### NAVIOS-2026-04-02-02 — Split Ops.jsx (934 línies → 6 components)

**Area:** Frontend / Architecture  
**Type:** optimization  
**Priority:** 🔴 CRITICA  
**Impact:** Alta | Ops.jsx és actualment el component mes fragil del projecte. Un canvi accidental pot trencar tot Ops.  
**Risk:** Mitjà | Cal refactor cuidat, massa logic barrejada

**Implementation Steps:**
1. Crear `/src/modules/Ops/sections/` amb: `Dashboard.jsx`, `TaskSection.jsx`, `StandupSection.jsx`, `ChiefsSection.jsx`, `ProposalSection.jsx`, `AutomationSection.jsx`
2. Moure cada seccio com a sub-component independent
3. Ops.jsx passa a ser un router/tab manager minimal (objectiu: <100 línies)
4. Extreure CSS a `Ops/sections/*.css` progressivament
5. Mantenir git commit per rollback si cal

**Estimated:** 4-6 sub-components nous

---

### NAVIOS-2026-04-02-03 — Async exec amb timeouts a server.js

**Area:** Backend / Performance  
**Type:** optimization  
**Priority:** 🟠 ALTA  
**Impact:** Alta | execSync sense timeout pot bloquejar el server indefinidament. Especialment problemàtic per `openclaw status` (timeout 30s).  
**Risk:** Baix | Canvi d'estructura, mantenint compatibilitat API

**Implementation Steps:**
1. Convertir `execSync` a `exec` async amb Promises
2. Afegir `{ timeout: 5000 }` a tots els exec (excepte backup: 120000)
3. Envolar cada endpoint en try/catch propi
4. Crear helper `execAsync(cmd, timeoutMs = 5000)` al server
5. Substituir tots els `execSync` un a un

**Files afectats:** `server.js` (18 llocs)

---

### NAVIOS-2026-04-02-04 — Loading Skeletons i Error Retry a TaskPipeline

**Area:** Frontend / UX  
**Type:** feature  
**Priority:** 🟡 ALT  
**Impact:** Mitjana | UX pobra quan l'API triga o falla. Fallback a localStorage és acceptable pero no visible.  
**Risk:** Baix | Només millora visual, no canvia logica de negoci

**Implementation Steps:**
1. Substituir "Carregant..." text per skeleton amb CSS (`.skeleton-row`)
2. Afegir retry button estilitzat a error state (no el `<button>` HTML basic)
3. Mostrar banner "Sincronitzant des de localStorage..." quan API cau
4. Afegir toast/notification quan sync recuperi connectivitat
5. Afegir `maxRetries: 3` amb backoff a `fetchTasks()`

**Files afectats:** `TaskPipeline.jsx`, `TaskPipeline.css`

---

### NAVIOS-2026-04-02-05 — CSS Architecture: Design Tokens + Split

**Area:** Frontend / Architecture  
**Type:** optimization  
**Priority:** 🟠 MITJANA  
**Impact:** Alta | 11.4k línies CSS sense tokens = canvis de color/imatge impossibles. Cada component redefinix colors.  
**Risk:** Baix | Nou sistema paral·lel, no trenca res existent

**Implementation Steps:**
1. Crear `/src/styles/tokens.css` amb CSS custom properties (`:root`):
   - Colors: `--navi-bg`, `--navi-surface`, `--navi-accent`, `--navi-text`, `--navi-border`, `--navi-success`, `--navi-warning`, `--navi-error`
   - Spacing: `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`
   - Typography: `--font-size-sm`, `--font-size-base`, `--font-size-lg`
2. Importar `tokens.css` a `index.css`
3. Substituir colors hardcoded a `Ops.css` i `Lab.css` (fitxers mes grans) com a proof-of-concept
4. No refactor massiu — fer-ho component a component

---

## Resum Executiu

| # | Millora | Prioritat | Tipus | Esforç |
|---|---------|-----------|-------|--------|
| 01 | Express 5 → 4 | 🔴 CRITICA | bug | Baix |
| 02 | Split Ops.jsx | 🔴 CRITICA | optimization | Mitjà |
| 03 | execSync → async + timeouts | 🟠 ALTA | optimization | Mitjà |
| 04 | Loading skeletons + retry | 🟡 ALT | feature | Baix |
| 05 | CSS Design Tokens | 🟠 MITJANA | optimization | Mitjà |

**Recomanacio:** Executar #01 immediatament (5 min). Despres #02 (major impacte estructural). #03 i #04 en paral·lel. #05 com a treball continu.

---

*Navi OS Improvement Proposer — 2026-04-02 23:00*
