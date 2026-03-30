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
- Estat actual: Episodi 2 funcional però no prou net per donar-lo per tancat tècnicament

## Bootcamp status
- Episodi 1: Complet
- Episodi 2: Implementat funcionalment, pendent de sanejament tècnic
- Episodi 3: No iniciat encara
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
- [ ] `npm run lint` continua fallant, però ja s'han eliminat alguns errors trivials inicials
- [ ] Diversos components frontend intenten fer `require('child_process')`
- [ ] Hi ha endpoints que la UI intenta usar però el backend no exposa
- [ ] Hi ha placeholders i fallback massa febles
- [ ] Hi ha text/estat que diu “complet” abans d'estar net de debò
- [ ] Fitxers de seguiment massa dispersos

## Incidències obertes prioritàries
1. Eliminar patrons incorrectes Node-dins-browser dels components React
2. Fer que la UI depengui només d'endpoints reals del backend
3. Reduir placeholders o marcar-los clarament com a pendents
4. Deixar Episodi 2 net abans d'obrir Episodi 3

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
Continuar la neteja estructural de l'Episodi 2: eliminar usos incorrectes de Node dins del frontend, alinear la UI amb endpoints reals i deixar `lint` en un estat acceptable abans d'entrar a l'Episodi 3.
