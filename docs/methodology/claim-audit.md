---
title: "Claim Audit Method"
draft: false
---

# Claim Audit Method

The claim audit connects publication-level claims to the structured evidence chain. It is generated with:

```bash
npm run audit:claims
```

Outputs:

| Artifact | Role |
| --- | --- |
| `data/audit/claim-audit.json` | Complete machine-readable audit, including all matching audit IDs for each claim |
| `synthesis/claim_audit.md` | Public reviewer-facing table with selected evidence rows |

## Audit Chain

Each claim uses this path:

```text
scholarly claim
  -> metaphor cluster
  -> CMT mapping
  -> metaphor-related lexical unit
  -> MIPVU decision
  -> instance ID
  -> sentence ID
  -> document metadata
  -> source text
```

The public table is intentionally compact. It shows selected records that make the logic inspectable. The JSON artifact preserves the full matching universe of audit IDs for each claim.

## Reading Rules

- Treat `claim_id` as the citation handle for synthesis prose.
- Use `selected_records` for human inspection.
- Use `evidence_universe.matching_audit_ids` when checking whether a claim is based on a small example set or a broader pattern.
- Use `controlled_reference` and [Controlled Outputs](../../analysis/controlled_outputs.md) before treating an aggregate count as publication-stable.
- Follow the `source_url` back to the source edition when exact wording matters.

## Limits

The audit layer does not create new evidence. It organizes the Stage 4A evidence-chain records into claim-level review paths.

Negative claims, especially the absence of `disease_and_purification`, depend on both validated zero counts and positive absence flags. The audit JSON therefore stores the matching absence-flag universe as well as selected examples.
