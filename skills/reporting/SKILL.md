# Reporting Skill

## Purpose
Generate periodic reports on OpenClaw implementation business metrics: pipeline status, active projects, revenue tracking, and weekly summaries.

## Triggers
- "generate report", "weekly summary", "status report"
- "pipeline report", "project update", "business metrics"
- Scheduled weekly reports (cron)

## Inputs
- report type: weekly, monthly, project, pipeline
- date range (defaults to current week/month)
- include metrics: active deals, closed won, hours logged
- format: markdown, summary

## Outputs
- formatted report with sections
- key metrics highlighted
- actionable recommendations
- next period priorities

## Guardrails
- Never include actual revenue figures without user approval
- Reports are for internal use only
- Aggregate data to avoid exposing individual client details
- Keep drafts private until user approves distribution

## Failure Modes
- No data for period → report "No activity" with last active date
- Missing file → notify user, skip section gracefully
- Report too large → paginate or summarize

## QA Steps
- Verify all sections render correctly
- Check date ranges are accurate
- Confirm totals add up
- Validate metrics are pulled from correct sources
