---
title: "Evidence Chain Schema"
draft: false
---

The evidence-chain layer makes publication claims auditable without rewriting validated Stage 4 annotations.

## Migration Decision

The project preserves current Stage 4 annotated JSON files as the legacy annotation layer and generates a derivative **Stage 4A evidence-chain layer**:

```bash
npm run evidence:chains
```

Output:

```text
data/evidence/annotation-evidence.json
```

This choice protects permanent sentence IDs and avoids silent data loss. The derivative file normalizes the fields needed for publication review while keeping the original Stage 4 files as the source of record.

## Audit Chain

Each evidence record supports this path:

```text
claim
  -> cluster
  -> CMT mapping
  -> lexical unit / MIPVU decision
  -> instance ID
  -> sentence ID
  -> document metadata
  -> source edition and URL
```

## Record Shape

Each record in `data/evidence/annotation-evidence.json` contains:

| Block | Purpose |
| --- | --- |
| `audit_id` | Stable audit key, equal to the Stage 4 `instance_id`. |
| `migration_status` | Explains that the record derives from the Stage 4 legacy annotation. |
| `document` | Document ID, title, date, period, genre, register, authorship, source edition, URL, editorial status, and risk flags. |
| `location` | Section ID, paragraph ID, sentence ID, sentence text, span text, and character offsets. |
| `lexical_unit` | MIPVU-facing fields: lexical-unit text, decision, contextual meaning, basic meaning, contrast, comparison, historical-semantics note, and migration note. |
| `cmt` | Cluster, source domain, source-domain family, target domain, target-domain family, linguistic form, entailments, mapping, extension metadata, and notes. |
| `koenigsberg` | Fantasy type, violence logic, obligatory frame, projected entity, guilt distribution, sacrificial economy, and psychic defense. |
| `agency_absence` | Agent/object of violence, abstract agency, absence flags, and absence notes. |
| `confidence` | Confidence score, ambiguity, rival reading, irony, and suppression metadata. |
| `claim_anchor` | Compact citation object for claim-to-source references. |

## MIPVU Migration Rule

The existing Stage 4 files did not separate MIPVU lexical-unit decisions from CMT source-target mapping. Stage 4A therefore derives:

- `lexical_unit.text` from `span_text`
- `mipvu_decision` as `metaphor_related`
- `contextual_meaning` from `cmt.target_domain`
- `basic_meaning` from `cmt.source_domain`
- `contrast` and `comparison` as `true`

Every record stores `mipvu_decision_source: inferred_from_existing_stage4_metaphor_instance` and a `migration_note` so reviewers can see that the MIPVU fields are a derivative normalization, not a hidden rewrite of the original annotation.

## Validation

`npm run validate` checks:

- `annotation-evidence.json` exists.
- `total_records` matches the record array length.
- `migration_policy` is `preserve_stage4_generate_derivative`.
- Every record has document, source URL, sentence ID, span text, lexical-unit text, MIPVU decision, contextual meaning, basic meaning, CMT cluster, CMT entailments, Koenigsberg fantasy type, absence flags, confidence score, and claim anchor.
- Cluster IDs, fantasy types, and absence flags match the existing validated vocabularies.
- Confidence scores remain in `[0.50, 1.00]`.

## Limits

Stage 4A does not claim that the historical-semantics apparatus is complete. Where Stage 4 did not contain a distinct historical-semantics note, the field remains `null`.

Some existing Stage 4 fields, especially `violence_logic`, `projected_entity`, and `guilt_distribution`, contain legacy descriptive prose rather than strict enum values. The evidence-chain layer preserves those values to avoid data loss. A later migration can convert them into stricter arrays after the controlled-vocabulary policy is finalized.
