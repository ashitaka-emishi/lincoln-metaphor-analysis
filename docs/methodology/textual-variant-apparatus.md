---
title: "Textual Variant Apparatus"
draft: false
---

# Textual Variant Apparatus

This page records the source-risk layer for corpus documents whose transmission, transcription, manuscript, date, or collaborative-revision traditions could affect interpretation.

The apparatus is generated from `corpus/corpus_manifest.json` and the Stage 4 annotated files:

```bash
npm run variants:apparatus
```

Generated: 2026-06-16

## Interpretation Rule

A source-risk caveat is not an annotation finding. Stage 4 annotations remain unchanged unless a variant materially changes the metaphor span, source domain, target domain, cluster assignment, or authorship attribution. Current review found no required annotation adjustments; the apparatus marks where publication claims should avoid overprecision.

## High-Risk Documents

| ID | Document | Risk Flags | Risk Categories | Annotation Decision |
| --- | --- | --- | --- | --- |
| doc_004 | Peoria Speech | transcription_noise | reported_or_extemporaneous_transcription | No current Stage 4 annotation adjustment. |
| doc_006a | L-D Debate 1 Ottawa | transcription_variants | newspaper_transcription_variants | No current Stage 4 annotation adjustment. |
| doc_006b | L-D Debate 2 Freeport | transcription_variants | newspaper_transcription_variants | No current Stage 4 annotation adjustment. |
| doc_006c | L-D Debate 3 Jonesboro | transcription_variants | newspaper_transcription_variants | No current Stage 4 annotation adjustment. |
| doc_006d | L-D Debate 4 Charleston | transcription_variants | newspaper_transcription_variants | No annotation adjustment because no metaphor instances are coded; the variant apparatus documents why absence claims should remain register- and source-risk controlled. |
| doc_006e | L-D Debate 5 Galesburg | transcription_variants | newspaper_transcription_variants | No current Stage 4 annotation adjustment. |
| doc_006f | L-D Debate 6 Quincy | transcription_variants | newspaper_transcription_variants | No current Stage 4 annotation adjustment. |
| doc_006g | L-D Debate 7 Alton | transcription_variants | newspaper_transcription_variants | No current Stage 4 annotation adjustment. |
| doc_008 | Springfield Farewell | two_versions | parallel_version_tradition | No current Stage 4 annotation adjustment. |
| doc_009 | First Inaugural | co_authored_seward | collaborative_revision_tradition | No current Stage 4 annotation adjustment. |
| doc_011 | Constitution Fragment | date_uncertain | fragment_date_and_context_uncertainty | No current Stage 4 annotation adjustment. |
| doc_017 | Gettysburg | manuscript_variants | manuscript_variant_tradition | No current Stage 4 annotation adjustment. |
| doc_020 | Re-election Serenade | transcription_noise | reported_or_extemporaneous_transcription | No current Stage 4 annotation adjustment. |

## Apparatus Records

## doc_004 - Peoria Speech

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.2 pp.247-283](https://quod.lib.umich.edu/l/lincoln/lincoln2/1:199)

Risk flags: transcription_noise

Source tradition: Collected Works text of a reported or extemporaneous speech where wording may preserve transcription or reporting noise.

Relevant limits:

- Exact wording and span boundaries require caution.
- Cluster-level patterns are safer than claims that depend on a single disputed word.

Sentence anchors: doc_004_s02_p87_s01, doc_004_s02_p116_s04, doc_004_s02_p116_s11, doc_004_s02_p116_s12, doc_004_s02_p124_s03, doc_004_s02_p127_s03, doc_004_s02_p127_s05

Instance anchors: inst_00106, inst_00107, inst_00108, inst_00109, inst_00110, inst_00111, inst_00112

Annotation decision: No current Stage 4 annotation adjustment. Treat exact lexical boundaries as cautionary where a claim depends on wording precision.

Publication caveat: Attach source-risk caveat when using this document for fine-grained wording, span-boundary, or authorship-sensitive claims.

## doc_006a - L-D Debate 1 Ottawa

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.3 pp.1-37](https://quod.lib.umich.edu/l/lincoln/lincoln3/1:1)

Risk flags: transcription_variants

Source tradition: Collected Works debate text based on nineteenth-century newspaper transcriptions and adversarial campaign reporting.

Relevant limits:

- Lincoln-authored turns are the annotation universe; Douglas turns and editorial apparatus are excluded from metaphor claims.
- Debate wording and interruption boundaries can affect fine lexical-unit claims.

Sentence anchors: doc_006a_s02_p23_s07, doc_006a_s02_p27_s07, doc_006a_s02_p27_s09, doc_006a_s02_p27_s11

Instance anchors: inst_00113, inst_00114, inst_00115, inst_00116

Annotation decision: No current Stage 4 annotation adjustment. Use debate instances for recurring architecture and register-controlled patterns, not single-word proof.

Publication caveat: Attach source-risk caveat when using this document for fine-grained wording, span-boundary, or authorship-sensitive claims.

## doc_006b - L-D Debate 2 Freeport

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.3 pp.38-76](https://quod.lib.umich.edu/l/lincoln/lincoln3/1:2)

Risk flags: transcription_variants

Source tradition: Collected Works debate text based on nineteenth-century newspaper transcriptions and adversarial campaign reporting.

Relevant limits:

- Lincoln-authored turns are the annotation universe; Douglas turns and editorial apparatus are excluded from metaphor claims.
- Debate wording and interruption boundaries can affect fine lexical-unit claims.

Sentence anchors: doc_006b_s04_p10_s02

Instance anchors: inst_00117

Annotation decision: No current Stage 4 annotation adjustment. Use debate instances for recurring architecture and register-controlled patterns, not single-word proof.

Publication caveat: Attach source-risk caveat when using this document for fine-grained wording, span-boundary, or authorship-sensitive claims.

## doc_006c - L-D Debate 3 Jonesboro

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.3 pp.102-144](https://quod.lib.umich.edu/l/lincoln/lincoln3/1:3)

Risk flags: transcription_variants

Source tradition: Collected Works debate text based on nineteenth-century newspaper transcriptions and adversarial campaign reporting.

Relevant limits:

- Lincoln-authored turns are the annotation universe; Douglas turns and editorial apparatus are excluded from metaphor claims.
- Debate wording and interruption boundaries can affect fine lexical-unit claims.

Sentence anchors: doc_006c_s03_p04_s04, doc_006c_s03_p04_s06, doc_006c_s03_p04_s08, doc_006c_s03_p05_s06, doc_006c_s03_p15_s02, doc_006c_s03_p15_s03

Instance anchors: inst_00120, inst_00121, inst_00122, inst_00123, inst_00118, inst_00119

Annotation decision: No current Stage 4 annotation adjustment. Use debate instances for recurring architecture and register-controlled patterns, not single-word proof.

Publication caveat: Attach source-risk caveat when using this document for fine-grained wording, span-boundary, or authorship-sensitive claims.

## doc_006d - L-D Debate 4 Charleston

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.3 pp.145-201](https://quod.lib.umich.edu/l/lincoln/lincoln3/1:4)

Risk flags: transcription_variants

Source tradition: Collected Works debate text based on nineteenth-century newspaper transcriptions and adversarial campaign reporting.

Relevant limits:

- Lincoln-authored turns are the annotation universe; Douglas turns and editorial apparatus are excluded from metaphor claims.
- Debate wording and interruption boundaries can affect fine lexical-unit claims.

Sentence anchors: No annotated sentence anchors

Instance anchors: No Stage 4 instances

Annotation decision: No annotation adjustment because no metaphor instances are coded; the variant apparatus documents why absence claims should remain register- and source-risk controlled.

Publication caveat: This debate currently has no Stage 4 metaphor instances. Use it as absence/suppression evidence only with the debate-transcription caveat attached.

## doc_006e - L-D Debate 5 Galesburg

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.3 pp.207-244](https://quod.lib.umich.edu/l/lincoln/lincoln3/1:5)

Risk flags: transcription_variants

Source tradition: Collected Works debate text based on nineteenth-century newspaper transcriptions and adversarial campaign reporting.

Relevant limits:

- Lincoln-authored turns are the annotation universe; Douglas turns and editorial apparatus are excluded from metaphor claims.
- Debate wording and interruption boundaries can affect fine lexical-unit claims.

Sentence anchors: doc_006e_s02_p04_s05

Instance anchors: inst_00124

Annotation decision: No current Stage 4 annotation adjustment. Use debate instances for recurring architecture and register-controlled patterns, not single-word proof.

Publication caveat: Attach source-risk caveat when using this document for fine-grained wording, span-boundary, or authorship-sensitive claims.

## doc_006f - L-D Debate 6 Quincy

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.3 pp.245-325](https://quod.lib.umich.edu/l/lincoln/lincoln3/1:6)

Risk flags: transcription_variants

Source tradition: Collected Works debate text based on nineteenth-century newspaper transcriptions and adversarial campaign reporting.

Relevant limits:

- Lincoln-authored turns are the annotation universe; Douglas turns and editorial apparatus are excluded from metaphor claims.
- Debate wording and interruption boundaries can affect fine lexical-unit claims.

Sentence anchors: doc_006f_s03_p04_s06, doc_006f_s03_p04_s07, doc_006f_s03_p05_s03, doc_006f_s03_p15_s08

Instance anchors: inst_00125, inst_00126, inst_00127, inst_00128

Annotation decision: No current Stage 4 annotation adjustment. Use debate instances for recurring architecture and register-controlled patterns, not single-word proof.

Publication caveat: Attach source-risk caveat when using this document for fine-grained wording, span-boundary, or authorship-sensitive claims.

## doc_006g - L-D Debate 7 Alton

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.3 pp.283-325](https://quod.lib.umich.edu/l/lincoln/lincoln3/1:7)

Risk flags: transcription_variants

Source tradition: Collected Works debate text based on nineteenth-century newspaper transcriptions and adversarial campaign reporting.

Relevant limits:

- Lincoln-authored turns are the annotation universe; Douglas turns and editorial apparatus are excluded from metaphor claims.
- Debate wording and interruption boundaries can affect fine lexical-unit claims.

Sentence anchors: doc_006g_s02_p33_s04, doc_006g_s02_p33_s05, doc_006g_s02_p33_s06, doc_006g_s02_p38_s04, doc_006g_s02_p38_s09, doc_006g_s02_p43_s05, doc_006g_s02_p44_s04, doc_006g_s02_p56_s07

Instance anchors: inst_00129, inst_00130, inst_00131, inst_00133, inst_00134, inst_00135, inst_00136, inst_00132

Annotation decision: No current Stage 4 annotation adjustment. Use debate instances for recurring architecture and register-controlled patterns, not single-word proof.

Publication caveat: Attach source-risk caveat when using this document for fine-grained wording, span-boundary, or authorship-sensitive claims.

## doc_008 - Springfield Farewell

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.4 pp.190-191](https://quod.lib.umich.edu/l/lincoln/lincoln4/1:40)

Risk flags: two_versions

Source tradition: Address has both an extemporaneous/transcribed tradition and Lincoln self-edited written reconstruction.

Relevant limits:

- The annotated text follows the Lincoln self-edited written version used by the corpus.
- Version differences matter most for claims about diction, not for the broad Providence/companionship frame.

Sentence anchors: doc_008_s01_p01_s05, doc_008_s01_p01_s06, doc_008_s01_p01_s07, doc_008_s01_p01_s08

Instance anchors: inst_00043, inst_00044, inst_00045, inst_00046

Annotation decision: No current Stage 4 annotation adjustment. Publication claims should name that the annotated object is the written reconstruction.

Publication caveat: The Springfield Farewell should be cited as the corpus version of Lincoln self-editing his farewell, not as a verbatim transcript of the extemporaneous delivery.

## doc_009 - First Inaugural

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.4 pp.262-271](https://quod.lib.umich.edu/l/lincoln/lincoln4/1:60)

Risk flags: co_authored_seward

Source tradition: First Inaugural text includes Seward-drafted or Seward-revised material within a Lincoln-primary address.

Relevant limits:

- Authorship-sensitive claims require caution around revised passages.
- Use received-text, Lincoln-adopted, and strict Lincoln-origin tiers for the closing peroration.
- The final peroration is especially important because it contains high-value covenant/body-memory metaphors.

Sentence anchors: doc_009_s01_p40_s04, doc_009_s01_p40_s05

Instance anchors: inst_00076, inst_00077

Annotation decision: No current Stage 4 annotation adjustment. Keep authorship caveat attached to affected sentence anchors and use high-authorship-confidence controls for aggregate claims.

Publication caveat: The final peroration is retained as part of the received First Inaugural text. Treat inst_00076 as Lincoln-adopted Seward-origin wording and inst_00077 as received-text evidence excluded from Lincoln-sole claims.

## doc_011 - Constitution Fragment

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.4 pp.168-169](https://quod.lib.umich.edu/l/lincoln/lincoln4/1:34)

Risk flags: date_uncertain

Source tradition: Private fragment with uncertain date and incomplete surrounding context.

Relevant limits:

- The fragment opens mid-argument, so the antecedent context for the apple-picture frame is missing.
- The date should be treated as approximate in diachronic claims.

Sentence anchors: doc_011_s01_p04_s03, doc_011_s01_p05_s01, doc_011_s01_p05_s02, doc_011_s01_p05_s03, doc_011_s01_p05_s04, doc_011_s01_p06_s01

Instance anchors: inst_00037, inst_00038, inst_00039, inst_00040, inst_00041, inst_00042

Annotation decision: No current Stage 4 annotation adjustment. Use the fragment as structural evidence, not as frequency evidence equivalent to public addresses.

Publication caveat: Use as evidence for Lincoln theorizing the apple-picture hierarchy, with date and missing-context limits stated in diachronic claims.

## doc_017 - Gettysburg

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.7 pp.22-23](https://quod.lib.umich.edu/l/lincoln/lincoln7/1:16)

Risk flags: manuscript_variants

Source tradition: Gettysburg Address has a manuscript and delivery tradition with variant wordings across witnesses and later copies.

Relevant limits:

- Claims should rely on stable architecture across the address rather than isolated wording where manuscript variants are material.
- The corpus text supports the annotated birth, dedication, proposition, and sacrificial-economy structure.

Sentence anchors: doc_017_s01_p01_s01, doc_017_s01_p02_s01, doc_017_s01_p02_s03, doc_017_s01_p03_s01, doc_017_s01_p03_s02, doc_017_s01_p03_s04, doc_017_s01_p03_s05

Instance anchors: inst_00001, inst_00002, inst_00003, inst_00004, inst_00005, inst_00006, inst_00007, inst_00008, inst_00009, inst_00010, inst_00011, inst_00012, inst_00013

Annotation decision: No current Stage 4 annotation adjustment. Treat the address-level architecture as stable; flag exact diction claims as variant-sensitive.

Publication caveat: Use Gettysburg for address-level metaphor architecture. Avoid overclaiming from single-word diction unless the variant tradition has been checked.

## doc_020 - Re-election Serenade

Source: [Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.8 pp.96-97](https://quod.lib.umich.edu/l/lincoln/lincoln8/1:61)

Risk flags: transcription_noise

Source tradition: Collected Works text of a reported or extemporaneous speech where wording may preserve transcription or reporting noise.

Relevant limits:

- Exact wording and span boundaries require caution.
- Cluster-level patterns are safer than claims that depend on a single disputed word.

Sentence anchors: doc_020_s01_p02_s01, doc_020_s01_p03_s01, doc_020_s01_p06_s02, doc_020_s01_p06_s04, doc_020_s01_p08_s01

Instance anchors: inst_00047, inst_00048, inst_00049, inst_00050, inst_00051

Annotation decision: No current Stage 4 annotation adjustment. Treat exact lexical boundaries as cautionary where a claim depends on wording precision.

Publication caveat: Attach source-risk caveat when using this document for fine-grained wording, span-boundary, or authorship-sensitive claims.

