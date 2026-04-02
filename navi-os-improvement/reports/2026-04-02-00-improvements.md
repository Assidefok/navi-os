### IMP-2026-04-02-01 — [ORIGINAL] PM Board - Drag & Drop de tasques

**Area:** Frontend / UX
**Type:** ux
**Priority:** 🟡 ALT
**Impact:** Mitjana | Permetre arrossegar tasques entre columnes del Kanban
**Risk:** Baix |millora de UX, fàcil rollback

**Implementation Steps:**
1. Investigar llibreria drag & drop (react-beautiful-dnd o similar)
2. Implementar drag handlers a PMBoard
3. Afegir feedback visual durant el drag
4. Persistir canvis a l'estat

**Source:** ProposalsBoard (prop-001)
**Original Status:** accepted
**Original Created:** 2026-03-30

---

### IMP-2026-04-02-02 — [ORIGINAL] Sistema de propostes de millora

**Area:** Workflow / Automation
**Type:** workflow
**Priority:** 🟡 ALT
**Impact:** Alta | Panell on suggerir i acceptar/denegar millores
**Risk:** Baix | Nou mòdul, fàcil afegir/remoure

**Implementation Steps:**
1. Crear ProposalsBoard.jsx a Ops
2. Implementar API endpoints CRUD
3. Afegir formulari de creació
4. Afegir beweg els bots a les columnes

**Source:** ProposalsBoard (prop-002)
**Original Status:** accepted
**Original Created:** 2026-03-31

---

### IMP-2026-04-02-03 — [ORIGINAL] TEST - Proposta AUTOMATICA

**Area:** AI / Testing
**Type:** test
**Priority:** 🟠 MITJANA
**Impact:** Baixa | Proposta de test
**Risk:** Baix | Només testing

**Implementation Steps:**
1. Crear proposta automàtica via sistema
2. Assignar a SAM com a chief
3. Posar en debat

**Source:** ProposalsBoard (prop-003)
**Original Status:** pending
**Original Created:** 2026-03-31

---

### IMP-2026-04-02-04 — [ORIGINAL] Idea → Debat amb Chief assignat

**Area:** Workflow / Automation
**Type:** automation
**Priority:** 🔴 ALT
**Impact:** Alta | Automatitzar debat quan s'accepta idea
**Risk:** Mitjà | Canvi de flow

**Implementation Steps:**
1. Detectar quan Idea passa a "accepted"
2. Crear proposta de debat automàticament
3. Assignar chief segons categorització
4. Notificar al chief

**Source:** ProposalsBoard (proposal-1774997595008)
**Original Status:** accepted
**Original Created:** 2026-03-31
