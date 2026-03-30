# Automation Rollback & Recovery Guide

## Quick Rollback Commands

### Disable a Cron Job Immediately
```bash
# Via cron tool - disable the job
cron remove <jobId>

# Or disable via OpenClaw CLI
openclaw cron disable <jobId>
```

### Stop a Running Cron
```bash
# Kill by name
pkill -f "02-overnight-audit.sh"
pkill -f "01-repo-backup.sh"
pkill -f "03-daily-brief.sh"
pkill -f "04-rolling-docs.sh"
```

### Recover from Bad Automated Change

1. **If a script made unwanted changes:**
   ```bash
   cd /home/user/.openclaw/workspace
   git checkout -- .
   git clean -fd
   ```

2. **If docs/SYSTEM-REFERENCE.md was corrupted:**
   ```bash
   rm /home/user/.openclaw/workspace/docs/SYSTEM-REFERENCE.md
   # Next Rolling Docs cron will regenerate it
   ```

3. **If memory files were corrupted:**
   ```bash
   # Restore from git
   git checkout HEAD -- memory/
   ```

4. **If backup pushed bad code:**
   ```bash
   # Reset to previous commit
   git reset --hard HEAD~1
   git push --force
   ```

## Recovery Checklist

- [ ] Cron job causing issues identified?
- [ ] Cron disabled/killed?
- [ ] Bad changes reverted?
- [ ] Working state confirmed?
- [ ] Notify if client-facing impact?

## Cron Job IDs (for reference)

| Job | Cron ID | Schedule |
|-----|---------|----------|
| Repo Backup | `546fb0ef-986e-4298-9b52-e7ef1796c596` | Daily 02:00 |
| Overnight Audit | `9a7ceea6-bcd7-4999-a2d5-d735ee78ed20` | Daily 03:00 |
| Daily Brief | `4182fba8-0791-4016-a2b1-08fb81064fdb` | Daily 08:00 |
| Rolling Docs | `d7a060a0-dc95-4d6a-814a-6398248610b7` | Daily 23:00 |

## Verification Commands

```bash
# List all cron jobs
cron list

# Check specific job run history
cron runs <jobId>

# Run a cron immediately to test
cron run <jobId>

# Check OpenClaw status
openclaw status
```

## Manual Execution (Testing)

```bash
# Test backup script
bash /home/user/.openclaw/workspace/scripts/01-repo-backup.sh

# Test audit script
bash /home/user/.openclaw/workspace/scripts/02-overnight-audit.sh

# Test daily brief
bash /home/user/.openclaw/workspace/scripts/03-daily-brief.sh

# Test rolling docs
bash /home/user/.openclaw/workspace/scripts/04-rolling-docs.sh
```

## Alert/Notification Setup

If a cron fails:
1. It logs to `/home/user/.openclaw/workspace/memory/YYYY-MM-DD-[job-name]-failure.md`
2. OpenClaw will announce failures via the configured channel
3. Check cron run history: `cron runs <jobId>`

## Rollback Priority

If multiple things go wrong:
1. **First:** Disable offending cron
2. **Second:** Restore git to last known good state
3. **Third:** Verify workspace integrity
4. **Fourth:** Re-enable crons one by one
