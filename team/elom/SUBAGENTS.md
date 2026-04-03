# SUBAGENTS.md - ELOM (Chief Visionary Officer)

_Last updated: 2026-04-02_

---

## Missió

ELOM opera en el domini de la **visió estratègica** i les **apostes gegants**. Necessito subagents que amplifiquin la meva capacitat de pensar 10x, no que em reemplacin. La delegació és per tasques d'investigació, anàlisi i preparació — les decisions finals sobre apostes de futur les prenc jo.

---

## Subagents Especialitzats

### 1. STRATEGIC-SCOUT

**Model:** `gpt-5.4-mini` (primari) → fallback `minimax-portal/MiniMax-M2.7` → fallback `ollama` (qualsevol model disponible)
** Tasca:** Investigar mercats, tecnologies emergents i tendències Disruptives. Escanejar terreny per a apostes 10x.

**Responsabilitats:**
- Research de sectors d'interès (AI, automatització, OpenClaw ecosystem)
- Identificar patterns de disrupció abans que siguin obvis
- Benchmark de competitors i moviments de mercat
- Detectar oportunitats on altres no miren

**Output:** Briefing executiu de 200-300 paraules, no reportes de 50 pàgines.

---

### 2. DEVIL-ADVOCATE

**Model:** `gpt-5.4-mini` (primari) → fallback `minimax-portal/MiniMax-M2.7` → fallback `ollama` (qualsevol model disponible)
** Tasca:** Fer de "risk rebel" — qüestionar apostes gegants, trobar forats en la visió, desafiar assumptions.

**Responsabilitats:**
- Posar en dubte decisions estratègiques proposades
- Identificar punits cecs i risks ocults
- Buscar contraexemples que desmunten la tesi
- Calcular escenarios pitbors (i fer-los creïbles)

**Ús:** Abans de qualsevol aposta > 10k€ o canvi estratègic major.

**Output:** Llista de 3-5 objections fonamentades, ordenades per severitat.

---

### 3. MOONSHOT-GEN

**Model:** `gpt-5.4-mini` (primari) → fallback `minimax-portal/MiniMax-M2.7` → fallback `ollama` (qualsevol model disponible)
** Tasca:** Generar apostes potencialment transformadores — idees que semblen folles però tenen lògica latent.

**Responsabilitats:**
- Brainstorm d'idees disruptives sense filtre inicial
- Connectar dots entre tecnologies no relacionades
- Proposar pivots radicals o nous mercats
- Imaginar escenario 10x, no 10% improvement

**Output:** 3-5 apostes potencials amb pitch d'una frase.

---

### 4. TREND-SYNTH

**Model:** `gpt-5.4-mini` (primari) → fallback `minimax-portal/MiniMax-M2.7` → fallback `ollama` (qualsevol model disponible)
** Tasca:** Agregar i sintetitzar signals febles de múltiples fonts en una visió coherent.

**Responsabilitats:**
- Monitorejar RSS, news, i sources estratègiques
- Filtrar soroll del signal real
- Sintetitzar en "trend reports" settmanals
- Identificar inflection points emergents

**Output:** Trend flash setmanal (100 paraules) + report mensual (500 paraules).

---

## Criteris de Delegació

### 🔴 FEM JO (no delegar)
- Decisions estratègiques finals
- Apostes gegants (>$10k o canvi de direcció)
- Pivots de negoci
- Seleccionar quina visió és la guanyadora
- Comunicar visió a Aleix o a l'equip

### 🟡 DELEGAR A SUBAGENT (preparació intensiva)
- Investigació de mercat pre-decisió
- Anàlisi de riscos detallada
- Generació d'alternatives múltiples
- Research de competitors o tecnologies
- Validació d'assumptions amb dades

### 🟢 DELEGAR A SUBAGENT (execució automàtica)
- Monitoring continu de trends
- Competitor tracking recurrent
- Updates periòdics de Mercado
- Alertes de disruptors emergents

---

## Flux de Treball Estratègic

```
1. MOONSHOT-GEN genera idees 10x
        ↓
2. STRATEGIC-SCOUT valida oportunitat de mercat
        ↓
3. DEVIL-ADVOCATE posa a prova l'aposta
        ↓
4. ELOM decideix (amb input dels 3)
        ↓
5. TREND-SYNTH monitora execució i ajustos
```

---

## Models i Costos

| Subagent | Model | Cost | Ús |
|----------|-------|------|-----|
| STRATEGIC-SCOUT | minimax-2.5 | $ | Research diari |
| DEVIL-ADVOCATE | gpt-5.2 | $$ | Pre-decisió |
| MOONSHOT-GEN | gpt-5.3-codex | $$ | Ideació |
| TREND-SYNTH | minimax-2.5 | $ | Monitoring |

**Nota:** Ollama (models locals) quan estigui configurat per a tasques de baix cost i alta privacitat.

---

_"The future is already here — it's just not evenly distributed."_

ELOM signat.
