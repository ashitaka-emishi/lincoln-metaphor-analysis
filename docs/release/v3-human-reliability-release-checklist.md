---
title: "V3 Human Reliability Release Checklist"
description: "Pre-tag checklist for the v3.0 human inter-annotator reliability milestone."
draft: false
---

# V3 Human Reliability Release Checklist

This checklist is the release gate for the v3.0 Stage 4H/4J human reliability milestone. It should be reviewed before tagging v3 or describing the project as having completed human inter-annotator reliability.

Stage 4H is blind two-human coding. Stage 4J is post-coding adjudication and codebook revision. Neither layer overwrites Stage 4A automatically, and neither layer is averaged with AI-assisted Stage 4B or Stage 4M reliability diagnostics.

## Architecture

- [ ] Stage 4H defined
- [ ] Stage 4J defined
- [ ] Stage 4H distinguished from Stage 4B and Stage 4M
- [ ] No-overwrite rule documented

## Human Coder Materials

- [ ] Training guide complete
- [ ] Calibration guide complete
- [ ] Calibration packet complete
- [ ] Blind packet instructions complete
- [ ] Human coder template complete

## Data

- [ ] Human packets generated
- [ ] Coder A output received
- [ ] Coder B output received
- [ ] Human outputs validated
- [ ] Human-human agreement generated
- [ ] Human-vs-reference comparison generated
- [ ] Human disagreement log generated
- [ ] Human adjudication queue generated

## Adjudication

- [ ] Adjudication decisions completed
- [ ] Adjudication decisions validated
- [ ] Codebook revision notes generated
- [ ] Stage 4A correction candidates exported
- [ ] Claim-audit review candidates exported

## Documentation

- [ ] Human reliability methodology page complete
- [ ] Human reliability results page complete
- [ ] Stage 4J adjudication results page complete
- [ ] Codebook revision notes complete
- [ ] Publication package updated
- [ ] Limitations updated

## Validation

- [ ] `npm run status` passes
- [ ] `npm run validate` passes
- [ ] `npm run stage4h` passes
- [ ] `npm run stage4j` passes when adjudication files exist
- [ ] `npm run pipeline` passes
- [ ] `quarto render` passes

## Scholarly Claims

- [ ] No claim averages AI and human agreement
- [ ] No claim treats human agreement as proof of interpretation
- [ ] No claim treats Stage 4A as automatically correct
- [ ] No claim treats human disagreement as automatic Stage 4A correction
- [ ] Human coders were blind to Stage 4A, Stage 4B, Stage 4M, synthesis claims, and each other's outputs

## Current Pre-Tag Note

In the current repository state, Stage 4H is designed and operational but not executed: no human-filled Stage 4H submissions are present. Stage 4J adjudication is pending: no completed adjudication decisions are present. This is a valid development state and a valid empty-state reporting test, but it is not sufficient for a v3 release claim about completed human-human reliability, adjudicated disagreements, codebook confirmation, or Stage 4A correction candidates.
