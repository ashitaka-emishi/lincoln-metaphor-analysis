# V4 Validation Light Annotation Template

Generated: 2026-08-13

This template supports validation-corpus screening without full Stage 4A annotation. It records limited sentence-level signals for coverage review, negative checks, and future reliability sampling.

## Files

| File | Role |
| --- | --- |
| data/corpus/v4-validation-light-annotation-template.csv | CSV template seeded with one placeholder row per validation-corpus document. |
| schemas/v4-validation-light-annotation.schema.json | Row-level schema and canonical CSV column list. |

## Corpus Boundary

Light annotation is not equivalent to full interpretive annotation. These rows must not be treated as Stage 4A coded metaphor findings, adjudicated reliability data, or final evidence for interpretive claims.

## Columns

| Column | Purpose |
| --- | --- |
| doc_id | Validation-corpus document ID. |
| sentence_id | Stable sentence ID when available; blank in the generated placeholder rows. |
| metaphor_cluster_present | Light yes/no/uncertain screen for any project metaphor cluster. |
| cluster_id | Optional cluster ID for a present or uncertain metaphor signal. |
| key_lexical_unit | Optional lexical cue; not a fully adjudicated metaphor span. |
| agency_absence_flag | Light screen for agency/absence relevance. |
| enslaved_people_present | Light screen for enslaved-people references. |
| black_soldiers_present | Light screen for Black soldier references. |
| disease_purification_present | Negative-check screen for disease/purification language. |
| providence_present | Light screen for providence language. |
| sacrifice_present | Light screen for sacrifice/mourning language. |
| war_powers_present | Light screen for war-powers language. |
| notes | Free-text reviewer notes. |

## Validation

| Measure | Value |
| --- | --- |
| Validation status | pass |
| Template rows | 78 |
| Validation inventory documents | 78 |

## Negative-Check Fields

The template includes `agency_absence_flag`, `disease_purification_present`, `providence_present`, `sacrifice_present`, and `war_powers_present` so validation-corpus review can record both positive signals and negative-check evidence.

## Agency And Race Fields

The template includes `enslaved_people_present` and `black_soldiers_present` so race and agency coverage can be checked separately from full metaphor interpretation.
