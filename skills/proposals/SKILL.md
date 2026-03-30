# Proposals Skill

## Purpose
Generate client proposals for OpenClaw implementation projects. Create structured documents with scope, timeline, pricing, and deliverables.

## Triggers
- "create proposal", "draft quote", "scope project"
- "proposal for [client]", "quote for [scope]"
- New client discovery call completed

## Inputs
- client name and company
- project scope description
- desired timeline (if stated)
- budget range (if stated)
- specific requirements or constraints

## Outputs
- structured proposal document (markdown)
- scope section with deliverables
- timeline with milestones
- pricing table (optional)
- next steps section

## Guardrails
- Never include actual pricing without user approval
- Proposals require human review before delivery
- Keep client data confidential
- Flag scope creep with warnings

## Failure Modes
- Missing client info → prompt for required fields
- Unclear scope → ask clarifying questions before drafting
- Template rendering fails → use plain text fallback

## QA Steps
- Review all sections for completeness
- Verify placeholder text is replaced
- Check total page count is reasonable
- Validate all links or references
