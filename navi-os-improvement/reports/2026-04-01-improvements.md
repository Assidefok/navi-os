# Proposta de Millores Navi OS — 2026-04-01 (Nit)

**Generada:** 2026-04-01 23:00 Europe/Madrid  
**Fase:** Anàlisi nocturn auto-gestionat  
**Base:** Anàlisi de git log, package.json, component complexity (wc -l), estructura de fitxers

---

## Anàlisi de Salut del Codi

| Indicador | Estat | Detalls |
|-----------|-------|---------|
| Components | 25 JSX + 23 CSS | Estructura sòlida, carregament lazy implementat |
| API Backend | Express + 1 server.js | ~400 línies, funcional però spaghetti |
| CSS | 3 fitxers >800 línies | Ops.css (1092), AutomationsBoard.css (954), MissionControl.css (830) |
| PM2 | 2 apps, config incorrecta | Tots dos apunten a server.js — un hauria de ser vite preview |
| execSync | 3+ crides | Bloquen l'event loop sota càrrega |
| Testing | 0 tests | Tècnicament detectat al commit `72036ff` |
| Dead code | brain-api.ts | Defineix API completa però mai s'importa |
| Markdown utils | duplicades | `renderMarkdown()` existeix a Brain.jsx i MissionControl.jsx |
| Fetch safety | sense timeout/abort | Tots els `fetch()` poden penjar indefinidament |
| Polling | manual, sense interval central | Status, Somiar polls amb useEffect + setInterval |

---

## Millores Proposades (per prioritat)

---

### IMP-2026-04-01-01 — PM2 Ecosystem Fix: Separar API i Vite

**Area:** DevOps / Deployment  
**Type:** bug  
**Priority:** 🔴 CRÍTIC  
**Impact:** Mitjà–Alt | L'API i el Vite share el mateix procés — quan un peta, l'altre es perd. En producció haurien de ser processos separats.

**Implementation Steps:**
1. Editar `ecosystem.config.cjs`
2. Crear script separat per Vite preview: `vite-preview.js` que fa `import 'vite/dist/node/cli.js';` o senzillament `spawn('npx', ['vite', 'preview', '--port', '8100'])`
3. PM2 app 1: `navi-os-api` → `server.js` (port 3001)
4. PM2 app 2: `navi-os-vite` → `vite-preview.js` (port 8100)
5. Actualitzar restart script a `package.json`

**Risk:** Baix | Canvi pur de configuració, fàcil rollback

---

### IMP-2026-04-01-02 — CSS Architecture: Split Ops.css i AutomationsBoard.css

**Area:** Frontend / CSS  
**Type:** optimization  
**Priority:** 🟡 ALT  
**Impact:** Baix–Mitjà | Facilita manteniment futur, no canvia funcionalitat

**Implementation Steps:**
1. Analitzar cada CSS > 800 línies per seccions lògiques
2. Ops.css → extreure: `ChiefsCouncil.css`, `Standups.css`, `Automations.css` (ja existeixen parcials)
3. AutomationsBoard.css → split en: `SomiarCard.css`, `AutomationItem.css`
4. MissionControl.css → split en: `SessionMessage.css`, `LiveFeed.css`
5. Importar nous CSS als respectius components
6. Eliminar CSS antic un cop verificat

**Risk:** Molt baix | Canvi pur de reorganització, verificable visualment

---

### IMP-2026-04-01-03 — Replace execSync amb exec (async) a server.js

**Area:** Backend / Performance  
**Type:** optimization  
**Priority:** 🟡 ALT  
**Impact:** Mitjà | execSync bloqeja el thread principal — sota càrrega pot causar timeouts HTTP

**Implementation Steps:**
1. Cercar totes les crides a `execSync` a `server.js`
2. Substituir per `exec` amb Promise wrapper:
   ```js
   const execAsync = (cmd) => new Promise((resolve, reject) => {
     exec(cmd, { timeout: 15000 }, (err, stdout, stderr) => {
       if (err) reject(err); else resolve(stdout);
     });
   });
   ```
3. Fer les funcions que les criden `async`
4. Verificar que totes les rutes segueixen funcionant (provar manualment amb curl)
5. Afegir try/catch amb res.status(500) per errors

**Risk:** Mitjà | Canvi de sync→async en rutes existents, verificar bé

---

### IMP-2026-04-01-04 — Consolidar Markdown Utils i Extreure Shared Components

**Area:** Frontend / Code Quality  
**Type:** optimization  
**Priority:** 🟡 ALT  
**Impact:** Baix | Elimina duplicació, facilita canvis futurs

**Implementation Steps:**
1. Crear `src/utils/markdown.js`:
   ```js
   import { marked } from 'marked';
   import DOMPurify from 'dompurify';
   marked.setOptions({ breaks: true, gfm: true });
   export function renderMarkdown(text) {
     if (!text) return null;
     try {
       return { __html: DOMPurify.sanitize(marked.parse(text)) };
     } catch { return { __html: `<pre>${text}</pre>` }; }
   }
   ```
2. Reemplaçar `dangerouslySetInnerHTML` a Brain.jsx, MissionControl.jsx
3. Eliminar funcions `formatDate`, `formatDateTime` duplicades a cada component → moure a `src/utils/format.js`
4. Verificar que el render segueix igual (comparar visualment abans/després)

**Risk:** Baix | Refactor local, fàcil verificar

---

### IMP-2026-04-01-05 — Afegir AbortController + Timeout a Tots els Fetch Calls

**Area:** Frontend / Reliability  
**Type:** bug  
**Priority:** 🟠 MITJÀ  
**Impact:** Mitjà | Sense timeouts, una API lenta penja la UI indefinidament

**Implementation Steps:**
1. Crear `src/utils/api.js` amb helper:
   ```js
   export async function fetchWithTimeout(url, options = {}, timeout = 8000) {
     const controller = new AbortController();
     const timer = setTimeout(() => controller.abort(), timeout);
     try {
       const res = await fetch(url, { ...options, signal: controller.signal });
       clearTimeout(timer);
       return res;
     } catch (e) {
       clearTimeout(timer);
       if (e.name === 'AbortError') throw new Error(`Timeout: ${url}`);
       throw e;
     }
   }
   ```
2. Substituir `fetch(` a: Status.jsx, Sync.jsx, SomiarSection.jsx, Standups.jsx, Logs.jsx, Brain.jsx, MissionControl.jsx, Inbox.jsx, AutomationsBoard.jsx
3. Afegir error state handler a cada component per mostrar missatge d'error user-friendly

**Risk:** Baix | Canvi de infraestructura de fetch, fàcil rollback

---

## Resum Executiu

| # | Millora | Prioritat | Tipus | Temps Est. |
|---|---------|-----------|-------|------------|
| 01 | PM2 Ecosystem Fix | CRÍTIC | bug | 30 min |
| 02 | CSS Split | ALT | optimization | 60 min |
| 03 | execSync → async | ALT | optimization | 45 min |
| 04 | Markdown Utils Consolidate | ALT | optimization | 30 min |
| 05 | Fetch AbortController | MITJÀ | bug | 45 min |

**Total estimat:** ~3.5 hores

**Ordre recomanada:** 01 → 03 → 04 → 02 → 05 (el CSS split és el més llarg però el més independent)

---

*Generat per Navi OS Improvement Proposer · 2026-04-01 23:00*
