# Backup Failure — 2026-03-30

## Script
`/home/user/.openclaw/workspace/scripts/01-repo-backup.sh`

## Error
```
Identidad del autor desconocido

*** Por favor cuéntame quién eres.

Ejecuta

  git config --global user.email "you@example.com"
  git config --global user.name "Tu Nombre"

para configurar tu identidad por defecto de tu cuenta.
Omite --global para configurar tu identidad solo en este repositorio.

fatal: no es posible auto-detectar la dirección de correo (se obtuvo 'user@n100.(none)')
ERROR: Commit failed
```

## Root Cause
Git no té `user.email` ni `user.name` configurats globalment. El sistema detecta un email `user@n100.(none)` que no és válid.

## Proposta de fix
Cal configurar la identitat global de git per a l'usuari actual:

```bash
git config --global user.email "aleix@navi-os.local"
git config --global user.name "Aleix"
```

Alternativament, si prefereixes una identitat diferent per al workspace:
```bash
git config --global user.email "navi@openclaw.local"
git config --global user.name "Navi"
```

## Comportament
El script no ha pogut fer el commit del backup. Cal executar `git config` i tornar a executar el script manualment o esperar a la propera execució del cron.
