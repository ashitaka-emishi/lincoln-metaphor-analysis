# Corpus Register — Definitions and Analytical Implications

## What Register Does

Register is not just a label for document type. It encodes the **communicative context** that shapes metaphor deployment. Lincoln writes differently in a formal address than in a private fragment — not because he is being insincere in one and sincere in the other, but because different registers activate different constraints on what can be said and how.

The register field carries the methodological weight that corpus restriction would otherwise carry. Rather than cherry-picking only formal_public_addresses, this project uses a wide corpus and tracks register as a variable. All frequency claims about metaphor must be register-controlled before they can be interpreted.

---

## Register Definitions

### `formal_public_address`
Speeches written for posterity, delivered at significant occasions, often prepared in advance and revised. Lincoln considered these his permanent record.

**Analytical implications**:
- Highest metaphor density across the corpus — Lincoln's conceptual frameworks are most fully elaborated here
- Highest authorship confidence (typically > 0.95) — these are texts Lincoln controlled
- Maximum ideological freight — these are the texts Lincoln wanted to be remembered by
- Confidence adjustment: **+0.05**
- Expected to show the strongest cluster activation and most fully developed entailment chains

Documents in this corpus: doc_001, doc_002, doc_003, doc_005, doc_007, doc_008, doc_009, doc_017, doc_021, doc_022

### `campaign_speech`
Stump speeches, debates, public addresses in electoral contexts. Often oral and improvised, transcribed by newspaper reporters with varying accuracy.

**Analytical implications**:
- Lower metaphor density than formal_public_address — audience management, adversarial pressure, and improvisation all reduce systematic metaphor deployment
- Audience composition affects which clusters Lincoln activates (Charleston vs. Galesburg debates)
- Authorship confidence reduced by transcription uncertainty
- Transcription variants mean exact span text is sometimes unreliable — note variants
- Confidence adjustment: **−0.05**
- Suppression events are particularly visible here: what Lincoln omits in hostile-audience debates is as significant as what he includes

Documents in this corpus: doc_004, doc_006a, doc_006b, doc_006c, doc_006d, doc_006e, doc_006f, doc_006g, doc_020

### `congressional_message`
Annual and special messages to Congress. Administrative prose by design — Lincoln is communicating policy, not performing rhetoric.

**Analytical implications**:
- Lower metaphor density than formal addresses — administrative register imposes flatness
- When metaphors do appear in congressional messages, they survive deliberate drafting and revision — treat them as more considered than spontaneous
- The appearance of "last best hope of earth" (cluster_03) in the 1862 Annual Message (doc_014) is significant precisely because it survived the administrative register
- Confidence adjustment: **−0.05**

Documents in this corpus: doc_010, doc_014

### `semi_public_letter`
Letters written for likely public release, sometimes explicitly intended to be read aloud or published. These are not truly private — Lincoln knew they would circulate.

**Analytical implications**:
- Medium metaphor density — more controlled than campaign speeches, less elaborated than formal addresses
- High epistemic value for authorship: Lincoln almost certainly wrote these himself in final form
- Semi-public letters allow Lincoln to speak to multiple audiences simultaneously — the private addressee and the public readership
- The Greeley Letter (doc_012) and Hodges Letter (doc_019) are the most analytically rich semi-public letters
- Confidence adjustment: **none (baseline)**

Documents in this corpus: doc_012, doc_016, doc_019

### `legal_document`
Proclamations and executive orders. Deliberately flat register — legal language imposes constraints that suppress metaphor.

**Analytical implications**:
- Lowest metaphor density of any register — this is by design, not by accident
- The *absence* of metaphor in doc_013 and doc_015 is the primary finding, not a null result
- Any metaphor that survives into legal register has passed through the strongest possible editorial filter — treat it as highly significant
- The contrast between the metaphor-rich Gettysburg Address (doc_017) and the metaphor-sparse Emancipation Proclamation (doc_015), written one month apart, is a key analytical data point
- Confidence adjustment: **−0.10**

Documents in this corpus: doc_013, doc_015

### `fragment_private`
Private notes with no intended audience. Lincoln writing for himself.

**Analytical implications**:
- Highest epistemic value for genuine cognition — these are Lincoln's unperformed thoughts
- The Constitution Fragment (doc_011) explicitly theorizes Lincoln's own metaphors ("picture of silver" / "apple of gold")
- The Blind Memorandum (doc_018) tests whether public providence rhetoric reflects private cognition
- Low word counts mean fewer instances, but each instance carries disproportionate analytical weight
- Confidence adjustment: **+0.05**

Documents in this corpus: doc_011, doc_018

---

## Register and the Diachronic Argument

Phase composition across registers:

| Phase | Formal | Campaign | Congressional | Semi-public | Legal | Fragment |
|-------|--------|----------|---------------|-------------|-------|----------|
| 1 (1838–53) | 3 | 0 | 0 | 0 | 0 | 0 |
| 2 (1854–60) | 2 | 8 | 0 | 0 | 0 | 0 |
| 3 (1861) | 2 | 0 | 1 | 0 | 0 | 1 |
| 4 (1862–63) | 1 | 0 | 1 | 2 | 2 | 0 |
| 5 (1864–65) | 3 | 1 | 0 | 1 | 0 | 1 |

Phase 2 is heavily campaign_speech. Phase 5 is heavily formal_public_address. Any diachronic claim comparing these phases must control for this composition difference.

**Practical rule**: If claiming a metaphor cluster increases or decreases over time, verify the trend holds within at least one register held constant. If it doesn't hold within any single register, it is a composition artifact, not a diachronic finding.

---

## Confidence Adjustments by Register

Summary table for annotation:

| Register | Base adjustment |
|----------|----------------|
| `formal_public_address` | +0.05 |
| `fragment_private` | +0.05 |
| `semi_public_letter` | 0.00 |
| `campaign_speech` | −0.05 |
| `congressional_message` | −0.05 |
| `legal_document` | −0.10 |

These adjustments apply on top of base confidence scoring (from `cmt_analysis.md`) and authorship adjustments (from `annotation_protocol.md`). Floor at 0.50 for all instances.
