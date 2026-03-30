# PROJECT.md - Font única de veritat

_Last updated: 2026-03-31 00:13 Europe/Madrid_

## Objectiu actual
Consolidar Navi OS com a sistema operatiu personal fiable sobre OpenClaw, amb una base neta per continuar el bootcamp i preparar el salt a l'Episodi 3.

## Regla operativa
Aquest fitxer és la font única de veritat per a:
- estat del projecte
- progrés per episodis
- decisions
- incidències obertes
- següents passos

Altres fitxers serveixen de suport o historial:
- `MEMORY.md` = memòria estable i preferències
- `memory/*.md` = diari, logs i historial
- codi = implementació

## Estat general
- Repo: `/home/user/.openclaw/workspace`
- App principal: `/home/user/.openclaw/workspace/navi-os`
- Port oficial: `8100`
- Stack: React + Vite + Node/Express
- Estat actual: Episodi 2 sanejat i funcionant; base preparada per començar l'Episodi 3

## Bootcamp status
- Episodi 1: Complet
- Episodi 2: Tancat funcionalment i sanejat
- Episodi 3: Preparat per iniciar
- Episodi 4: Pendent
- Episodi 5: Pendent

## Auditoria real - Episodi 2

### Correcte / present
- [x] Estructura modular principal: Ops / Brain / Lab
- [x] Dock i TopBar
- [x] Vista Mission Control
- [x] Vista Org Chart
- [x] Vista PM Board
- [x] Vista Task Manager
- [x] Brain amb seccions de memòria/briefs/skills/cron
- [x] Lab amb ideas/prototypes/research/overnight
- [x] `npm run build` funciona

### No prou bé / pendent de neteja
- [x] `npm run lint` ja passa
- [x] Eliminats els usos de `require('child_process')` del frontend
- [x] Afegits endpoints reals perquè la UI deixi de dependre de fallback incorrecte
- [ ] Encara hi ha placeholders que convindrà polir més endavant
- [x] S'ha centralitzat el seguiment operatiu a `PROJECT.md`

## Incidències obertes prioritàries
1. Polir placeholders restants i enriquir dades reals
2. Definir l'abast exacte de l'Episodi 3
3. Introduir arquitectura de multi-agent sense degradar la simplicitat actual

## Pla immediat
1. Crear aquest fitxer com a centre operatiu
2. Corregir errors fàcils/estructurals de lint a Episodi 2
3. Revalidar build i lint
4. Marcar què queda pendent exactament
5. Preparar arrencada d'Episodi 3

## Decisions preses
- Es centralitza el seguiment del projecte a `PROJECT.md`
- No es considera l'Episodi 2 “tancat” només perquè renderitzi; ha de quedar acceptable tècnicament
- `MEMORY.md` no serà el tauler operatiu principal; serà memòria estable

## Següent pas actiu
Definir i començar l'Episodi 3 sobre la base ja sanejada de l'Episodi 2.
