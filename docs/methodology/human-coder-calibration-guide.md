---
title: "Human Coder Calibration Guide"
description: "Instructions for completing the Stage 4H calibration practice packet before the blind reliability study."
draft: false
---

## Purpose

This guide walks you through the calibration practice packet. Calibration gives you an opportunity to apply the coding rules before the blind reliability study begins. Unlike the blind study, calibration includes explanations and answer guidance so you can check your work and ask questions.

Complete the calibration packet and review the answer key with your study coordinator before you receive your blind reliability worksheet.

## What Calibration Is

Calibration is **practice with feedback**. You apply the annotation scheme to a small set of Lincoln passages, record your judgments, and then compare them against the answer key with your coordinator. The goal is to identify and resolve questions about the coding rules before the blind study, not to produce a perfect calibration score.

Calibration is not scored for reliability. Your calibration results will not be used as reliability data. Only your blind study worksheet will contribute to the inter-annotator reliability analysis.

## What Calibration Is Not

**Calibration does not tell you the answers to the blind reliability packet.** The calibration sentences come from documents that are not included in the reliability test sample. The actual blind packet will contain entirely different sentences from different documents, and it will not include answer guidance of any kind.

**Calibration is not a test you can fail.** If your calibration coding differs from the answer key, that is useful information for training, not a disqualification. Discuss the differences with your coordinator.

## Calibration Files

| File | Contents |
| --- | --- |
| `data/reliability/human-training/calibration-packet.json` | Six calibration sentences with task instructions |
| `data/reliability/human-training/calibration-template.csv` | Blank worksheet for recording your calibration coding |
| `data/reliability/human-training/calibration-answer-key.json` | Expected values and explanations — **review with coordinator after coding, not before** |

## How to Proceed

1. Read the [human coder training guide](human-coder-training-guide.md) completely before opening the calibration packet.
2. Open `calibration-template.csv` and `calibration-packet.json` side by side.
3. For each calibration item, read the sentence and the task instruction, then complete the relevant fields in the template.
4. Do not consult the answer key until you have finished all six items.
5. After completing all items, review the answer key with your study coordinator.
6. Discuss any items where your coding differed significantly from the expected answer.
7. If you and your coordinator cannot resolve a question using the training guide, record the question for the project team before beginning the blind study.

## The Six Calibration Items

| ID | Task | Focus |
| --- | --- | --- |
| `cal_001` | Sentence identification | Positive metaphor case |
| `cal_002` | Sentence identification | Negative control — not metaphor-related |
| `cal_003` | Sentence identification | Ambiguous case |
| `cal_004` | Field agreement | CMT cluster and domain assignment |
| `cal_005` | Field agreement | Koenigsberg fantasy type, violence logic, obligatory frame |
| `cal_006` | Field agreement | Absence and agency coding |

## After Calibration

When you and your coordinator are satisfied that you understand the coding rules and have resolved any calibration questions, you are ready to receive your blind reliability worksheet.

**The blind reliability worksheet:**

- Contains different sentences from different documents than the calibration packet.
- Contains no answer guidance, explanations, or expected values.
- Must be completed independently, without discussing your answers with the other coder.
- Must be submitted before either coder sees the other's completed sheet.

The blindness rules in the [human coder training guide](human-coder-training-guide.md) apply in full from the moment you receive your blind worksheet.
