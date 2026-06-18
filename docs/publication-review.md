---
title: "Publication Review"
draft: false
---

This page records the release-candidate review conducted under [issue #65](https://github.com/ashitaka-emishi/lincoln-metaphor-analysis/issues/65). The review evaluates argument clarity, citation completeness, claim strength, navigation, reproducibility, and rendered-site quality. It does not add a new corpus or research question.

## Review Findings

### Argument and framing

- The site title and front-door description now identify Lincoln's rhetoric as the object of study.
- Conceptual Metaphor Theory remains the linguistic foundation; Koenigsberg's analysis is presented as a bounded interpretive contrast rather than the headline comparative object.
- The executive summary, findings, final conclusions, and purification-rhetoric contrast now distinguish corpus findings from broader causal explanations.

### Citations

- A site-wide BibTeX bibliography now supplies references for CMT, MIPVU, Koenigsberg's theoretical model, the LCC benchmark, Black Union military service, and the 54th Massachusetts at Fort Wagner.
- Primary-source links for Lincoln instances remain in the generated claim audit and corpus metadata.
- The publication prose distinguishes primary textual evidence, generated corpus evidence, external benchmark context, and scholarly interpretation.

### Claim calibration

- The Providence trajectory is described as a 1862 trough followed by late-war growth, not as monotonic.
- The 56 `disease_purification_absent` flags are correctly bounded to coded opportunities in texts dated 1838–1862, four phases, and three registers. The separate fantasy-type zero count covers the full selected corpus through 1865.
- Claims about obligation and reconciliation now describe rhetorical framing and affordances rather than deterministic political or psychological causation.
- LCC results are treated as modern general-news benchmark context, not evidence that a metaphor is unique to Lincoln or rare in nineteenth-century political rhetoric.

### Navigation and content hygiene

- Document notes for `doc_004` and `doc_006a`–`doc_006g` are restored to the Analysis sidebar.
- The publication package no longer treats completed roadmap issue #26 as active work.
- The rendered-site link audit checks local targets, fragments, and unique external URLs.

## Validation Record

| Check | Result |
| --- | --- |
| `npm run status` | Pass: 28/28 documents complete through Stage 4; 136 concordance instances |
| `npm run validate` | Pass: schemas and 28 source-provenance checksums valid |
| `npm run pipeline` | Pass: Stages 5–8 regenerated successfully |
| `quarto render` | Pass: 106 pages rendered without warnings |
| `npm run site:links` | Pass: 11,444 internal links and 45 unique external targets across 106 HTML files |
| `npm test` | Pass: 5 regression tests |
| Desktop rendered inspection | Pass at 1280×720: no page overflow or draft leakage; wide audit tables are contained |
| Mobile rendered inspection | Pass at 390×844: navigation works, sidebars collapse, tables scroll, and long paths wrap |
| Basic accessibility inspection | Pass: one page-level H1, ordered headings, named native navigation controls, and WCAG AA text contrast |

## Residual Limitations

- The corpus contains 28 selected documents and is not the complete Lincoln archive.
- Reliability is AI-assisted rather than a blind two-human inter-annotator study.
- LCC is a modern general-news benchmark, not a nineteenth-century American political comparison corpus.
- The positive purification-opportunity flags are not diachronically complete after 1862; later support rests on the full-corpus zero count and selected reviewed negative cases.
- The project establishes textual and rhetorical patterns, not audience reception, private belief, or complete political causality.

## Release Recommendation

**Publish after review and merge.** No publication-blocking finding remains. The limitations above should travel with the release, and future comparison-corpus or human-coding work should be presented as a later research phase rather than as a prerequisite for this publication package.
