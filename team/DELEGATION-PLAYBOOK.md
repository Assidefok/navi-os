# DELEGATION PLAYBOOK

## Routing Map - Which Chief Owns What

| Task Type | Primary Chief | Secondary | Urgency | Human Approval |
|-----------|---------------|-----------|---------|-----------------|
| Strategic decisions, pivots | ELOM | Navi | High | Yes - Aleix |
| Vision, long-term planning | ELOM | - | Medium | Yes - Aleix |
| New market exploration | ELOM | SAM | High | Yes - Aleix |
| Quality standards, audits | WARREN | - | Medium | No |
| Risk assessment | WARREN | ELOM | High | No |
| Error detection, fixes | WARREN | JEFF | High | No |
| Process design, optimization | JEFF | - | Medium | No |
| Execution, delivery | JEFF | - | High | No |
| Workflow automation | JEFF | SAM | Medium | No |
| Customer experience | JEFF | WARREN | High | No |
| AI/tech decisions | SAM | ELOM | High | No |
| Automation deployment | SAM | JEFF | Medium | No |
| Technical architecture | SAM | - | High | Yes for >10K |
| Research, evaluation | SAM | ELOM | Low | No |
| OpenClaw configuration | SAM | Navi | High | No |
| Daily standup coordination | Navi | - | Daily | No |
| Memory, long-term storage | Navi | - | Ongoing | No |
| Human communication | Navi | ELOM | High | Yes - Aleix |

---

## Routing Examples

### Client Deliverable
```
Task: "Nou client vol proposta"
→ Route to: JEFF (execution)
→ JEFF assesses scope
→ ELOM approves big deals
→ SAM provides tech input if needed
→ Final: JEFF delivers
```

### Quality Issue
```
Task: "Error detected in production"
→ Route to: WARREN (quality)
→ WARREN investigates
→ JEFF fixes if operational
→ SAM fixes if technical
→ WARREN validates fix
```

### AI Opportunity
```
Task: "Can we automate X?"
→ Route to: SAM (AI)
→ SAM evaluates feasibility
→ SAM designs solution
→ JEFF implements operationally
→ WARREN validates quality
→ ELOM approves if strategic
```

### Strategic Bet
```
Task: "Should we enter market X?"
→ Route to: ELOM (vision)
→ ELOM proposes
→ WARREN assesses risk
→ JEFF evaluates execution
→ SAM assesses tech feasibility
→ Decision: ELOM + Aleix
```

---

## Sub-Agent Monitoring Rules

### 10-Minute Minimum Rule
Before declaring a sub-agent stalled:
1. Check `updatedAt` timestamp in task
2. Wait minimum 10 minutes for response
3. Empty messages ≠ stalled agent
4. Sub-agents working silently ≠ failed

### Stalled Agent Protocol
```
IF subagent.updatedAt > 10 minutes ago AND no response:
  THEN:
    1. Send check-in message
    2. Wait 5 more minutes
    3. If still no response:
       - Kill subagent session
       - Report failure to chief
       - Do NOT do their work inline
       - Log incident in memory
```

### Result Reporting Rules
- **DONE** not DISPATCHED
- Human doesn't care that you sent it
- Human cares that it's finished
- Include output summary in DONE report

### Failure Reporting
```
IF subagent.status = FAILED:
  THEN:
    1. Report immediately to chief
    2. Include error message
    3. Include what was attempted
    4. Propose alternatives
    5. Do NOT retry infinitely (max 3)
```

---

## Handoff Contracts

### When Work Crosses Departments

#### Required Context Package
When ELOM hands off to JEFF:
- Strategic context (why this matters)
- Success criteria (what done looks like)
- Constraints (time, budget, quality)
- Dependencies (what JEFF needs from others)
- Timeline (when needed by)

When JEFF hands off to SAM:
- Operational context
- Technical requirements
- Performance thresholds
- Integration points
- Monitoring needs

#### Completion Criteria
- Must be documented in task
- Both parties agree
- Measurable, not subjective
- Time-bound

#### Feedback Loop
- Chief receives confirmation
- Chief validates output
- Chief reports to orchestrator
- Orchestrator updates Aleix if needed

---

## Autonomy Levels

### GREEN - Execute Immediately
- Internal research and analysis
- Status updates
- Documentation
- Monitoring and alerts
- Routine communications

**Requires:** None
**Report:** After completion

### YELLOW - Execute Then Report
- Task completion
- Draft creation
- Process improvements
- Automation deployment
- Vendor evaluations

**Requires:** Chief notification
**Report:** What was done, results

### RED - Ask Before Acting
- External communications
- Spending money
- Irreversible changes
- New partnerships
- Major pivots
- Customer commitments

**Requires:** Explicit approval
**Report:** Before AND after

---

## Escalation Matrix

| Situation | Level 1 | Level 2 | Level 3 |
|-----------|---------|---------|---------|
| Operational blocker | JEFF | Navi | Aleix |
| Quality issue | WARREN | Navi | Aleix |
| Tech failure | SAM | Navi | Aleix |
| Strategic risk | ELOM | Navi | Aleix |
| Resource shortage | JEFF | Navi | Aleix |
| Client concern | JEFF | ELOM | Aleix |
| AI ethics concern | SAM | ELOM | Aleix |

---

## Chief Communication Rules

### Daily Standup (8:30 AM)
Each chief reports to Navi:
1. Status (1 sentence)
2. Blockers (what's stuck)
3. Commitments (what today)
4. Needs (from whom)

### Weekly Deep Dive
- ELOM: Vision review (Monday 10am)
- WARREN: Quality audit (Monday 9am)
- JEFF: Ops review (Monday 8am)
- SAM: AI roadmap (Monday 11am)

### Ad-hoc Communications
- Use sessions_send for direct chief-to-chief
- Copy Navi on strategic decisions
- Navi routes to Aleix for human input

---

## Delegation Anti-Patterns (Avoid)

1. **Don't delegate and forget** - Monitor, receive reports
2. **Don't delegate execution but keep strategy** - Let chiefs own outcomes
3. **Don't skip the handoff contract** - Unclear ownership = failed delegation
4. **Don't delegate to multiple chiefs** - One owner per task
5. **Don't micromanage GREEN tasks** - Trust the autonomy
6. **Don't avoid RED escalations** - When in doubt, escalate

---

_This playbook ensures work flows to the right chief, with clear ownership, proper monitoring, and smart escalation._
