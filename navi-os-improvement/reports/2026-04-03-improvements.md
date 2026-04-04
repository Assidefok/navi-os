# Proposta de Millores Navi OS — 2026-04-03 (Nocturna)

**Autor:** Navi OS Improvement Proposer  
**Hora:** 23:00 (Europe/Madrid)  
**Versio codebase:** 28a41de (2026-04-03 02:04)

---

## Resum Executiu

Anàlisi estàtica completa del codebase Navi OS (31.037 línies de codi font en 42 fitxers). S'identifiquen 5 millores concretes. La tasca més urgent: eliminar localStorage de MorningBriefingPanel i fer-lo servir com a model per treure localStorage de tots els components restants.

---

## Anàlisi del Codice

### Components mes densos

| Fitxer | Linies | Tema |
|--------|--------|------|
| Lab.jsx | 765 | Monolític — 4 tabs en un sol fitxer |
| Brain.jsx | 671 | Monolític — 5 tabs en un sol fitxer |
| ProposalsBoard.jsx | 636 | Proposta pipeline |
| TaskPipeline.jsx | 491 | Kanban drag-drop |
| AutomationsBoard.jsx | 457 | Tauler automatitzacions |

### DUPLICACIONS detectades

1. **`renderMarkdown()`** — Idèntica a Lab.jsx i Brain.jsx (DUPLICAT SENZSER)
2. **`formatDate()`** — existeix a: Lab.jsx, Brain.jsx, Sync.jsx, Status.jsx, TaskPipeline.jsx (5 còpies!)
3. **`formatDateTime()`** — Brain.jsx i Sync.jsx

### localStorage EN USO (sense API)

| Component | Calafaix | Estatus |
|-----------|----------|---------|
| MorningBriefingPanel.jsx | proposals + deliverables | CRITIC |
| DeliverableTracker.jsx | STORAGE_KEY | Critica |
| TaskManager.jsx | STORAGE_KEY | Critica |
| TaskPipeline.jsx | Dual: API + localStorage backup | Mitjana |
| Ops.jsx | Tab order | Baixa |

### Problemes de estabilitat (server.js)

- **30+ execSync** crides sense timeout estructurat (alguns amb timeout però no tots)
- **execSync en request handler** — bloqueja event loop de Node.js
- **brain-api.ts** (TypeScript) existeix però **no s'importa a server.js** — el seu codi està duplicat manualment a server.js

### Tech debt notable

- Cap component fa servir React.memo o useMemo en llocs amb render costosos
- No hi ha loading states uniformes — alguns tenen skeleton, d'altres "Carregant..."
- No hi ha cap test (directori `tests/` buit o gairebé buit)

---

## Millora 1 — Eliminar localStorage de MorningBriefingPanel

**ID:** NAVI-OS-2026-04-03-01  
**Àrea:** MorningBriefingPanel.jsx  
**Tipus:** Bug fix  
**Prioritat:** CRITICA  
**Impacte:** Les propostes i deliverable counts no sobreviuen canvis de sessió ni es comparteixen entre finestres. Dades mostrades poden estar desactualitzades.  
**Passos d'implementació:**
1. Crear endpoint GET `/api/proposals/summary` a server.js que retorni `{ pending: N, alta: N, mitjana: N, baixa: N }` llegint de `data/proposals.json`
2. Substituir `useProposals()` (localStorage) per `fetch('/api/proposals/summary')`
3. Crear endpoint GET `/api/deliverables/summary?today=YYYY-MM-DD` que retorni `{ reviewToday, deliveredToday }`
4. Substituir `useDeliverables()` (localStorage) per crida a API
5. Mantenir fallback amb console.warn si API cau
**Risc:** Baix — canvi incremental, cap refactor massiu

---

## Millora 2 — Consolidar utils duplicades en `/src/utils/`

**ID:** NAVI-OS-2026-04-03-02  
**Àrea:** src/utils/ (nou directori)  
**Tipus:** Refactoritzacio  
**Prioritat:** ALTA  
**Impacte:** Redueix 5 còpies de `formatDate()` i 2 de `renderMarkdown()` a 1 cada una. Facilita manteniment i testejabilitat.  
**Passos d'implementació:**
1. Crear `src/utils/format.js` amb `formatDate(iso, opts)`, `formatDateTime(iso)`, `formatRelative(iso)` — fusionar les variants existents
2. Crear `src/utils/markdown.js` amb `renderMarkdown(text)` com a mixin de marked + DOMPurify
3. Substituir imports a Lab.jsx, Brain.jsx, Sync.jsx, Status.jsx, TaskPipeline.jsx
4. Substituir a ProposalsBoard.jsx i AutomationsBoard.jsx si també fan servir markdown
5. Verificar que no es trenca res amb `npm run build`
**Risc:** Baix — canvi mecànic de refs

---

## Millora 3 — Convertir execSync de server.js a exec amb timeouts

**ID:** NAVI-OS-2026-04-03-03  
**Àrea:** server.js  
**Tipus:** Estabilitat  
**Prioritats:** ALTA  
**Impacte:** Elimina blocking en request handlers. Servidor no es penja si un procés tarde massa. Millora temps de resposta sota càrrega.  
**Passos d'implementació:**
1. Substituir `execSync` per `util.promisify(exec)` envoltat en Promise amb timeout wrapper:
   ```js
   async function execCmd(cmd, timeoutMs = 5000) {
     return new Promise((resolve, reject) => {
       exec(cmd, { encoding: 'utf-8', timeout: timeoutMs, maxBuffer: 10*1024*1024 }, (err, stdout, stderr) => {
         if (err) reject(err); else resolve(stdout.trim())
       })
     })
   }
   ```
2. Convertir tots els endpoints que fan servir execSync (git show, git diff, git log, pm2 jlist, find, free, top...)
3. Canviar els handlers d'sync a `async/await`
4. Mantenir fallback amb try/catch i resposta 503 si el procés falla
5. Verificar que els 30+ endpoints segueixen retornant el mateix JSON
**Risc:** Mitjà — cal revisar cada endpoint individualment

---

## Millora 4 — Split Lab.jsx (765 línies) en components per tab

**ID:** NAVI-OS-2026-04-03-04  
**Àrea:** src/modules/Lab/  
**Tipus:** Refactoritzacio  
**Prioritat:** MITJANA  
**Impacte:** Facilita manteniment. Cada tab (overview, prototypes, logs, pipeline) tindrà el seu propi fitxer. Millora llegibilitat i testejabilitat.  
**Passos d'implementació:**
1. Crear directori `src/modules/Lab/tabs/`
2. Extreure `LabOverview` → `tabs/LabOverview.jsx`
3. Extreure `LabPrototypes` → `tabs/LabPrototypes.jsx` (nou — funcionalitat de prototypes)
4. Extreure `LabLogs` → `tabs/LabLogs.jsx` (ja existeix a src/modules/Lab/Logs.jsx — moure)
5. Extreure `LabPipeline` → `tabs/LabPipeline.jsx` (ja existeix parcialment)
6. Crear `Lab.jsx` com a shell que només gestiona tabs i routing intern
7. Importar utils de `src/utils/` (del improvement #2)
**Risc:** Mitjà — cal mantenir l'estat passat entre tabs (proposals, prototypes data)

---

## Millora 5 — Afegir AbortController a totes les crides fetch del frontend

**ID:** NAVI-OS-2026-04-03-05  
**Àrea:** Tots els components amb fetch  
**Tipus:** Estabilitat  
**Prioritat:** MITJANA  
**Impacte:** Evita request zombies, Memory leaks quan es desmunta component i request encara en vol. Codi mes robust.  
**Passos d'implementació:**
1. Crear `src/utils/api.js` amb wrapper:
   ```js
   export async function fetchAPI(url, opts = {}, timeoutMs = 10000) {
     const controller = new AbortController()
     const id = setTimeout(() => controller.abort(), timeoutMs)
     try {
       const res = await fetch(url, { ...opts, signal: controller.signal })
       clearTimeout(id)
       if (!res.ok) throw new Error(`HTTP ${res.status}`)
       return await res.json()
     } catch (e) {
       clearTimeout(id)
       if (e.name === 'AbortError') throw new Error(`Timeout: ${url}`)
       throw e
     }
   }
   ```
2. Substituir fetch() a: Status.jsx, Sync.jsx, TeamOverview.jsx, ChiefsCouncil.jsx, MorningBriefingPanel.jsx, Standups.jsx
3. Substituir fetch() a: Lab.jsx, Brain.jsx, ProposalsBoard.jsx, AutomationsBoard.jsx, TaskPipeline.jsx
4. Afegir try/catch als useEffect que fan fetch i mostrar error state en comptes de silenciar
**Risc:** Baix — canvi incremental

---

## Prioritat Total

| # | ID | Titol | Prioritat |
|---|-----|-------|-----------|
| 1 | NAVI-OS-2026-04-03-01 | Eliminar localStorage de MorningBriefingPanel | CRITICA |
| 2 | NAVI-OS-2026-04-03-02 | Consolidar utils duplicades | ALTA |
| 3 | NAVI-OS-2026-04-03-03 | execSync → async amb timeouts | ALTA |
| 4 | NAVI-OS-2026-04-03-04 | Split Lab.jsx en tabs | MITJANA |
| 5 | NAVI-OS-2026-04-03-05 | AbortController a totes les crides fetch | MITJANA |

---

## Dependencies

- Millora #2 ha de fer-se ABANS de #4 (Lab.jsx refactor necessita les utils consolidades)
- Millora #3 no té dependències — es pot fer en paral·lel

---

*Navi OS Improvement System — 2026-04-03 23:00*
