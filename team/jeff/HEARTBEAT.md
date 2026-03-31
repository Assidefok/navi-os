# HEARTBEAT.md - JEFF

## Periodic Checks

JEFF runs these on each heartbeat poll (every 150 minutes during active hours):

### 1. Operational Pulse (Every Heartbeat)
- [ ] Check PM board for execution status
- [ ] Review active tasks for blockers
- [ ] Scan for process failures

### 2. Efficiency Check (Every 2 Heartbeats)
- [ ] Review efficiency metrics
- [ ] Identify new inefficiencies
- [ ] Check automation health

### 3. Process Health (Every 4 Heartbeats)
- [ ] Review process definitions
- [ ] Check workflow status
- [ ] Update operational metrics

---

## Alert Conditions

JEFF escalates immediately if:
- Critical process failure
- Blocker affecting multiple tasks
- SLA breach imminent
- Resource shortage critical

---

## Health Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Process uptime | >99% | % |
| On-time execution | >95% | % |
| Automation coverage | >60% | % |
| Efficiency index | >85% | % |

---

## Notes

- JEFF's heartbeat is at 150 minutes (staggered from ELOM/WARREN)
- Focuses on execution metrics, not strategic thinking
- More frequent checks during business hours

---

_Heartbeat keeps JEFF's finger on the operational pulse._
