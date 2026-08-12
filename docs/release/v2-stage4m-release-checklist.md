---
title: "V2 Stage 4M Release Checklist"
description: "Pre-tag checklist for the v2.0 multi-model reliability stress-test milestone."
draft: false
---

This checklist is the release gate for the v2.0 Stage 4M milestone. It should be reviewed before tagging v2 or describing Stage 4M as a completed reliability stress test.

Stage 4M is an AI-assisted model-review layer. It is not human inter-annotator reliability, and model output is never historical evidence or authority to revise Stage 4A.

## Data

- [ ] Model packets generated with `npm run stage4m:packets`
- [ ] At least two model-output submissions ingested
- [ ] Model-output submissions validated
- [ ] Normalized model runs generated
- [ ] Agreement metrics generated
- [ ] Disagreement log generated
- [ ] Adjudication queue generated
- [ ] Empty-state outputs preserved when no submissions exist

## Documentation

- [ ] Stage 4M methodology page complete
- [ ] Stage 4M results page complete
- [ ] Model-review instructions complete
- [ ] Stage 4M codebook revision notes complete
- [ ] Publication package updated
- [ ] Limitations updated
- [ ] AI-use statement reviewed
- [ ] Human-review and migration boundaries documented

## Validation

- [ ] `npm run status` passes
- [ ] `npm run validate` passes
- [ ] `npm run stage4m` passes
- [ ] `npm run pipeline` passes
- [ ] `quarto render` passes
- [ ] Generated outputs are fresh after the final validation run

## Scholarly Claims

- [ ] No claim says Stage 4M is human inter-annotator reliability
- [ ] No claim treats AI output as evidence about Lincoln's rhetoric
- [ ] No model consensus automatically changes Stage 4A
- [ ] Human adjudication boundary is explicit
- [ ] Stage 4B, Stage 4M, and future human double-coding are distinguished
- [ ] No publication text claims model convergence or field stability before validated submissions exist

## Current Pre-Tag Note

In the current repository state, Stage 4M is designed and operational but not executed: no external model submissions are present. This is a valid development state and a valid empty-state reporting test, but it is not sufficient for a release claim about model agreement, model disagreement, field stability, or codebook confirmation.
