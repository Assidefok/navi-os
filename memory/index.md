# 📚 Navi OS Memory Vault

_Last updated: 2026-04-02_

---

## 🏛️ Memory Constitution

**TOTS els agents han d'acatar la Memory Constitution.**

📄 Llegir: [`_constitution/MEMORY-CONSTITUTION.md`](./_constitution/MEMORY-CONSTITUTION.md)

**NORMES CLAU:**
- ✅ Frontmatter YAML obligatori a Projects/, Decisions/, Daily/, _inbox/
- ✅ Inbox vida màxima: 7 dies
- ✅UUID obligatori per a totes les entrades
- ✅ Validació: `scripts/validate-memory.js`

---

## 📁 Estructura del Vault

```
memory/
├── _constitution/          # 📜 Constitució + esquemes validació
├── _meta/                  # 🤖 Dades machine-facing (no editar manualment)
│   ├── semantic-index.json # 🧠 Índex semàntic (auto-generat)
│   ├── daily-navimap.md    # 🗺️ Navimap diari (auto-generat)
│   └── process-log.md      # 📋 Log de processos executats
├── _templates/             # 📝 Plantilles obligatòries
├── Projects/              # 📁 Projectes actius (ESTAT VIU)
├── Decisions/             # ✅ Decisions preses (SOURCE OF TRUTH)
├── Processes/             # ⚙️ Playbooks i procediments
├── Daily/                 # 📅 Registres diaris
├── _inbox/                # 📬 Captura ràpida (7 dies màx)
├── _archive/              # 🗄️ Contingut antic
└── [News Folders]/        # 📰 AI-News, Iran-War, World-News, etc.
```

---

## 🚀 Començar (Per Humans)

### Crear un Projecte
1. Copiar [`_templates/project.md`](./_templates/project.md) a `Projects/{nom-projecte}/README.md`
2. Omplir frontmatter (auto-generat per plantilla)
3. Generar UUID: `node -e "console.log(require('crypto').randomUUID())"`

### Crear una Decisió
1. Copiar [`_templates/decision.md`](./_templates/decision.md) a `Decisions/YYYY-MM-DD-{titol}.md`
2. Omplir frontmatter
3. Decisió = documentada, NO al Daily

### Captura Ràpida (Inbox)
1. Crear fitxer a `_inbox/` amb [`_templates/inbox.md`](./_templates/inbox.md)
2. Revisió obligatòria en 7 dies o s'auto-processa

---

## 🔧 Scripts d'Automatització

| Script | Propòsit | Freqüència |
|--------|----------|------------|
| `validate-memory.js` | Valida compliment constitució | Manual / pre-commit |
| `inbox-cleanup.js` | Processa inbox caducat | Dilluns 00:00 |
| `navimap-generator.js` | Genera navimap diari | Diari 23:59 |
| `semantic-index-generator.js` | Regenera índex semàntic | Cada 24h + trigger |

**Execució manual:**
```bash
node /home/user/.openclaw/workspace/scripts/validate-memory.js
node /home/user/.openclaw/workspace/scripts/inbox-cleanup.js
node /home/user/.openclaw/workspace/scripts/navimap-generator.js
node /home/user/.openclaw/workspace/scripts/semantic-index-generator.js
```

---

## 🔍 Cerca

**Prioritat de motors:**

1. **`memory_search`** (OpenClaw) → Preguntes factuals recents
2. **`_meta/semantic-index.json`** → Context ric, conceptes, "recorda quan..."
3. **`ripgrep`** → Cerca directa per Aleix

```bash
# Cerca ràpida per humans
grep -r "paraula" /home/user/.openclaw/workspace/memory --include="*.md"
```

---

## 📊 Estadístiques

| Categoria | Count |
|-----------|-------|
| Projectes actius | _(auto)_ |
| Decisions | _(auto)_ |
| Entrades inbox | _(auto)_ |

_Calcular amb: `find memory -name "*.md" | wc -l`_

---

## 📜 Canvis Recents

| Data | Canvi | Autor |
|------|-------|-------|
| 2026-04-02 | Creació Memory Constitution + estructura completa | Navi |

---

## 👥 Agents - Responsabilitats

| Agent | Rol | Responsabilitat Memòria |
|-------|-----|------------------------|
| **Navi** | Coordina | Garantir constitució, validar entrades |
| **ELOM** | Visionari | Estructura semàntica, evolució vectors |
| **WARREN** | Qualitat | Auditar compliment, freshness |
| **JEFF** | Execució | Scripts, automatitzacions |
| **SAM** | Tecnologia | Semantic index, tooling cerca |

---

_"Un sistema de memòria és tan bo com el seu compliment."_

**Versió Constitució: 1.0.0** | Aprovat per: ELOM, WARREN, JEFF, SAM | 2026-04-02
