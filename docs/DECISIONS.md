# DECISIONS.md — Design Decisions

## Resolved

### Wide corpus (28 documents)
**Decision**: Include all major public addresses, campaign speeches, semi-public letters, legal documents, and private fragments from 1838–1865.
**Rationale**: Prevents cherry-picking. The register field carries the methodological weight that corpus restriction would otherwise carry. Narrow corpora (formal addresses only) would find denser metaphor but could not distinguish temporal from register effects.
**Implication**: All frequency claims must be register-controlled before publication.

### CMT + Koenigsberg dual framework
**Decision**: Apply both CMT (Lakoff & Johnson) and Koenigsberg's ideological fantasy analysis to every annotated instance.
**Rationale**: CMT maps structure; Koenigsberg maps function. CMT alone cannot explain why the violence feels necessary; Koenigsberg alone lacks the linguistic precision to identify specific entailments.
**Implication**: Every instance has both a `cmt` object and a `koenigsberg` object in the schema.

### Structured JSON output at every stage
**Decision**: All stages produce JSON (not prose notes or spreadsheets).
**Rationale**: Enables programmatic analysis (Stage 5 concordance, Stage 6 statistics), version control, and future visualization without re-annotation.
**Implication**: Schema discipline required throughout; validate_schema.js catches violations.

### Lincoln diachronic axis as primary analytical frame
**Decision**: Track all clusters and constructs across the five-phase diachronic structure.
**Rationale**: Lincoln's metaphor system develops over time; treating the corpus synchronically would miss the guilt_distribution arc, the birth/theodicy shift, and the relationship between phases.
**Implication**: All cluster analyses must include diachronic.by_year data; register-controlled diachronic analysis required.

### Absence thread as required deliverable
**Decision**: Systematic absence analysis (systematic_absence.md) is a required deliverable, not optional commentary.
**Rationale**: The erasure of enslaved people and Black soldiers from Lincoln's metaphor system is not peripheral — it is the project's second central finding, alongside the disease_and_purification absence.
**Implication**: absence_flags must be populated for every annotated instance; the koenigsberg_comparativist must complete systematic_absence.md as a named deliverable.

### Publication scope for upgrade milestone
**Decision**: The current pipeline-upgrade milestone targets the minimum viable scholarly upgrade, not the full 15-stage rebuild described in docs/upgrade.md.
**Rationale**: The existing 28-document Stage 1-7 pipeline already contains the structured corpus, annotations, concordance, analysis outputs, and LCC benchmark scaffold needed for a publishable package. The milestone should add missing scholarly controls--research design, provenance, codebook, reliability sample, register/confidence controls, audit trail, revised synthesis, and publication packaging--without expanding into a full replatforming.
**Implication**: The 15-stage design remains the long-range roadmap. Work in this milestone should stay bounded to the issue tracker unless a later issue explicitly changes scope.

### Evidence-chain schema as derivative layer
**Decision**: Preserve validated Stage 4 annotation files as the legacy source of record and generate a derivative Stage 4A evidence-chain file at `data/evidence/annotation-evidence.json`.
**Rationale**: Rewriting all Stage 4 files would risk silent data loss and violate the project's stage-immutability discipline. A generated derivative layer can normalize MIPVU, provenance, CMT, Koenigsberg, confidence, agency, and claim-anchor fields while preserving permanent sentence IDs and original annotations.
**Implication**: Publication claims should cite Stage 4A evidence records for audit trails. Future schema migrations can tighten legacy free-text fields only through documented migration scripts and validation updates.

### Reliability as a generated Stage 4B layer
**Decision**: Define reliability through generated Stage 4B artifacts: `data/reliability/reliability-sample.json`, `data/reliability/double-coding-template.csv`, and `data/reliability/adjudication-log.csv`.
**Rationale**: Reliability work needs to be auditable without editing validated Stage 4 files. A generated sample can select documents from the corpus manifest and Stage 4A evidence layer, expose blank coding templates to independent coders, and keep adjudication traceable.
**Implication**: Reliability reporting must distinguish MIPVU identification reliability from CMT and Koenigsberg interpretive agreement. Any adjudicated annotation change requires a documented migration or derivative correction layer, not an ad hoc Stage 4 edit.

### Controlled analysis as Stage 6A
**Decision**: Add generated Stage 6A controlled outputs at `analysis/controlled-analysis.json` and `analysis/controlled_outputs.md`.
**Rationale**: Raw frequency counts cannot support publication claims until they are checked by register and by the `authorship_confidence >= 0.95` subset. The corpus manifest is the canonical source for register and authorship-confidence metadata, so Stage 4A and Stage 6A must prefer manifest values over legacy instance metadata.
**Implication**: Synthesis prose should cite full-corpus counts only as descriptive. Publication-stable claims must either survive the controlled views or explicitly name the register/authorship limitation.

### Claim audit as generated Stage 8 layer
**Decision**: Add a generated claim-to-source audit at `data/audit/claim-audit.json` with a public page at `synthesis/claim_audit.md`.
**Rationale**: Major interpretive claims need a stable handle and a reviewer-readable path back to clusters, CMT mappings, lexical units, sentence IDs, document metadata, and source text. A generated audit keeps selected examples readable while preserving the full matching audit-ID universe in JSON.
**Implication**: Synthesis pages should cite claim IDs for major claims. Adding or changing a major claim should update `scripts/build_claim_audit.js` so the audit remains reproducible.

### Add 1863 and 1864 Annual Messages?
**Decision**: Do not add the 1863 and 1864 Annual Messages to the current 28-document publication corpus.
**Arguments for adding**: The two messages would provide fuller diachronic coverage of the `congressional_message` register after emancipation; the 1863 message would test post-Gettysburg administrative rhetoric; the 1864 message would test the re-election and late-war congressional register.
**Arguments against adding now**: The current publication claims do not generalize across the full annual-message series. They use register controls to show that congressional messages are a distinct, lower-density administrative register. The existing corpus already includes two high-priority congressional messages, `doc_010` and `doc_014`, with 12 total metaphor instances and strong cluster_03 experiment/proof coverage. Adding two long official documents would require source acquisition, segmentation, annotation, validation, controlled-output regeneration, and synthesis review; that is implementation work beyond this decision-only issue.
**Sufficiency for current claims**: Current synthesis claims remain bounded to the annotated 28-document corpus and to register-controlled outputs. Congressional-message evidence is used to support register sensitivity and the experiment/proof cluster's legislative-administrative mode, not to claim exhaustive coverage of every annual message. The absence of the 1863 and 1864 messages should therefore be named as a corpus boundary, not treated as a blocker.
**Future condition**: A later expansion can add the two messages if a new research question requires a complete congressional-message subcorpus or if publication review specifically asks for annual-message coverage. That work should be filed as a separate implementation issue with source acquisition, segmentation, annotation, validation, and generated-output updates.
**Status**: Resolved for the current publication package. No corpus files are added under this decision.

### Seward-origin passages in the First Inaugural
**Decision**: Keep the First Inaugural (`doc_009`) in the corpus as a Lincoln-primary address, but use sentence-level authorship controls for the closing peroration.
**Control tiers**: (1) received First Inaugural text for claims about the public address; (2) Lincoln-adopted Seward-origin wording for passages Lincoln accepted and revised; (3) strict Lincoln-origin evidence for claims about Lincoln's independent metaphor profile.
**Affected instances**: `inst_00076` ("bonds of affection") is retained for received-text and Lincoln-adopted analysis but caveated as Seward-origin wording. `inst_00077` ("mystic chords of memory") is retained only for received-text analysis and excluded from Lincoln-sole or strict Lincoln-origin claims.
**Rationale**: Document-level exclusion would throw out stable Lincoln-origin covenant and Providence evidence. Unqualified inclusion would let the most novel cluster_01 image carry too much Lincoln-sole weight. Sentence-level control preserves both the public address and the authorship limitation.
**Implication**: The First Inaugural still supports the claim that covenant and Providence are active at the war's opening. Claims about the novel body-memory/chord metaphor must be caveated as received-text evidence rather than Lincoln-origin evidence.
**Status**: Resolved for the current publication package. Future diplomatic collation or a Seward comparison corpus can refine the boundary without changing the current Stage 4 files.

---

## Unresolved

### Debate transcription variant strategy
**Question**: The Lincoln-Douglas debates exist in two newspaper transcriptions with known discrepancies. How should variants be handled?
**Options**:
  A. Use one source consistently (Chicago Press & Tribune for Lincoln)
  B. Note variants in annotation_notes case by case
  C. Create a variant apparatus for high-stakes spans
**Current approach**: Option B (note variants in annotation_notes, apply −0.05 confidence adjustment).
**Status**: Open. If variant divergences prove analytically significant (a metaphor present in one transcription, absent in another), escalate to Option C for those spans.

### Include Confederate rhetoric for comparison?
**Question**: Should a parallel analysis of Confederate political rhetoric be added to contextualize the purification-rhetoric contrast with a contemporary Confederate corpus?
**Arguments for**: Confederate rhetoric provides a closer contemporary comparison than Hitler; Lincoln and Confederate leaders were arguing with each other.
**Arguments against**: Significantly extends scope; requires new corpus, new annotation; the current publication frame keeps Koenigsberg's Hitler analysis as bounded theoretical background rather than the headline comparative object.
**Status**: Open. Suggested for a subsequent project phase.
