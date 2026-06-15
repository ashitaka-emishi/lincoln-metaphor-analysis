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

---

## Unresolved

### Add 1863 and 1864 Annual Messages?
**Question**: The 1862 Annual Message (doc_014) is included. Should the 1863 and 1864 Annual Messages be added?
**Arguments for**: More complete diachronic coverage of the congressional_message register; the 1863 message responds to emancipation; the 1864 message responds to re-election context.
**Arguments against**: Corpus is already wide; marginal analytical return; would require adding 2 documents and extending annotation work.
**Status**: Open. Revisit after Stage 4 is complete; if congressional_message register is analytically thin, add the 1863/1864 messages.

### Debate transcription variant strategy
**Question**: The Lincoln-Douglas debates exist in two newspaper transcriptions with known discrepancies. How should variants be handled?
**Options**:
  A. Use one source consistently (Chicago Press & Tribune for Lincoln)
  B. Note variants in annotation_notes case by case
  C. Create a variant apparatus for high-stakes spans
**Current approach**: Option B (note variants in annotation_notes, apply −0.05 confidence adjustment).
**Status**: Open. If variant divergences prove analytically significant (a metaphor present in one transcription, absent in another), escalate to Option C for those spans.

### Include Confederate rhetoric for comparison?
**Question**: Should a parallel analysis of Confederate political rhetoric be added to make the Hitler comparison triangular (Lincoln / Confederacy / Hitler)?
**Arguments for**: Confederate rhetoric provides a closer contemporary comparison than Hitler; Lincoln and Confederate leaders were arguing with each other.
**Arguments against**: Significantly extends scope; requires new corpus, new annotation; the Hitler comparison is the project's stated focus.
**Status**: Open. Suggested for a subsequent project phase.
