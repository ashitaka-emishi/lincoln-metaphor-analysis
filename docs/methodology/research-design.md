---
title: "Research Design"
draft: false
---

# Research Design

## Project Aim

This project studies how Abraham Lincoln's metaphor system authorized Civil War violence while preserving structural exit conditions that made reconciliation possible rather than annihilation.

The research design formalizes the scope for the "Pipeline upgrade + publishability hardening" milestone. Its purpose is to keep the project publication-oriented: claims must be traceable to structured corpus data, the interpretive sequence must be explicit, and out-of-scope expansions must not silently become required work.

## Publication Scope

This milestone targets the **minimum viable scholarly upgrade**, not the full 15-stage pipeline transformation described in `docs/upgrade.md`.

The full 15-stage design remains the long-range methodological roadmap. For the current publication package, the project will harden the existing Stage 1-7 pipeline and add the missing scholarly controls needed for reviewable claims:

| In scope for this milestone | Purpose |
| --- | --- |
| Research design | Fix the research question spine, corpus boundaries, sequence, and validation plan |
| Corpus register and provenance layer | Make the 28-document corpus inspectable by date, register, authorship, source, and risk |
| Annotation codebook and controlled vocabularies | Separate identification decisions from interpretive mappings |
| Schema upgrade for evidence chains | Preserve sentence IDs while making claim-to-source audit possible |
| Reliability sample and adjudication workflow | Test coding stability without replatforming the entire corpus |
| Register- and confidence-controlled outputs | Prevent aggregate claims from depending on genre mix or uncertain authorship |
| Claim-to-source audit trail | Link major findings to cluster, mapping, sentence ID, metadata, and source text |
| Synthesis revision | Align final claims with validated outputs and named limitations |
| Publication package | Prepare a coherent site/article appendix with method, data, validation, and AI-use disclosures |

The milestone does not promise a complete rebuild into separate TEI, MIPVU, CMT, discourse-analysis, and synthesis repositories. It adds only the pieces needed to make the existing structured corpus credible, inspectable, and publishable.

## Primary Research Question

How does Lincoln's metaphor system authorize mass violence while preserving structural exit conditions that make reconciliation possible rather than annihilation?

## Secondary Research Questions

- Which metaphor clusters structure Lincoln's Civil War rhetoric?
- How does the metaphor system make war feel obligatory rather than chosen?
- Which agents or groups are systematically absent from the roles the metaphors make available?
- What structural difference separates Lincoln's rhetoric from purification-based political rhetoric?
- How do register, chronology, and authorship confidence change the strength or limits of these claims?

The first four questions align with the project's README and synthesis pages. The fifth is the publication-control question: no frequency or distribution claim should be treated as stable until it has been tested by register and authorship-confidence subset.

## Corpus Scope

The corpus is the existing 28-document Lincoln corpus defined in `corpus/corpus_manifest.json`.

| Corpus property | Current scope |
| --- | --- |
| Date range | 1838-01-27 through 1865-04-11 |
| Documents | 28 |
| Authorship | 20 `lincoln_sole`; 8 `lincoln_primary` |
| High-confidence subset | 13 documents with `authorship_confidence >= 0.95` |
| Registers | 10 formal public addresses; 9 campaign speeches; 3 semi-public letters; 2 congressional messages; 2 legal documents; 2 private fragments |

The corpus is wide by design. Register fields carry the methodological weight that a narrower corpus restriction would otherwise carry. Formal addresses, campaign speeches, legal documents, letters, fragments, and congressional messages should not be collapsed into a single rhetorical environment.

## Inclusion Criteria

Texts are included when they meet all or most of these conditions:

- They fall within Lincoln's political career and wartime rhetorical arc, 1838-1865.
- Lincoln is sole or primary author according to the project manifest.
- They are analytically relevant to at least one of the six metaphor clusters or to a diachronic transition in the system.
- They help cover a distinct register, historical moment, or rhetorical situation.
- They can be assigned stable document, section, paragraph, and sentence identifiers.
- Source provenance and risk flags can be documented.

## Corpus-Design Boundary Decisions

The 1863 and 1864 Annual Messages are not added to the current publication corpus. The corpus already includes two congressional messages (`doc_010` and `doc_014`) and uses [Controlled Outputs](../../analysis/controlled_outputs.md) to keep congressional-message evidence register-bounded. Current claims do not depend on complete annual-message coverage. Adding the two later messages would be a future expansion requiring source acquisition, segmentation, annotation, validation, and generated-output updates.

The First Inaugural (`doc_009`) remains in scope as a Lincoln-primary address with a sentence-level Seward control. The received-text address can support claims about the public inaugural rhetoric, but authorship-sensitive claims use the three-tier control documented in [doc_009 notes](../../analysis/document_notes/doc_009_notes.md): received text, Lincoln-adopted Seward-origin wording, and strict Lincoln-origin evidence. This prevents the Seward-origin/revised "mystic chords" passage from carrying Lincoln-sole claims while retaining the document's stable covenant and Providence evidence.

## Exclusion Criteria

The current milestone excludes:

- New primary-source expansion unless a later issue explicitly adds it.
- The 1863 and 1864 Annual Messages, which are a resolved non-addition for the current publication package and can only be added by a future implementation issue.
- A parallel Confederate, abolitionist, Democratic, or broader nineteenth-century comparison corpus.
- Audience reception analysis, public-opinion effects, or claims about how specific listeners processed Lincoln's metaphors.
- Biographical claims about Lincoln's private psychology beyond what the corpus can support.
- Moral-equivalence claims in the purification-rhetoric contrast.
- Any ad hoc edit to a completed Stage N file when the work belongs in Stage N+1 or in a documented migration.

External corpora may be used as benchmarks, as with the LCC Metaphor Dataset, but they are not part of the primary Lincoln corpus.

## Units of Analysis

| Unit | Role |
| --- | --- |
| Document | Historical and bibliographic object with source, date, register, authorship, and risk metadata |
| Section | Major rhetorical division, including speaker-turn boundaries in debate documents |
| Paragraph | Local argumentative unit |
| Sentence | Permanent citable unit from Stage 3; the main anchor for annotation and audit |
| Lexical unit | MIPVU identification unit for metaphor-related language |
| Metaphor instance | Structured Stage 4 evidence object linked to sentence context |
| Cluster | Corpus-level conceptual grouping used for distribution and synthesis |
| Absence flag | Structured marker for expected but missing agency, role, or fantasy type |
| Claim | Publication-level statement requiring a traceable evidence chain |

Sentence IDs are permanent. Any schema upgrade must preserve Stage 3 identifiers and avoid renumbering previously validated corpus files.

## Methodological Sequence

The study uses a staged sequence:

1. **Corpus provenance and segmentation**: establish stable texts, metadata, register categories, authorship confidence, and sentence IDs.
2. **MIPVU identification**: identify metaphor-related lexical units before assigning conceptual or ideological meaning.
3. **Historical semantics control**: document period-specific basic meanings for difficult lexical units.
4. **CMT mapping**: interpret metaphor-related lexical units as source-target mappings with entailments and rival readings.
5. **Corpus-assisted discourse analysis**: measure distribution, chronology, register effects, co-activation, concentration, and confidence-subset stability.
6. **Rhetorical, genre, and absence analysis**: interpret how occasion, audience, agency, and systematic silence shape the metaphors' function.
7. **Koenigsbergian synthesis**: interpret obligatory frame, sacrificial economy, guilt distribution, psychic defense, violence logic, and reconciliation only after the linguistic and corpus layers are established.
8. **Claim audit and publication synthesis**: connect major claims back to cluster, mapping, lexical unit, sentence ID, document metadata, and source text.

This order is a methodological commitment. MIPVU identifies metaphor-related words; CMT maps conceptual structure; corpus and discourse analysis test distribution and rhetorical patterning; Koenigsbergian analysis synthesizes political-psychological function.

## Annotation Sequence

For each document or migrated annotation layer:

1. Confirm the document's manifest metadata, source provenance, register, authorship confidence, and risk flags.
2. Preserve existing Stage 3 sentence IDs and Stage 4 validated annotation files.
3. Identify metaphor-related lexical units using MIPVU or record why a migrated instance is treated as equivalent evidence.
4. Assign CMT fields only after the lexical-unit decision is documented.
5. Assign Koenigsberg fields only after the CMT mapping and entailments are documented.
6. Record absence flags where the metaphor system makes an agent, role, body, or fantasy type logically available but the rhetoric suppresses or displaces it.
7. Record confidence, rival readings, negative cases, and notes for contested interpretations.
8. Validate every written Stage 4 file immediately with `npm run validate:annotation -- <doc_id>`.
9. Run corpus-wide validation before regenerating concordance or analysis outputs.

## Validation Strategy

The publication upgrade uses four validation layers:

| Layer | Validation |
| --- | --- |
| Schema validation | `npm run validate:annotation -- <doc_id>` after Stage 4 writes; `npm run validate` before aggregate stages |
| Pipeline validation | `npm run status`, `npm run validate`, `npm run pipeline`, and `quarto render` before publication-ready PRs |
| Method validation | Reliability sample, adjudication log, controlled vocabularies, historical semantics notes, and rival readings |
| Claim validation | Register-controlled results, authorship-confidence subset, LCC benchmark where relevant, and claim-to-source audit |

Absence claims require special discipline. A simple zero count is not enough. Publication-level absence findings must identify the opportunity structure: where the metaphor system made an agent, role, or fantasy type available and the rhetoric did not take it up.

## Evidence Standards

- Frequency claims must come from generated JSON or generated tables, not prose memory.
- Register-sensitive claims must be reported with register controls.
- Authorship-sensitive claims must be checked against the `authorship_confidence >= 0.95` subset.
- Authorship-sensitive claims about `doc_009` must also name the Seward sentence-level control when they depend on inst_00076 or inst_00077.
- Interpretive claims must cite sentence IDs or claim-audit entries.
- Comparative claims must name the compared structural dimension and avoid moral equivalence.
- Negative cases and rival readings must be preserved when they limit the strength of a finding.

## AI-Use Policy

AI tools may assist with corpus preparation, annotation support, validation scripting, synthesis drafting, and publication packaging. AI output is not evidence. The human researcher remains responsible for research design, source selection, method, interpretive judgment, and final claims.

## Expected Outputs

By the end of this milestone, the project should have:

- A research-design document in the methodology docs.
- A corpus register and provenance layer aligned with the manifest.
- An annotation codebook and controlled vocabularies.
- Schema and migration support for publishable evidence chains.
- A reliability sample and adjudication workflow.
- Register- and confidence-controlled analysis outputs.
- A claim-to-source audit trail for major findings.
- Revised synthesis pages that distinguish established findings, limitations, and open questions.
- A publication package that includes methodology, validation, data/reproducibility notes, AI-use disclosure, and site-rendered evidence.

The resulting publication package should let a reviewer move from a major claim to the underlying cluster, mapping, lexical unit, sentence ID, document metadata, and source text without relying on trust in the prose alone.
