# Navi OS Deployment Pipeline

## Environments

| Environment | Directory | API Port | Vite Port | Purpose |
|-------------|-----------|----------|-----------|---------|
| **Lab** | `navi-os/` | 3001 | 8100 | Development source |
| **Staging** | `navi-os-staging/` | 3002 | 8900 | Pre-release testing |
| **Final** | `navi-os-final/` | 3003 | 9100 | Canary/Release candidate |
| **Production** | `navi-os/` | 3001 | 8100 | Live system |

## Pipeline Flow

```
LAB → STAGING → FINAL → PRODUCTION
```

## Scripts

### Main Deployment Script
```bash
./scripts/navios-deploy.sh <command>
```

**Commands:**
- `deploy:<env>` - Full deployment (sync + build + restart)
- `sync:<env>` - Sync code from lab to target
- `build:<env>` - Build React app
- `start:<env>` - Start services
- `stop:<env>` - Stop services
- `restart:<env>` - Restart services
- `status` - Show all environments status
- `pipeline` - Show pipeline diagram
- `promote` - Full pipeline promotion (Lab→Staging→Final→Production)

### Proposal Deployment Trigger
```bash
./scripts/deploy-proposal.sh <stage> [proposal-id]
```

**Stages:** `staging`, `final`, `prod`

## Usage Examples

### Deploy to staging
```bash
./scripts/navios-deploy.sh deploy:staging
```

### Deploy to final (canary)
```bash
./scripts/navios-deploy.sh deploy:final
```

### Full pipeline promotion
```bash
./scripts/navios-deploy.sh promote
```

### Deploy proposal to staging
```bash
./scripts/deploy-proposal.sh staging IMP-2026-04-03-01
```

## PM2 Services

| Service | Environment |
|---------|-------------|
| `navi-os-api` / `navi-os-vite` | Production |
| `navi-os-staging-api` / `navi-os-staging-vite` | Staging |
| `navi-os-final-api` / `navi-os-final-vite` | Final |

## Access URLs

- **Production:** http://localhost:8100
- **Staging:** http://localhost:8900
- **Final:** http://localhost:9100
