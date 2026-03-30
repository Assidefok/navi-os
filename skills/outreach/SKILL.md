# Outreach Skill

## Purpose
Manage outreach campaigns for Aleix's OpenClaw implementation business. Handles prospect discovery, initial contact sequences, and pipeline tracking.

## Triggers
- "outreach", "contact prospect", "find leads", "cold email"
- New business development tasks
- Lead qualification requests

## Inputs
- target industry or company
- contact name/email (if provided)
- outreach type: cold email, follow-up, warm intro
- template selection

## Outputs
- outreach email draft
- prospect entry added to pipeline
- sequence status update
- follow-up reminders

## Guardrails
- Never send emails without explicit user confirmation
- Never include private client data in templates
- Validate email addresses before use
- Respect opt-out requests

## Failure Modes
- Invalid email format → prompt user to verify
- No template match → use generic fallback with user review
- API rate limit hit → queue and retry with backoff

## QA Steps
- Draft appears in review queue before sending
- Test with mock recipient before live send
- Verify template variables resolve correctly
