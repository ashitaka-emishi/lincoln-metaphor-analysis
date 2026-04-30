# DECISIONS.md — Design Decisions

## Resolved

### Wide corpus (29 documents)
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

### Player aids format
**Question**: Should the player aids (metaphor_reference_cards.md) be formatted as printable cards, as a VSCode panel, or as a reference document?
**Current approach**: Markdown reference document in player_aids/.
**Status**: Open. The current format is functional for annotation work. Format upgrade (printable, interactive) deferred until analytical work is complete.

### Include Confederate rhetoric for comparison?
**Question**: Should a parallel analysis of Confederate political rhetoric be added to make the Hitler comparison triangular (Lincoln / Confederacy / Hitler)?
**Arguments for**: Confederate rhetoric provides a closer contemporary comparison than Hitler; Lincoln and Confederate leaders were arguing with each other.
**Arguments against**: Significantly extends scope; requires new corpus, new annotation; the Hitler comparison is the project's stated focus.
**Status**: Open. Suggested for a subsequent project phase.
