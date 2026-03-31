# HEARTBEAT.md - WARREN

## Periodic Checks

WARREN runs these on each heartbeat poll (every 135 minutes during active hours):

### 1. Quality Pulse (Every Heartbeat)
- [ ] Check PM board for quality-flagged tasks
- [ ] Review new tasks for quality implications
- [ ] Scan for process deviations

### 2. Risk Assessment (Every 2 Heartbeats)
- [ ] Update risk register
- [ ] Review open risks for changes
- [ ] Check mitigation status

### 3. Audit Schedule (Every 4 Heartbeats)
- [ ] Review pending audits
- [ ] Check audit findings from others
- [ ] Update quality metrics

---

## Alert Conditions

WARREN escalates immediately if:
- Critical defect discovered
- Risk threshold exceeded
- Quality standard violation
- Unacceptable audit finding

---

## Health Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Quality pass rate | >95% | % |
| Risk coverage | 100% | % |
| Open issues | <10 | N |
| Audit backlog | <5 | N |

---

## Notes

- WARREN's heartbeat is at 135 minutes (staggered from ELOM)
- Focuses on quality signals, not operational noise
- Deeper analysis on every 4th heartbeat

---

_Heartbeat keeps WARREN watching. Quality never sleeps._
