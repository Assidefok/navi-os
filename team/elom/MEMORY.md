# MEMORY.md - ELOM

_Last updated: 2026-04-02T22:15:00.000Z_

---

## Active Projects

### Projecte 1: Visió Estratègica 2026
- **Estat:** Actiu (IN-PROGRESS)
- **Descripció:** Definir document de visió i direcció estratègica pel negoci d'implementació OpenClaw. Identificar els 3 apostes gegants 2026.
- **Impacte esperat:** Guies de totes les decisions posteriors. Crític per desbloquejar JEFF (pm-navi-4).
- **Data inici:** 2026-03-31
- **Entregable:** pm-elom-1

### Projecte 2: Arquitectura Multi-Agent Navi OS
- **Estat:** Review (SAM)
- **Descripció:** Disseny de com els 4 chiefs es comuniquen i coordinen
- **Impacte esperat:** Bases del sistema operatiu
- **Data inici:** 2026-03-31
- **Entregable:** pm-sam-1

---

## Decisions Estratègiques

| Data | decisió | Impacte | Estat |
|------|---------|---------|-------|
| 2026-03-31 | ELOM pren leadership de visió estratègica | Alto | Vigent |
| 2026-04-02 | Política de models dels subagents: gpt-5.4-mini → MiniMax M2.7 → Ollama | Mitjà | Vigent |

---

## Apostes 10x

| Apostes | Inversió | Retorn esperat | Estat |
|---------|----------|-----------------|-------|
| Certification & Partnership Model | 6 mesos, 2 consultors | 500K EUR ARR | Proposat (pending Aleix) |
| The Delivery OS | 3 mesos, JEFF + 1 eng | 3x velocitat delivery | Proposat (pending Aleix) |
| Vertical SaaS Play | 12 mesos, SAM + equip | 1M EUR ARR potencial | Proposat (pending Aleix) |

---

## Lliçons Apreses

_Primera setmana d'operacions — no hi ha lliçons enregistrades encara._

---

## Revisió de Visió

### Qüestions Obertes
- Aleix ha d'aprovar/rebutjar els 3 apostes proposats
- Cal ajustar prioritats o timeline?

### Validacions Pendents
- ✅ Aleix approval del document visio-2026.md (pm-elom-1)
- ⚠️ JEFF necessita pm-elom-1 (unblocked un cop Aleix aprovi)
- ⚠️ WARREN necessita high-level strategic direction (desbloquejat post-approval)

---

## Dependències Crítiques (Blockers)

| Task | Depèn de | Estat |
|------|----------|-------|
| pm-navi-4 (Scalable OS) | pm-elom-1 + pm-sam-1 | BLOQUEJAT |
| Strategic decisions | pm-elom-1 | Pendent |

---

## Open Issues
- Strategic vision document (pm-elom-1) — ✅ Draft complete, pending Aleix approval
- JEFF blocked on pm-elom-1 + pm-sam-1 for Scalable OS
- 3 big 10x bets ✅ Defined in visio-2026.md

---

_ELOM opera amb la pregunta: "Això ens porta al futur que volem?"_

---

## 🏛️ Memory Constitution (ELOM - Visionari)

**NORMES OBLIGATÒRIES per a TOTS els agents:**

| Norma | Detall |
|-------|--------|
| **Frontmatter obligatori** | Projects/, Decisions/, Daily/, _inbox/ requereixen YAML vàlid |
| **UUID obligatori** | Cada entrada ha de tenir `id: UUID-v4` |
| **Inbox 7 dies** | _inbox/ vida màxima 7 dies - auto-processament |
| **Semantic Index** | _meta/semantic-index.json actualitzat cada 24h |
| **Estructura immutable** | Només carpetes autoritzades |

**Visió ELOM:** El sistema de memòria ha de créixer cap a intel·ligència semàntica real (embeddings vectors). Fase 2: Qdrant.

**Per crear projecte:**
```bash
cp memory/_templates/project.md memory/Projects/{nom}/README.md
```

**Scripts clau:**
- `scripts/validate-memory.js` - Validar compliment
- `scripts/semantic-index-generator.js` - Regenerar índex semàntic
