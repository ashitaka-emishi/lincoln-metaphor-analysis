---
title: "Methods Summary"
---

This project uses a staged corpus workflow. First, Lincoln's texts are collected and normalized. Second, each document receives metadata: date, register, authorship confidence, source, risk flags, and analytical priority. Third, each document is segmented into stable section, paragraph, and sentence IDs. Fourth, metaphor instances are annotated at the sentence level. Finally, the annotated instances are aggregated into a concordance and analyzed by cluster, date, register, and absence pattern.

Each metaphor annotation has three ordered decisions: MIPVU identification, CMT mapping, and Koenigsbergian interpretation. The [Annotation Codebook](docs/methodology/annotation-codebook.md) defines the decision rules and controlled vocabularies. The [Evidence Chain Schema](docs/methodology/evidence-chain-schema.md) defines the generated audit layer that connects claims to instances, sentence IDs, document metadata, and source URLs. The [Claim Audit Method](docs/methodology/claim-audit.md) explains how synthesis claims are tied to selected and complete evidence chains. The [Reliability Workflow](docs/methodology/reliability-report.md) defines the double-coding sample, disagreement categories, adjudication log, and agreement measures.

Each metaphor annotation has two structured interpretive layers.

The **Conceptual Metaphor Theory layer** records the source domain, target domain, linguistic form, entailments, extended metaphor status, and co-activated clusters. This makes it possible to compare metaphors as linguistic structures across the corpus.

The **Koenigsberg layer** records the psychological and political work of the metaphor: fantasy type, violence logic, projected entity, guilt distribution, obligatory frame, sacrificial economy, psychic defense, and absence flags. This makes it possible to ask how a metaphor organizes political violence rather than simply how often a phrase appears.

Register control is central. A formal address, a legal proclamation, a private fragment, and a campaign debate do not carry the same rhetorical constraints. Frequency claims must therefore be checked against register and authorship confidence before they become interpretive claims. The publication-facing [Corpus Register](docs/methodology/corpus-register.qmd) records provenance, periodization, genre, editorial status, inclusion rationale, known limitations, and risk flags for every document. The generated [Controlled Outputs](analysis/controlled_outputs.md) page reports full-corpus and `authorship_confidence >= 0.95` views for cluster and absence claims.

Absence is treated as evidence. When a metaphor's entailments logically require a person or group to appear in a role, and that person or group repeatedly does not appear, the absence is part of the metaphor system's structure. This is especially important for enslaved people and Black soldiers, whose agency is often required by the logic of Lincoln's metaphors but not granted by the rhetoric itself.

**External validation** is provided by Stage 7, which compares Lincoln's annotated clusters against the LCC Metaphor Dataset — a general English metaphor corpus with 8,724 annotations and ~114 source-concept categories. This establishes which of Lincoln's source-concept domains are common in general English metaphor and which are Lincoln-specific rhetorical constructions with no parallel in ordinary figurative language. See [LCC Benchmark Validation](analysis/lcc_validation.md).

Reliability is reported in layers rather than as one blended score. The project distinguishes whether coders identify the same metaphor-related lexical units from whether they agree on CMT mapping, Koenigsbergian function, absence flags, and confidence. The current Stage 4B result compares the Stage 4A reference layer with a Codex second-pass reliability review; it reports metrics and adjudication while explicitly avoiding a two-human inter-annotator reliability claim.

The detailed protocols are available in the Methodology section. See [Research Design](docs/methodology/research-design.md) for the publication scope and evidence sequence, [Methods Appendix](docs/methodology/methods-appendix.md) for the reproducible checklist, and [Publication Package](publication_package.md) for the reviewer path, data availability note, AI-use statement, limitations, and archive boundary. This page is only the public-facing summary.
