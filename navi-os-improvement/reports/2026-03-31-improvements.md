# Navi OS - Proposta de Millores
**Data:** 31/03/2026 | 23:00 CET
**Analista:** Navi Improvement System
**Versio Navi OS:** 0.0.0

---

## Analisi del Codibase

| Metrica | Valor |
|---------|-------|
| Total fitxers JS/JSX/CSS | 23 |
| Linies totals | ~13,557 |
| Modul ms gran | Brain.jsx (1,154 línies) |
| CSS ms gran | Brain.css (2,076 línies) |
| Darrers canvis (git) | Daily sync, Status fixes, Proposals, MissionControl UX |

### Àrees de Risc Identificades

1. **Modul Brain massiu** — 1,154 línies en un sol fitxer JSX. Cada subcomponent (fuzzy search, markdown renderer, security badge, session view, commit detail) està barrejat al mateix fitxer. Impossible de mantenir, impossible de testejar individualment.

2. **Duplicació d'APIs** — `/api/ideas` definit DOS cops a `server.js` amb implementacions diferents. El segon sobreescriu el primer. El mateix passa potencialment amb `/api/briefs`. Això causa comportament inesperat.

3. **execSync al camí crític** — L'endpoint `/api/system-metrics` utilitza `execSync` per obtenir CPU, memòria i disc de forma síncrona. Cada cop que un component demana mètriques es bloqueja el thread. A més, `execSync` a `/api/git-commit/:hash` per primer commit (sense ^) petarà.

4. **Polling absent** — Status, Sessions, Agents, Cron Health es carreguen un cop a `useEffect` i mai s'actualitzen. L'usuari veu dades estàtiques fins que fa refresh manual.

5. **CSS massiu i no estructurat** — Brain.css té 2,076 línies de CSS per a un sol modul. No hi ha sistema de design tokens (variables CSS per colors, espais, tipografies). Cada canvi de tema o variable és manual i perillós.

6. **Reflexió de mtime com a "last run" de cron** — El sistema de salut de cron utilitza `statSync(fullPath).mtime` com a "darrera execució". Això és el mtime del fitxer, no del darrer cron real. Si el cron ha petat o s'ha executat manualment, el valor és incorrecte.

7. **Dades d'ideas/proposals no persistides** — Hi ha dos endpoints d'ideas que no fan matching: un llegeix de `navi-os/src/data/ideas.json` i l'altre de `workspace/data/ideas.json`. Els proposals viuen a `workspace/data/proposals.json`.

8. **Npx a PM2 status** — `npx pm2 jlist` afegeix ~500-1000ms de latency. Podria usar l'API JSON directa de PM2 o `pm2 jlist` directament.

---

## Propostes de Millora (Prioritat Ms Alta)

---

### 1. Extraure subcomponents del Brain.jsx

| Camp | Valor |
|------|-------|
| **Titol** | Refactoritzar Brain.jsx: extreure subcomponents |
| **Area** | Brain module |
| **Tipus** | Refactor (no feature, no bug) |
| **Prioritat** | 1 (ms alta) |
| **Impacte** | Molt alt — facilita tota la resta de millores |
| **Estimacio** | 2-3h |

**Per què ara:** Brain.jsx a 1,154 línies és el coll d'ampolla principal. No es pot millorar res d'aquest modul sense primer reduir-lo. Cada新高 feature o bug fix en aquest fitxer és un risc.

**Passos d'implementacio:**

1. Identificar els subcomponents independents dins Brain.jsx:
   - `MarkdownRenderer` (renderitzacio marked + DOMPurify)
   - `SecurityBadge` (ja existeix com a funcio inline)
   - `FuzzySearch` (ja existeix com a funcio inline)
   - `MemoryFileItem` (renderitzacio d'un fitxer de memoria)
   - `BriefCard` (renderitzacio d'un brief)
   - `SessionMessage` (missatge individual de sessio)
   - `CommitDetail` (vista de detall d'un commit)
   - `GitLogEntry` (entrada a la llista de commits)

2. Moure cada un a `src/components/ui/` o `src/modules/brain/` com a fitxers propis

3. Mantenir l'estat principal a Brain.jsx (props drilling inicialment és acceptable)

4. Validar amb `npm run build` cada pas

**Risc:** Baix — és refactor pur, cap canvi de funcionalitat. Es perdrà git history del fitxer original però es guanyara molt en mantenibilitat.

---

### 2. Corregir APIs duplicades a server.js

| Camp | Valor |
|------|-------|
| **Titol** | Eliminar duplicacio d'endpoint `/api/ideas` |
| **Area** | server.js |
| **Tipus** | Bug fix |
| **Prioritat** | 2 |
| **Impacte** | Mitjà — comporta comportament erratic amb ideas |
| **Estimacio** | 30 min |

**Per què ara:** Hi ha dos `app.get('/api/ideas', ...)` a server.js (un llegeix de `navi-os/src/data/ideas.json` i l'altre de `workspace/data/ideas.json`). El segon sobreescriu el primer. Això causa que algunes idees no apareguin.

**Passos d'implementacio:**

1. Identificar les dues definicions a server.js (cercar `app.get('/api/ideas'`)
2. Unificar en una sola que llegeixi de `workspace/data/ideas.json` (consistent amb la resta de dades)
3. Eliminar l'altra definicio
4. Verificar que Proposals.jsx (Lab) i Brain.jsx segueixin funcionant

**Risc:** Molt baix — bug fix simple. Un dels dos endpoints mai s'executa actualment.

---

### 3. Substituir execSync per exec asíncron a system-metrics

| Camp | Valor |
|------|-------|
| **Titol** | Convertir system-metrics a async (eliminar execSync) |
| **Area** | server.js — /api/system-metrics |
| **Tipus** | Optimitzacio |
| **Prioritat** | 3 |
| **Impacte** | Mitjà — millora responsivitat de Status |
| **Estimacio** | 1h |

**Per què ara:** `execSync` bloqueja el thread principal d'Express. Cada request a `/api/system-metrics` espera que `top`, `free` i `df` acabin seqüencialment. En servidors amb I/O lent o càrrega, això acumula delays.

**Passos d'implementacio:**

1. Substituir `execSync` per `exec` amb callback o Promise
2. Executar les tres comandes en paral·lel amb `Promise.all`
3. Afegir timeout de 3s per comando (si una comanda peta, retornar dades parcials amb flag d'error)
4. Canviar el componente Status.jsx per fer polling cada 30s (amb `setInterval` dins `useEffect`)

**Risc:** Baix — canvi de impl sense canvi d'API.

---

### 4. Sistema de design tokens (variables CSS)

| Camp | Valor |
|------|-------|
| **Titol** | Afegir CSS custom properties (design tokens) |
| **Area** | App.css + Brain.css + globals |
| **Tipus** | Optimitzacio / Developer experience |
| **Prioritat** | 4 |
| **Impacte** | Alt — facilita canvis de tema i consistència |
| **Estimacio** | 1-2h |

**Per què ara:** Tot el CSS utilitza colors hardcoded. Quan Aleix vulgui canviar el tema (dark/light), haurà de tocar centenars de línies. Un sistema de tokens centralitzat ho redueix a canviar 10-20 variables.

**Passos d'implementacio:**

1. Crear `src/index.css` o seccio `:root` amb variables:
   ```css
   :root {
     --color-bg: #0f0f13;
     --color-surface: #1a1a22;
     --color-border: #2a2a35;
     --color-text: #e0e0e0;
     --color-accent: #7c3aed;
     --color-accent-2: #a78bfa;
     --space-1: 4px; --space-2: 8px; --space-3: 12px; ...
     --radius-sm: 6px; --radius-md: 10px; ...
   }
   ```
2. Substituir progressivament colors hardcoded a Brain.css, App.css, components
3. No cal substituir-ho tot de cop — substituir cls principals

**Risc:** Baix — canvi pur de CSS, cap funcionalitat canvia.

---

### 5. Afegir auto-refresh a Status i Cron Health

| Camp | Valor |
|------|-------|
| **Titol** | Implementar polling per a dades en temps real |
| **Area** | Status.jsx, Security.jsx |
| **Tipus** | Feature |
| **Prioritat** | 5 |
| **Impacte** | Mitjà — l'usuari no ha de fer refresh manual |
| **Estimacio** | 1h |

**Per què ara:** Actualment, quan es mostra Status o Security, les dades es carreguen un cop. Si un procés PM2 cau, un cron peta o una sessió s'obre, l'usuari no ho veu sense refresh manual. És una experiencia degradada.

**Passos d'implementacio:**

1. Afegir `useEffect` amb `setInterval` per cada seccio de Status:
   - Sistema: cada 10s
   - PM2: cada 15s
   - Agents: cada 30s
   - Sessions: cada 15s
   - Cron: cada 60s
2. Netejar intervals amb `clearInterval` al cleanup de `useEffect`
3. Mostrar un indicator visual subtil quan s'està refresh (p.ex. el boto "Actualitzar" mostra un spinner)
4. Mantenir el boto manual "Actualitzar" per si es necessita forçar

**Risc:** Molt baix — feature additive, no canvia res existent.

---

## Resum Executiu

| # | Millora | Tipus | Prioritat | Temps |
|---|---------|-------|-----------|-------|
| 1 | Refactoritzar Brain.jsx (extreure subcomponents) | Refactor | 1 | 2-3h |
| 2 | Eliminar duplicacio /api/ideas | Bug | 2 | 30 min |
| 3 | system-metrics: async exec | Optimitzacio | 3 | 1h |
| 4 | Design tokens CSS | DX | 4 | 1-2h |
| 5 | Polling a Status/Cron | Feature | 5 | 1h |

**Total estimacio:** ~6-7.5h de feina.

**Recomanacio:** Fer #2 primer (30 min, impacte rpid). Després #1 en parallel (~2-3h block). Després #3, #4, #5 en qualsevol ordre (~1h cadascun).

---

*Generat automàticament per Navi Improvement System | 2026-03-31 23:00*
