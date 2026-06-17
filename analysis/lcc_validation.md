---
title: "Stage 7: LCC Benchmark Validation"
---

# Stage 7: LCC Metaphor Dataset Validation

*Completed 2026-05-02 and updated 2026-06-17. Baseline page originally based on en_small.xml (8,724 parsed valid annotations). Stage 7 now also supports and has evaluated the larger LCC English dataset as an optional local benchmark.*

---

## What the LCC Dataset Is

The **LCC Metaphor Dataset** (Mohler et al. 2016) is the largest publicly available annotated metaphor corpus. The English small subset contains 8,724 valid annotations drawn from general news text, with human metaphoricity scores (0–3), source-concept labels from a ~114-category taxonomy, and target-concept labels from a ~32-category taxonomy. Multiple annotators score each instance; the aggregated score is used here.

It provides a baseline for what a general English metaphor system looks like — what source-concept categories appear, and at what frequency. Lincoln's six clusters can then be situated against that baseline.

---

## Why This Matters for the Lincoln Project

Lincoln's metaphor system was identified and described from within the corpus. Stage 7 asks a comparative question: how does Lincoln's metaphor vocabulary look against the full range of concepts English speakers use metaphorically?

This has two analytical uses:

1. **External validation of scope**: clusters that appear prominently in both Lincoln and LCC are doing common English metaphor work. Clusters with no LCC parallel are Lincoln-specific constructions.
2. **Absence quantification**: LCC establishes which conceptual domains appear frequently in general English but are absent from Lincoln. Those absences are analytically significant, not just null results.

---

## Lincoln Corpus Summary

| Cluster | Name | Instances |
| --- | --- | --- |
| `cluster_01_body_organism` | Nation as organism / body | 34 |
| `cluster_02_covenant_oath` | Union as covenant / oath | 17 |
| `cluster_03_experiment_proposition` | Republic as experiment / proposition | 20 |
| `cluster_04_birth_creation` | War as birth / new creation | 8 |
| `cluster_05_fathers_inheritance` | Founding fathers as inheritance | 35 |
| `cluster_06_providence_theodicy` | Providence / divine will | 22 |

**Total:** 136 instances. High-confidence (≥0.90): 51.

---

## LCC Baseline

| Metric | Value |
| --- | --- |
| Total annotations | 8,724 |
| Metaphorical (avg score > 0) | 4,417 (50.6%) |
| Literal (avg score = 0) | 4,307 (49.4%) |

### Top LCC Source Concepts (metaphorical instances)

| Rank | Concept | Count |
| --- | --- | --- |
| 1 | OTHER | 161 |
| 2 | MOVEMENT | 132 |
| 3 | PROTECTION | 106 |
| 4 | DISEASE | 100 |
| 5 | STRUGGLE | 99 |
| 6 | BUILDING | 91 |
| 7 | PHYSICAL_HARM | 88 |
| 8 | VISION | 85 |
| 9 | RESOURCE | 80 |
| 10 | PHYSICAL_BURDEN | 76 |
| 11 | MACHINE | 74 |
| 12 | BODY_OF_WATER | 72 |
| 13 | CONFINEMENT | 70 |
| 14 | UPWARD_MOVEMENT | 69 |
| 15 | PHYSICAL_LOCATION | 68 |
| 16 | DOWNWARD_MOVEMENT | 68 |
| 17 | SHAPE | 66 |
| 18 | EMOTION_EXPERIENCER | 65 |
| 19 | HUMAN_BODY | 63 |
| 20 | OBJECT_HANDLING | 60 |

### Large LCC Cross-Check

The optional `en_large` path was evaluated locally on 2026-06-17 with `npm run stage7:large`. It parsed 52,118 valid annotations from `en_large.xml`, including 27,956 metaphorical annotations. DISEASE remains a prominent source concept in the larger path: rank 10, with 538 metaphorical instances.

| LCC path | Valid annotations | Metaphorical annotations | DISEASE rank | DISEASE count |
| --- | ---: | ---: | ---: | ---: |
| `en_small` | 8,724 | 4,417 | 4 | 100 |
| `en_large` | 52,118 | 27,956 | 10 | 538 |

The large cross-check strengthens the baseline inference by showing that DISEASE prominence is not an artifact of the small subset. It does not remove the main benchmark limitation: both LCC paths are general English/news-text baselines, not nineteenth-century American political corpora.

---

## Domain Coverage Analysis

### LCC Concepts Matched to Lincoln Clusters

| LCC Source Concept | LCC Count | Lincoln Cluster |
| --- | --- | --- |
| DISEASE | 100 | Nation as organism / body |
| BODY_OF_WATER | 72 | Nation as organism / body |
| UPWARD_MOVEMENT | 69 | War as birth / new creation |
| DOWNWARD_MOVEMENT | 68 | War as birth / new creation |
| HUMAN_BODY | 63 | Nation as organism / body |
| WAR | 54 | War as birth / new creation |
| NATURAL_PHYSICAL_FORCE | 36 | War as birth / new creation |
| LIGHT | 32 | Providence / divine will |
| SCIENCE | 31 | Republic as experiment / proposition |

**4 of 6 Lincoln clusters** have direct LCC concept matches.

### Clusters with No LCC Concept Match

| Cluster | Name | Why No LCC Match |
| --- | --- | --- |
| `cluster_02_covenant_oath` | Union as covenant / oath | CONTRACT, OATH, OBLIGATION are not prominent LCC source-concept categories |
| `cluster_05_fathers_inheritance` | Founding fathers as inheritance | INHERITANCE, PATRIMONY, ANCESTRAL_DEBT have no LCC category equivalent |

These two clusters represent Lincoln-specific political constructions with no strong parallel in general English metaphor. They are not common ways English speakers metaphorize social reality; they are Lincoln's particular rhetorical architecture.

### LCC Concepts Absent from Lincoln

These are source-concept categories that rank in the top 20 of general English metaphor usage but have no Lincoln cluster equivalent:

| LCC Concept | LCC Count | Interpretation |
| --- | --- | --- |
| MOVEMENT | 132 | Lincoln does not frame politics as a journey or progress path |
| PROTECTION | 106 | Defensive/shielding logic absent; Lincoln frames obligation, not safety |
| BUILDING | 91 | Architecture metaphors for institutions are absent |
| PHYSICAL_HARM | 88 | Non-war physical harm (assault, damage) absent; harm is framed as wound or war |
| VISION | 85 | Sight/light metaphors exist only in the Providence cluster (LIGHT), not as general epistemic tools |
| RESOURCE | 80 | Economic/resource metaphors absent from Lincoln's political language |
| MACHINE | 74 | Mechanical logic for political institutions entirely absent |
| CONFINEMENT | 70 | Containment/enclosure logic absent (notable given slavery as the central subject) |
| GAME | 57 | Competition/game framing absent; Lincoln does not frame politics as contest |
| ANIMAL | 55 | Animal metaphors absent |

---

## Analytical Significance

### Confirmed: Disease/Purification Absence Is Anomalous Against LCC General-English Baselines

DISEASE is the 4th most common source concept in `en_small` general English metaphor (100 instances) and remains prominent in `en_large` (rank 10; 538 instances). Lincoln's corpus does use disease language — but exclusively to mark the wound/healing cluster_01, never to construct a social group as pathogen. This confirms that the absence of `disease_and_purification` logic ([Finding 2](../synthesis/findings.md)) is not explained by DISEASE being a rare or unavailable English source domain. Lincoln deploys the DISEASE source domain as wound, not as infection requiring expulsion.

This evidence has three layers and they should not be collapsed:

1. **Validated zero count**: the Stage 4-6 Lincoln corpus contains zero `disease_and_purification` fantasy-type instances.
2. **Positive absence evidence**: 56 `disease_purification_absent` flags mark cases where purification logic was structurally available but not deployed.
3. **External-baseline inference**: LCC `en_small` and `en_large` show that DISEASE is common in general English metaphor, so Lincoln's zero pathogen-group mapping is anomalous against general-English baselines.

No implemented contemporary comparison corpus currently tests the same absence against Union, Confederate, abolitionist, or presidential-register controls. Those corpora remain candidate benchmarks in [External Benchmarks](../docs/methodology/external-benchmarks.md). The current external claim is therefore a general-English benchmark claim, not yet a period-specific political-culture claim.

### Confirmed: Covenant and Inheritance Are Lincoln-Specific Constructs

The two clusters without LCC matches — cluster_02 (covenant/oath) and cluster_05 (founding fathers/inheritance) — are Lincoln's most distinctively political constructions. General English speakers do not commonly frame social reality through the metaphors of sworn covenants and patrimonial inheritance. These are not default metaphors; they are Lincoln's rhetorical architecture, built specifically to make the Union's continuation feel obligatory.

This confirms the [Finding 4](../synthesis/findings.md) analysis: the obligatory frame is not a side effect of common metaphor use. It is a product of Lincoln's specific choice of source domains — domains that carry binding obligation in a way that MOVEMENT, BUILDING, or MACHINE do not.

### Confirmed: Lincoln Avoids the Full Range of English Figurative Vocabulary

The absence of MOVEMENT, BUILDING, MACHINE, RESOURCE, GAME, and ANIMAL from Lincoln's political rhetoric is now measurable against a baseline. These are prominent in general English but absent from Lincoln. Lincoln's political language is not just selective — it is drastically narrowed compared to the full range of English metaphor.

The strategic consequence: Lincoln's six clusters are mutually reinforcing and self-consistent. A narrower vocabulary is a more controlled one. Every major Lincoln metaphor activates obligation; none activates competition, progress, construction, or resource allocation. The system was built to do one thing.

---

## Reproducibility

The Stage 7 validation pipeline is fully automated:

```bash
# Download LCC data (~4.6 MB) and run full comparison:
npm run stage7

# Download and evaluate the larger English LCC dataset:
npm run stage7:large

# Lincoln-only cluster summary (no download needed):
npm run stage7:eval
```

Additional explicit commands:

```bash
npm run stage7:download
npm run stage7:parse
npm run stage7:download:large
npm run stage7:parse:large
```

Scripts: `scripts/download_lcc.py`, `scripts/parse_lcc.py`, `scripts/evaluate_lcc.py`, `scripts/run_stage7.py`

Data: `data/lcc/en_small.xml` and `data/lcc/en_large.xml` are not committed; they are downloaded on demand. Parsed CSV files under `data/lcc_subset/` are also not committed and are generated by `parse_lcc.py`.

The benchmark registry in [External Benchmarks](../docs/methodology/external-benchmarks.md) documents implemented LCC choices, candidate contemporary corpora, licensing, size, redistribution policy, and reproducibility commands.

Source: [LCC Metaphor Dataset](https://github.com/lcc-api/metaphor), CC BY-NC-SA 4.0. Cite: Mohler, M., Coyne, R., Tomlinson, M., & Bracewell, D. (2016). A Corpus of Rich Metaphor Annotation. NAACL Workshop on Metaphor in NLP.
