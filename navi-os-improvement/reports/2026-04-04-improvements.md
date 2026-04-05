# Navi OS - Proposta de Millores | 04/04/2026

**Hora:** 23:00 Europe/Madrid  
**Analista:** Navi OS Improvement Proposer

---

## Resum Executiu

Analitzats **8,982 línies** de codi en 35 fitxers. El codebase és funcional però presenta àrees de risc tècnic degut a la mida de certs components i l'absència d'estratègies de monitorització i cache.

**Codis font principals:**
- `Lab.jsx` — 765 línies (més complex)
- `Brain.jsx` — 671 línies
- `ProposalsBoard.jsx` — 636 línies
- `TaskPipeline.jsx` — 491 línies
- `Files.jsx` — 416 línies

**Tecnologia:** React 19 + Vite + Express backend (API a port 3001), lucide-react icons, marked per markdown.

---

## 5 Millores Prioritàries

### 1. Extreure `useTaskSync` com a Custom Hook

| Camp | Valor |
|------|-------|
| **Títol** | Extreure lògica de sincronització de TaskPipeline a un custom hook |
| **Àrea** | Components / TaskPipeline |
| **Tipus** | Refactor / Optimització |
| **Prioritat** | 🔴 ALTA |
| **Impacte** | Redueix TaskPipeline de 491 a ~300 línies. Permet reutilitzar la lògica de sync localStorage↔API en altres llocs. |
| **Passos** | 1. Crear `src/hooks/useTaskSync.js` amb la lògica de `useState` per tasks, drag&drop, retry, merge modal 2. Extreure `fetchTasks`, `syncTask`, `handleMerge` 3. Importar el hook a TaskPipeline.jsx 4. Verificar que drag-drop continua funcionant |
| **Risc** | Baix — es tracta d'un refactor intern, no canvia interfície |

---

### 2. Implementar Error Boundary Global amb Reporting

| Camp | Valor |
|------|-------|
| **Títol** | ErrorBoundary millorat + alerting quan hi ha errors |
| **Àrea** | Components / ErrorBoundary |
| **Tipus** | Bug Fix / Feature |
| **Prioritat** | 🔴 ALTA |
| **Impacte** | Actualment els errors es loguejen a console.error però no hi ha visibilitat. Un sistema de reporting permetria detectar problemes abans que Aleix els reporti. |
| **Passos** | 1. Crear `src/utils/errorLogger.js` que guardi errors a localStorage 2. Modificar ErrorBoundary per cridar `errorLogger.log(error, errorInfo)` 3. Afegir un indicator visual (badge vermell) a TopBar quan hi hagi errors recents 4. Botó a Settings per veure/netejar errors |
| **Risc** | Baix — no canvia comportament funcional |

---

### 3. Afegir `useDebounce` i optimitzar Brain.jsx (671 línies)

| Camp | Valor |
|------|-------|
| **Títol** | Optimitzar cerques de Brain amb debounce i memoització |
| **Àrea** | Modules / Brain |
| **Tipus** | Optimització |
| **Prioritat** | 🟡 MITJANA |
| **Impacte** | Brain té cerques que es disparen en cada keystroke. Amb debounce (300ms) s'eviten crides innecessàries a l'API. També memoïtzar resultats costosos. |
| **Passos** | 1. Crear `src/hooks/useDebounce.js` 2. Aplicar a la cerca de Brain en `onSearchChange` 3. Afegir `React.memo` o `useMemo` a components de resultats 4. Verificar que la cerca segueix sent fluida |
| **Risc** | Baix — millora rendiment i no canvia funcions |

---

### 4. Afegir persistència de preferències d'UI a Settings

| Camp | Valor |
|------|-------|
| **Títol** | Guardar preferències d'UI (collapsed sections, theme hints) a localStorage |
| **Àrea** | Components / Settings |
| **Tipus** | Feature |
| **Prioritat** | 🟡 MITJANA |
| **Impacte** | Quan Aleix reobre Navi OS, perde les seves preferències de UI (sections expandides, filtres actius, etc.). Persistir-les millora l'experiència d'usuari. |
| **Passos** | 1. Crear `src/hooks/useLocalPreferences.js` 2. Integrar a components principals (Lab, Brain, Ops) 3. Guardar estat de sidebar/collapsed sections 4. Mantenir backward compatibility (valors per defecte si no hi ha resguard) |
| **Risc** | Baix — feature additive, no trenca res |

---

### 5. Afegir Keyboard Shortcuts globals

| Camp | Valor |
|------|-------|
| **Títol** | Navegació ràpida amb teclado (G+O per Ops, G+B per Brain, etc.) |
| **Àrea** | App / UX |
| **Tipus** | Feature |
| **Prioritat** | 🟢 BAIXA |
| **Impacte** | Poder navegar entre mòduls sense tocar el ratolí accelera el workflow. És una millora d'eficiència per ús intensiu. |
| **Passos** | 1. Crear `src/hooks/useKeyboardShortcuts.js` 2. Implementar shortcuts: `G+O` → /ops, `G+B` → /brain, `G+L` → /lab, `G+P` → /proposals, `,` → obrir Settings 3. Mostrar tooltip/overlay breu en prémer `?` 4. Documentar a Settings > Keyboard Shortcuts |
| **Risc** | Baix — no interfereix amb funcionalitat existent |

---

## Deute Tècnic Observat

| Element | Descripció | Urgència |
|---------|------------|----------|
| **Lab.jsx (765 línies)** | Component massa gran. Necessita分手 a sub-components. | Alta |
| **Brain.jsx (671 línies)** | Mateix problema. Separar cerca de resultats. | Alta |
| **No hi ha tests** | Zero test coverage. Canvis grans poden trencar coses silenciosament. | Mitjana |
| **No hi ha TypeScript strict** | El projecte és JS pur. Afegir TypeScript gradualment reduiria bugs. | Baixa |
| **API a localhost:3001** | El backend és parcialment documentat a brain-api.ts. Cal documentar tots els endpoints. | Mitjana |

---

## Ordre d'Execució Recomanat

```
SETMANA ACTUAL (05/04/2026):
  1. Millora #2 (Error Boundary + Reporting) — quick win, alta visibilitat
  2. Millora #1 (useTaskSync hook) — redueix complexitat de TaskPipeline

SETMANA SEGÜENT:
  3. Millora #3 (Debounce a Brain) — optimització important
  4. Millora #4 (Persistència preferències) — feature útil

SETMANA 3:
  5. Millora #5 (Keyboard Shortcuts) — polish final
```

---

## Nota

Aquestes propostes priorizen **estalvi de temps de debug** i **estalvi de rendiment** per sobre de noves features. El codebase és sòlid però els components grans fan difícil mantenir-lo.

*Generat per Navi OS Improvement Proposer · 2026-04-04 23:00*
