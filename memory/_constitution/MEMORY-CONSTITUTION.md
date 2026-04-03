# MEMORY CONSTITUTION - Navi OS

_Last updated: 2026-04-02_

---

## 📜 LLEI SUPREMA

Aquest document defineix les **NORMES OBLIGATÒRIES** per a tots els agents i humans que interactuen amb el sistema de memòria de Navi OS.

**INCOMPLIMENT = ENTRADA INVÀLIDA = REJECTADA**

---

## 1. ESTRUCTURA DE CARPETES (Immutables)

```
memory/
├── _constitution/          # Aquest document i esquemes de validació
├── _meta/
│   ├── semantic-index.json    # Índex semàntic (auto-generat)
│   ├── daily-navimap.md       # Map diari d'activitat (auto-generat)
│   └── process-log.md         # Log de processos executats
├── _templates/             # Plantilles obligatòries
├── Projects/               # Projectes actius amb estat viu
├── Decisions/              # Decisions preses (source of truth)
├── Processes/              # Playbooks i procediments
├── Daily/                  # Registres diaris per data
├── _inbox/                 # Captura ràpida (vida màxima 7 dies)
├── _archive/               # Contingut antic (auto-mogut)
└── [Carpetes News]/        # AI-News, Iran-War, etc. (existents)
```

**REGLA 1.1:** NOMÉS crear fitxers a les carpetes autoritzades.
**REGLA 1.2:** Carpeta `Projects/` per projectes actius únicament.
**REGLA 1.3:** Carpeta `Decisions/` per decisions (mai al Daily/ ni als diaris).
**REGLA 1.4:** Carpeta `_inbox/` només per captura temporal (7 dies màx).

---

## 2. FRONTMATTER YAML (Obligatori)

### 2.1 Projects (`Projects/*/README.md`)

```yaml
---
id: "UUID-v4-obligatori"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
status: "in-progress" | "blocked" | "on-hold" | "done"
owner: "navi" | "elom" | "warren" | "jeff" | "sam" | "aleix"
blocker: "URL a issue/blocker o null"
priority: "critical" | "high" | "medium" | "low"
tags: ["tag1", "tag2"]
related-decisions: ["decision-id-1", "decision-id-2"]
related-projects: ["project-id-1"]
---
```

### 2.2 Decisions (`Decisions/*.md`)

```yaml
---
id: "UUID-v4-obligatori"
date: "YYYY-MM-DD"
decision: "Títol clar de la decisió"
impact: "high" | "medium" | "low"
status: "active" | "superseded" | "reverted"
context: "URL a context o descripció curta"
alternatives-considered: ["alt-1", "alt-2"]
---
```

### 2.3 Daily (`Daily/YYYY-MM-DD/notes.md`)

```yaml
---
date: "YYYY-MM-DD"
tags: ["daily", "tag1"]
summary: "Resum d'una línia del dia"
mood: "focused" | "scattered" | "tired" | "energized" | null
key-achievement: "El més important del dia"
---
```

### 2.4 Inbox (`_inbox/*.md`)

```yaml
---
created: "YYYY-MM-DDTHH:MM"
expires: "YYYY-MM-DD" (auto: created + 7 dies)
source: "aleix" | "navi" | "agent-{name}"
type: "thought" | "task" | "reference" | "question"
---
```

**REGLA 2.1:** TOT fitxer nou a Projects/, Decisions/, Daily/, _inbox/ **HA DE TENIR** frontmatter vàlid.
**REGLA 2.2:** Camps marcats com "obligatori" no poden ser null ni buits.
**REGLA 2.3:** Dates en format ISO-8601 (YYYY-MM-DD).
**REGLA 2.4:** UUIDs generats via `crypto.randomUUID()` o similar.

---

## 3. VALIDACIÓ AUTOMÀTICA (Enforcement)

### 3.1 Pre-commit Hook (Mental per agents)

Abans de crear qualsevol entrada, validar:

1. **Ruta vàlida:** ¿Està dins d'una carpeta autoritzada?
2. **Plantilla aplicada:** ¿S'ha usat la plantilla corresponent?
3. **Frontmatter complet:** ¿Tots els camps obligatoris estan presents?
4. **UUID únic:** ¿El ID no existeix ja a `_meta/semantic-index.json`?

### 3.2 Scripts de Validació (Auto-executats)

- **`validate-memory.js`** - Valida tots els fitxers .md del vault
- **`validate-frontmatter.js`** - Comprova YAML específic
- **`check-orphaned.js`** - Detecta entrades sense referències

---

## 4. CERCA - Prioritat de Motors

Quan un agent necessita buscar:

```
PRIORITAT 1 (Ràpida): memory_search (OpenClaw text)
PRIORITAT 2 (Estructural): _meta/semantic-index.json (vectors locals)
PRIORITAT 3 (Humana): ripgrep / grep (per Aleix)
```

**REGLA 4.1:** Per preguntes factuals recents (última setmana) → `memory_search`
**REGLA 4.2:** Per context ric, conceptes, "recorda quan..." → `semantic-index.json`
**REGLA 4.3:** Per a Aleix directament → `ripgrep` (línia de comandes)

---

## 5. INDEX SEMÀNTIC (`_meta/semantic-index.json`)

### 5.1 Estructura per entrada

```json
{
  "entries": [
    {
      "id": "uuid-v4",
      "path": "Projects/navi-os/README.md",
      "type": "project",
      "vector": [0.1, -0.2, ...],
      "text": "Contingut original o summary",
      "metadata": {
        "title": "Navi OS",
        "status": "in-progress",
        "owner": "jeff",
        "tags": ["dashboard", "react"],
        "created": "2026-04-01",
        "updated": "2026-04-02"
      },
      "timestamp": "2026-04-02T22:00:00Z",
      "checksum": "sha256:abc123..."
    }
  ],
  "last_updated": "2026-04-02T22:00:00Z",
  "version": "1.0"
}
```

### 5.2 Regeneració

**CRON:** Cada 24h a les 03:00 (despres de overnight audit)
**TRIGGER:** Quan qualsevol agent modifica un fitxer a Projects/ o Decisions/
**SCRIPT:** `scripts/regenerate-semantic-index.js`

**REGLA 5.1:** L'índex mai pot tenir >24h sense actualitzar.
**REGLA 5.2:** Alerta si `last_updated < now - 24h`.

---

## 6. INBOX VIDA MÀXIMA (7 Dies)

### 6.1 Procés

**Dia 0-3:** Captura lliure a `_inbox/`
**Dia 4-6:** Revisió obligatòria - moure a Projects/, Decisions/, o Daily/
**Dia 7:** Auto-processament
  - Si té `type: task` i no mogut → crear Task a PROJECT.md
  - Si té `type: reference` → moure a `_archive/`
  - Si té `type: thought` → afegir a Daily/ del dia
  - Resta → esborrar amb log a `process-log.md`

### 6.2 Automatització

**CRON:** Dilluns 00:00 - `scripts/inbox-cleanup.js`
**ALERTA:** Si `_inbox/` té >20 fitxers → notificar a standup

---

## 7. NOMENCLATURA

### 7.1 Fitxers

- **Projects:** `Projects/{kebab-case-name}/README.md`
- **Decisions:** `Decisions/YYYY-MM-DD-{kebab-case-title}.md`
- **Daily:** `Daily/YYYY-MM-DD/notes.md`
- **Inbox:** `_inbox/YYYY-MM-DDTHHMM-{type}-{slug}.md`

### 7.2 No permetre

- ❌ Espais als noms de fitxer (usar `-` o `_`)
- ❌ Caràcters especials (`:`, `?`, `*`, `"`, `<`, `>`, `|`)
- ❌ Noms en majúscules (excepte primera lletra de paraules)
- ❌ Fitxers fora de carpetes autoritzades

---

## 8. AGENTS - Responsabilitats

| Agent | Rol | Responsabilitat Memòria |
|-------|-----|------------------------|
| **Navi** | Coordina | Garantir constitució, validar entrades, actualitzar índex |
| **ELOM** | Visionari | Definir estructura semàntica, embeddings, evolució futura |
| **WARREN** | Qualitat | Auditar compliment, freshness, data integrity |
| **JEFF** | Execució | Implementar scripts, automatitzacions, processos |
| **SAM** | Tecnologia | Mantenir semantic-index, tooling de cerca |

---

## 9. DOCUMENTACIÓ DE CANVIS

Qualsevol modificació a aquesta Constitució requereix:

1. **Proposta** a `Decisions/` amb impact="high"
2. **Aprovació** de 3/4 chiefs
3. **Versió** actualitzada (MAJOR.MINOR.PATCH)
4. **Log** a `CHANGELOG.md`

**Versió actual: 1.0.0** (2026-04-02)

---

## 10. SANCIONS

Si un agent incompleix aquesta Constitució:

| Incompliment | Acció |
|--------------|-------|
| Frontmatter malformat | Rebutjar entrada + notificar |
| Fitxer fora de lloc | Auto-moure a `_inbox/` + notificar |
| UUID duplicat | Rebutjar + demanar regenerar |
| Índex obsolet (>24h) | Forçar regeneració + alerta standup |

---

## 📌 CHECKLIST RÀPID (Per agents)

- [ ] He creat el fitxer a la carpeta correcta?
- [ ] He aplicat la plantilla corresponent?
- [ ] El frontmatter té tots els camps obligatoris?
- [ ] L'UUID és únic i vàlid?
- [ ] He actualitzat el semantic-index (si és necessari)?
- [ ] He comprovat que `last_updated` estigui actualitzat?

---

_"Un sistema de memòria és tan bo com el seu compliment."_

**APROVAT PER:** ELOM, WARREN, JEFF, SAM | Data: 2026-04-02
