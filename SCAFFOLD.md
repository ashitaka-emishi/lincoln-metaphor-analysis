# SCAFFOLD.md — lincoln-metaphor project
# Drop this file into the root of an empty VSCode project.
# Then run: claude "Read SCAFFOLD.md and build the project"
# Claude Code will create every file, directory, and script from scratch.

---

## What you are building

A structured research project called `lincoln-metaphor/` that applies
Richard Koenigsberg's method of ideological fantasy analysis to Abraham
Lincoln's corpus (1838–1865).

Koenigsberg examined Hitler's speeches for the psychological metaphors that
made mass violence feel obligatory — the nation as a wounded body, war as
healing, death as generative. This project applies the same analytical lens
to Lincoln, mapping the conceptual metaphors that structured his understanding
of the Civil War and the Union.

The output is structured JSON at every pipeline stage, designed for
programmatic analysis and future visualization.

---

## Theoretical framework (essential context)

### Layer 1: Conceptual Metaphor Theory (Lakoff & Johnson)
Metaphors are cognitive structures, not rhetorical ornaments. When Lincoln
writes "binding up the nation's wounds" he is thinking through the
NATION IS A BODY metaphor. The mapping is: source domain (wound/healing) →
target domain (national reunification). The entailments transfer: if the
nation has a wound, something caused it, a physician must act, delay makes
it worse, the patient is passive. These entailments are the ideological payload.

### Layer 2: Koenigsberg psychological model
Mass political violence is driven by ideological fantasy — unconscious
structures that make violence feel obligatory, redemptive, or generative.
The nation is treated as a "magical object" — an extension of the collective
self requiring violent defense. Key constructs:

- **Fantasy type**: wound_and_healing | birth_and_creation | sacrifice_and_redemption
  | oath_and_obligation | punishment_and_theodicy | ancestral_debt | experiment_and_proof
  | disease_and_purification (this last one is rare/absent in Lincoln — track it)
- **Violence logic**: restorative | generative | punitive | purifying | evidentiary | obligatory
- **Obligatory frame**: does the metaphor make violence feel mandatory rather than chosen?
- **Projected entity**: what is the magical object? (national_body | founding_proposition
  | covenant_bond | ancestral_lineage | divine_instrument)
- **Guilt distribution**: external | internal | distributed | cosmic | absent
- **Sacrificial economy**: does soldier death become productive — generating national
  identity, proving a proposition, redeeming a sin?
- **Absence flags**: entities structurally erased by the metaphor's logic
  (enslaved_people_non_agent | lincoln_non_agent | death_abstracted |
  confederates_depersonalized | black_soldiers_erased)

### The six metaphor clusters (pre-identified — deepen, don't reinvent)

| ID | Name | Source domain | Target domain |
|----|------|--------------|---------------|
| cluster_01 | Nation as organism / body | wound, healing, birth, severance | the American Union |
| cluster_02 | Union as covenant / oath | sworn oath, contract, sacred bond | the constitutional compact |
| cluster_03 | Republic as experiment / proposition | logical proof, scientific test | democratic self-government |
| cluster_04 | War as birth / new creation | labor, nativity, generative act | the refounding of the nation |
| cluster_05 | Founding fathers as inheritance | patrimony, lineage, ancestral debt | obligation to the founders |
| cluster_06 | Providence / divine will | God's judgment, punishment, theodicy | the war's cause and meaning |

### The systematic absence thread (required — not optional)
Enslaved people appear in Lincoln's metaphor universe as the cause of the
wound, the object of the proposition, the subject of divine punishment —
never as actors, healers, provers, or inheritors. Track every instance where
the metaphor's logic requires Black Americans to be passive. The ~180,000
Black Union soldiers are the sharpest test case: they are the most literal
embodiment of the sacrifice/proof clusters and are nearly absent from
Lincoln's public rhetoric of sacrifice and rebirth.

### Key analytical finding (pre-stated — confirm against corpus)
Lincoln's metaphor system contains NO disease-and-purification logic.
No group is constructed as a pathogen the national body must expel.
This is the structural difference from Hitler: restorative and generative
violence have off-ramps (wounds heal; children grow up); purifying violence
does not. This is why Lincoln's rhetoric could accommodate "malice toward none"
and Hitler's could not. Confirm or disconfirm this against the full corpus.

---

## Corpus (29 documents — wide by design)

Wide corpus prevents cherry-picking. The `register` field in every document
carries the methodological weight that corpus restriction would otherwise carry.

### Register enum
- `formal_public_address` — speeches written for posterity (highest metaphor density)
- `campaign_speech` — stump speeches, debates (oral, improvised, lower confidence)
- `congressional_message` — annual/special messages (administrative prose)
- `semi_public_letter` — letters written for likely public release
- `legal_document` — proclamations, orders (deliberately flat register — low density expected)
- `fragment_private` — private notes with no intended audience (highest epistemic value)

### Document list

```json
[
  {"id":"doc_001","short_title":"Lyceum Address","date":"1858-01-27","register":"formal_public_address","authorship_confidence":0.98,"analytical_priority":"high","notes":"Earliest major speech. Proto-covenant and proto-organism metaphors before Lincoln has political stakes — valuable baseline."},
  {"id":"doc_002","short_title":"Temperance Address","date":"1842-02-22","register":"formal_public_address","authorship_confidence":0.97,"analytical_priority":"medium","notes":"Body/disease cluster in alcohol reform context — establishes pre-political use of organic metaphors."},
  {"id":"doc_003","short_title":"Clay Eulogy","date":"1852-07-06","register":"formal_public_address","authorship_confidence":0.96,"analytical_priority":"medium","notes":"Ancestral-debt cluster. Lincoln positions Clay as exemplar of covenant-keeping."},
  {"id":"doc_004","short_title":"Peoria Speech","date":"1854-10-16","register":"campaign_speech","authorship_confidence":0.91,"analytical_priority":"high","risk_flags":["transcription_noise"],"notes":"First major deployment of experiment/proposition frame re: slavery. 17,000 words."},
  {"id":"doc_005","short_title":"House Divided","date":"1858-06-16","register":"formal_public_address","authorship_confidence":0.99,"analytical_priority":"critical","notes":"Body-organism cluster at full intensity. Dual activation: house = body AND household covenant."},
  {"id":"doc_006a","short_title":"L-D Debate 1 Ottawa","date":"1858-08-21","register":"campaign_speech","authorship_confidence":0.83,"analytical_priority":"high","risk_flags":["transcription_variants"],"notes":"Metaphors under adversarial pressure. Annotate Lincoln turns only."},
  {"id":"doc_006b","short_title":"L-D Debate 2 Freeport","date":"1858-08-27","register":"campaign_speech","authorship_confidence":0.83,"analytical_priority":"high","risk_flags":["transcription_variants"],"notes":"Proposition cluster under maximum argumentative pressure."},
  {"id":"doc_006c","short_title":"L-D Debate 3 Jonesboro","date":"1858-09-15","register":"campaign_speech","authorship_confidence":0.82,"analytical_priority":"medium","risk_flags":["transcription_variants"],"notes":"Southern IL audience — watch for metaphor suppression vs. northern venues."},
  {"id":"doc_006d","short_title":"L-D Debate 4 Charleston","date":"1858-09-18","register":"campaign_speech","authorship_confidence":0.82,"analytical_priority":"medium","risk_flags":["transcription_variants"],"notes":"CRITICAL for absence analysis: Lincoln suppresses equality-proposition cluster here. Tag explicitly."},
  {"id":"doc_006e","short_title":"L-D Debate 5 Galesburg","date":"1858-10-07","register":"campaign_speech","authorship_confidence":0.83,"analytical_priority":"medium","risk_flags":["transcription_variants"],"notes":"Compare cluster activation with Jonesboro (suppressed) and Galesburg (receptive)."},
  {"id":"doc_006f","short_title":"L-D Debate 6 Quincy","date":"1858-10-13","register":"campaign_speech","authorship_confidence":0.83,"analytical_priority":"medium","risk_flags":["transcription_variants"]},
  {"id":"doc_006g","short_title":"L-D Debate 7 Alton","date":"1858-10-15","register":"campaign_speech","authorship_confidence":0.83,"analytical_priority":"high","risk_flags":["transcription_variants"],"notes":"Final debate — Lincoln's closing synthesis after 7 rounds of adversarial pressure."},
  {"id":"doc_007","short_title":"Cooper Union","date":"1860-02-27","register":"formal_public_address","authorship_confidence":0.99,"analytical_priority":"critical","notes":"Best single document for fathers/inheritance cluster. Lincoln cites founders by name."},
  {"id":"doc_008","short_title":"Springfield Farewell","date":"1861-02-11","register":"formal_public_address","authorship_confidence":0.95,"analytical_priority":"medium","risk_flags":["two_versions"],"notes":"Providence cluster in unguarded form. Lincoln speaking extemporaneously about his own death."},
  {"id":"doc_009","short_title":"First Inaugural","date":"1861-03-04","register":"formal_public_address","authorship_confidence":0.93,"analytical_priority":"critical","risk_flags":["co_authored_seward"],"notes":"Seward drafted 'mystic chords' closing. Tag seward_revised sentences. Run analysis twice: full and lincoln-sole-only."},
  {"id":"doc_010","short_title":"July 4 Message 1861","date":"1861-07-04","register":"congressional_message","authorship_confidence":0.88,"analytical_priority":"high","notes":"Experiment/proposition most explicit here. Note how metaphors operate in administrative register."},
  {"id":"doc_011","short_title":"Constitution Fragment","date":"1861-01-01","register":"fragment_private","authorship_confidence":0.85,"analytical_priority":"high","risk_flags":["date_uncertain"],"notes":"Lincoln privately reasons Union is 'picture of silver', liberty the 'apple of gold'. Rare explicit metaphor theorizing. High epistemic value."},
  {"id":"doc_012","short_title":"Greeley Letter","date":"1862-08-22","register":"semi_public_letter","authorship_confidence":0.99,"analytical_priority":"critical","notes":"CRITICAL. 'If I could save the Union without freeing any slave I would do it.' Metaphor suppression event. Written 2 months before Preliminary Emancipation. Track covenant-over-freedom suppression."},
  {"id":"doc_013","short_title":"Prelim Emancipation","date":"1862-09-22","register":"legal_document","authorship_confidence":0.90,"analytical_priority":"medium","notes":"Deliberately flat. Absence of birth/body clusters is the finding. Use as control document."},
  {"id":"doc_014","short_title":"Annual Message 1862","date":"1862-12-01","register":"congressional_message","authorship_confidence":0.87,"analytical_priority":"high","notes":"'Last best hope of earth' — experiment frame at high intensity in administrative register."},
  {"id":"doc_015","short_title":"Final Emancipation","date":"1863-01-01","register":"legal_document","authorship_confidence":0.90,"analytical_priority":"medium","notes":"Compare to preliminary — same flatness. The document actually freeing enslaved people contains almost no metaphor. Flatness is data."},
  {"id":"doc_016","short_title":"Conkling Letter","date":"1863-08-26","register":"semi_public_letter","authorship_confidence":0.99,"analytical_priority":"high","notes":"Written to be read aloud at rally. Defends emancipation to war Democrats. Track obligatory frame distribution across racial lines."},
  {"id":"doc_017","short_title":"Gettysburg","date":"1863-11-19","register":"formal_public_address","authorship_confidence":0.99,"analytical_priority":"critical","risk_flags":["manuscript_variants"],"notes":"272 words. Birth, proposition, sacrifice, ancestral-debt all present. Highest metaphor density. Use Bliss copy. Structurally a birth narrative — 'brought forth' in line 1 reprised in 'new birth of freedom'. Sacrificial economy fully operational."},
  {"id":"doc_018","short_title":"Blind Memorandum","date":"1864-08-23","register":"fragment_private","authorship_confidence":0.99,"analytical_priority":"high","notes":"Private note sealed from cabinet. Providence cluster in purely private form. Key test: does public providence rhetoric reflect genuine private cognition?"},
  {"id":"doc_019","short_title":"Hodges Letter","date":"1864-04-04","register":"semi_public_letter","authorship_confidence":0.99,"analytical_priority":"critical","notes":"'I claim not to have controlled events but confess plainly that events have controlled me.' Obligatory frame and lincoln_non_agent as Lincoln's explicit self-description. Canonical. Also proto-Second-Inaugural theodicy."},
  {"id":"doc_020","short_title":"Re-election Serenade","date":"1864-11-10","register":"campaign_speech","authorship_confidence":0.88,"analytical_priority":"medium","risk_flags":["transcription_noise"],"notes":"Extemporaneous. Experiment/proof frame unguarded — election result as empirical evidence."},
  {"id":"doc_021","short_title":"Second Inaugural","date":"1865-03-04","register":"formal_public_address","authorship_confidence":0.99,"analytical_priority":"critical","notes":"All clusters present. Providence/theodicy at full development. Distributed guilt. 'The Almighty has His own purposes.' Obligatory frame at maximum. Wound-and-healing closes. Diachronic endpoint."},
  {"id":"doc_022","short_title":"Last Address","date":"1865-04-11","register":"formal_public_address","authorship_confidence":0.99,"analytical_priority":"high","notes":"Reconstruction policy. Wound-and-healing now programmatic. Diachronic endpoint for organism cluster. Delivered 4 days before assassination."}
]
```

---

## JSON schema (all 6 pipeline stages)

### Stage 2 markdown frontmatter
```yaml
---
id: "doc_021"
title: "Second Inaugural Address"
short_title: "Second Inaugural"
date: "1865-03-04"
date_precision: "exact"           # exact | month | year | circa
register: "formal_public_address"
authorship: "lincoln_sole"        # lincoln_sole | lincoln_primary | collaborative
authorship_confidence: 0.99
authorship_notes: null
source_text: "Collected Works vol.8 p.332"
source_url: "https://quod.lib.umich.edu/l/lincoln/"
risk_flags: []
analytical_priority: "critical"
pipeline_log: [{stage: 2, agent: "...", date: "..."}]
---
[document text]
```

### Stage 3 segmented JSON
```json
{
  "document_id": "doc_021",
  "meta": { "...all frontmatter fields..." },
  "sections": [{
    "section_id": "doc_021_s01",
    "section_label": "opening",
    "section_ordinal": 1,
    "paragraphs": [{
      "paragraph_id": "doc_021_s01_p01",
      "paragraph_ordinal": 1,
      "sentences": [{
        "sentence_id": "doc_021_s01_p01_s01",
        "sentence_ordinal": 1,
        "text": "At this second appearing...",
        "word_offset_start": 0,
        "word_offset_end": 31,
        "authorship_note": null,
        "metaphor_instances": []
      }]
    }]
  }],
  "pipeline_log": []
}
```

Sentence ID convention: `{doc_id}_s{NN}_p{NN}_s{NN}` (all ordinals zero-padded to 2 digits).
IDs are permanent after Stage 3 is complete — never renumber.

### Stage 4 metaphor instance (embedded in sentence.metaphor_instances[])
```json
{
  "instance_id": "inst_00847",
  "sentence_id": "doc_021_s03_p02_s04",
  "document_id": "doc_021",
  "document_date": "1865-03-04",
  "document_register": "formal_public_address",
  "authorship_confidence": 0.99,
  "span_text": "binding up the nation's wounds",
  "span_char_start": 14,
  "span_char_end": 44,
  "cmt": {
    "cluster_id": "cluster_01_body_organism",
    "source_domain": "wound_healing",
    "target_domain": "national_reunification",
    "linguistic_form": "verbal_phrase",
    "entailments": [
      "the_nation_has_a_body",
      "division_caused_physical_damage",
      "reunification_is_medical_care",
      "the_speaker_is_physician",
      "damage_is_reparable"
    ],
    "is_novel_metaphor": false,
    "is_extended_metaphor": true,
    "extension_group_id": "ext_012",
    "co_activated_clusters": [],
    "annotation_notes": "Physician role matters for Reconstruction policy framing."
  },
  "koenigsberg": {
    "fantasy_type": "wound_and_healing",
    "violence_logic": "restorative",
    "obligatory_frame": true,
    "obligatory_frame_notes": "Wound exists independently of Lincoln's choice — healing is medical necessity.",
    "agent_of_violence": "the_wound",
    "agent_is_abstract": true,
    "object_of_violence": "the_national_body",
    "projected_entity": "national_body",
    "guilt_distribution": "distributed",
    "guilt_distribution_notes": "Second Inaugural distributes guilt across both sides.",
    "sacrificial_economy": false,
    "sacrificial_yield": null,
    "psychic_defense": "reparation",
    "psychic_defense_notes": "Guilt converted into restorative action.",
    "absence_flags": ["enslaved_people_non_agent", "death_abstracted"],
    "absence_notes": "Formerly enslaved people are absent as agents of the healing they most needed."
  },
  "meta": {
    "annotator": "lincoln_corpus_reader",
    "confidence": 0.92,
    "ambiguity_flag": false,
    "ambiguity_notes": null,
    "irony_flag": false,
    "suppression_flag": false,
    "suppression_notes": null
  }
}
```

### Stage 5 concordance.json shape
```json
{
  "version": "1.0", "generated": "...", "corpus_version": "1.0",
  "status": "stub",
  "total_documents": 0, "total_sentences": 0, "total_instances": 0,
  "instances": [],
  "indexes": {
    "by_cluster": {
      "cluster_01_body_organism": [], "cluster_02_covenant_oath": [],
      "cluster_03_experiment_proposition": [], "cluster_04_birth_creation": [],
      "cluster_05_fathers_inheritance": [], "cluster_06_providence_theodicy": []
    },
    "by_document": {}, "by_register": {}, "by_fantasy_type": {},
    "by_violence_logic": {},
    "by_absence_flag": {
      "enslaved_people_non_agent": [], "confederates_depersonalized": [],
      "lincoln_non_agent": [], "death_abstracted": [],
      "women_absent": [], "black_soldiers_erased": []
    },
    "high_confidence_only": [],
    "suppression_instances": []
  },
  "pipeline_log": []
}
```

### Stage 6 analysis.json shape (one cluster_analyses entry shown)
```json
{
  "version": "1.0", "generated": "...", "status": "stub",
  "cluster_analyses": [{
    "cluster_id": "cluster_01_body_organism",
    "cluster_name": "Nation as organism / body",
    "source_domain": "wound, healing, birth, severance, disease",
    "target_domain": "the American Union",
    "instance_count": null, "instance_ids": [],
    "diachronic": {"first_attested": null, "last_attested": null, "by_year": {}, "by_document": {}, "trend_notes": null},
    "cmt_profile": {"dominant_linguistic_forms": [], "dominant_entailments": [], "novel_instances": [], "extended_metaphor_groups": []},
    "koenigsberg_profile": {
      "dominant_fantasy_types": [], "dominant_violence_logic": [],
      "obligatory_frame_rate": null, "dominant_projected_entity": null,
      "dominant_guilt_distribution": null, "sacrificial_economy_rate": null,
      "dominant_psychic_defense": null, "absence_flags_distribution": {}
    },
    "political_moral_work": null, "what_metaphor_conceals": null,
    "hitler_comparison": {
      "hitler_parallel_cluster": null, "structural_similarity": null,
      "structural_divergence": null, "shared_fantasy_types": [],
      "shared_violence_logic": [], "lincoln_specific_constructs": [],
      "hitler_specific_constructs": [], "analytically_significant_absences": []
    },
    "register_distribution": {"formal_public_address": 0, "campaign_speech": 0, "congressional_message": 0, "semi_public_letter": 0, "legal_document": 0, "fragment_private": 0},
    "suppression_instances": [], "analyst_notes": null
  }],
  "systematic_absence": {
    "primary_absent_entity": "enslaved_people",
    "total_absence_flag_instances": null,
    "absence_by_cluster": {}, "absence_by_register": {}, "absence_by_year": {},
    "key_findings": [], "analyst_notes": null
  },
  "cross_cluster": {"co_activation_matrix": {}, "metaphor_hierarchy_evidence": [], "cluster_shift_events": []},
  "koenigsberg_master_comparison": {
    "lincoln_unique_constructs": ["experiment_and_proof", "oath_and_obligation"],
    "hitler_unique_constructs": ["disease_and_purification"],
    "shared_structural_logic": ["sacrificial_economy", "obligatory_frame", "body_politic_projection"],
    "primary_structural_divergence": null, "significance": null
  },
  "pipeline_log": []
}
```

---

## Directory structure to create

```
lincoln-metaphor/
├── .vscode/
│   ├── settings.json          # word wrap, file nesting, JSON limits
│   ├── extensions.json        # prettier, toml, markdown-all-in-one, etc.
│   ├── tasks.json             # validate / build concordance / run analysis / status
│   └── launch.json            # node debug configs for each script
├── SCAFFOLD.md                # this file
├── PROMPT.md                  # master Codex/Claude Code entry point
├── DECISIONS.md               # resolved and open design decisions
├── README.md                  # project overview and quick start
├── package.json               # npm run pipeline | status | validate
├── corpus/
│   ├── corpus_manifest.json   # all 29 docs with full metadata
│   ├── raw/                   # Stage 1: source files as found (empty dir)
│   ├── text/                  # Stage 2: markdown + YAML frontmatter (empty dir)
│   ├── segmented/             # Stage 3: structural JSON (empty dir)
│   └── annotated/             # Stage 4: annotated JSON (empty dir)
├── concordance/
│   └── concordance.json       # Stage 5: stub, correct schema
├── analysis/
│   ├── analysis.json          # Stage 6: stub, all 6 clusters, correct schema
│   ├── diachronic_map.md      # structure pre-populated
│   ├── systematic_absence.md  # structure pre-populated, required deliverable
│   └── cluster_profiles/
│       ├── cluster_01.md      # through cluster_06.md, structure pre-populated
│       └── ...
├── comparison/
│   ├── theoretical_framework.md   # fully written seed document
│   └── koenigsberg_comparison.md  # structure pre-populated
├── synthesis/
│   ├── findings.md            # structure pre-populated
│   └── open_questions.md      # seed questions pre-populated
├── subagents/
│   ├── lincoln_corpus_reader.toml
│   └── koenigsberg_comparativist.toml
├── skills/
│   ├── koenigsberg_method.md  # full field definitions for psychological layer
│   ├── cmt_analysis.md        # CMT methodology and annotation protocol
│   ├── schema_definitions.md  # complete schemas for all 6 stages
│   ├── annotation_protocol.md # how to tag, confidence scoring, quality gates
│   ├── absence_analysis.md    # methodology for systematic silences
│   ├── diachronic_tracking.md # how to track metaphor shift over time
│   ├── close_reading.md       # sentence-level annotation workflow
│   └── corpus_register.md     # register definitions and analytical implications
└── scripts/
    ├── pipeline_status.js     # shows S1-S4 tick per document
    ├── validate_schema.js     # validates all JSON against expected shapes
    ├── build_concordance.js   # Stage 5: aggregates annotated docs
    └── run_analysis.js        # Stage 6: computes cluster stats
```

---

## Execution instructions for Claude Code

Read this entire file before writing a single file.

### Step 1 — Create directory structure
Create all directories listed above including empty `corpus/raw/`,
`corpus/text/`, `corpus/segmented/`, `corpus/annotated/`.

### Step 2 — Write corpus/corpus_manifest.json
Use the document list JSON above. Add these top-level fields:
```json
{
  "version": "1.0",
  "generated": "[today]",
  "notes": "Wide corpus. Register field carries methodological weight. Run analyses on full corpus AND authorship_confidence >= 0.95 subset. Compare results.",
  "register_enum": ["formal_public_address","campaign_speech","congressional_message","semi_public_letter","legal_document","fragment_private"],
  "authorship_enum": ["lincoln_sole","lincoln_primary","collaborative","uncertain"],
  "documents": [...]
}
```
Add `source_text` (Collected Works citation), `source_url`, `title` (full title),
`word_count_approx`, and `pipeline_stage_completed: 1` to every document entry.

### Step 3 — Write all 8 skill files
Each skill file must be substantive — not a stub. Write the full content.

**skills/koenigsberg_method.md** — Full definitions of all 8 analytical constructs
(fantasy_type, violence_logic, obligatory_frame, projected_entity, guilt_distribution,
sacrificial_economy, agent/object of violence, absence_flags) with enums, rationale,
and Lincoln-specific notes. Include section on the Hitler comparison and note the
absence of disease_and_purification in Lincoln as the key structural finding.
Include the psychic defense layer (splitting, projection, manic_defense, reparation,
idealization, displacement) as optional Kleinian extension.

**skills/cmt_analysis.md** — CMT methodology: source/target domain mapping,
entailment tracing, conventional vs. novel, extended metaphor, suppression.
8-step annotation protocol. Confidence scoring table. Common source domains
in Lincoln corpus (biological, architectural, familial, legal/contractual,
logical/mathematical, agricultural, theological).

**skills/schema_definitions.md** — Complete JSON schemas for all 6 stages with
example objects. Include the sentence ID convention, the instance ID convention
(inst_NNNNN sequential across corpus), the extension_group_id convention,
and all field enums.

**skills/annotation_protocol.md** — Workflow: segment first, annotate second,
never combine. What counts as a metaphor instance (include vs. exclude rules).
Confidence scoring. Co-authorship protocol for doc_009. Legal document protocol
(flatness is data). Debate annotation (Lincoln turns only, tag Douglas as context).
Document-level summary object. Quality checklist before submission.

**skills/absence_analysis.md** — Theory of systematic silence. Primary absent entity.
Positive absence flags (when and how to flag). Suppression instances (separate from
positive instances). Structure of systematic_absence.md deliverable. Secondary
absence threads (lincoln_non_agent, confederates_depersonalized, death_abstracted).

**skills/diachronic_tracking.md** — Five-phase structure (1838-54 baseline,
1854-60 argument, 1861 obligation, 1862-63 transformation, 1864-65 theodicy).
The guilt_distribution diachronic series as primary analytical series (track
external → distributed arc). Shift events format. Register-controlled analysis
requirement.

**skills/close_reading.md** — Sentence-level workflow. Include/exclude rules.
Confidence scoring. Instance ID and extension_group_id generation. L-D debate
annotation (responsive_to_douglas flag). Seward passage tagging. Legal document
baseline annotation. Document-level summary format.

**skills/corpus_register.md** — Register definitions with analytical implications
for each. Register and the diachronic argument (control for register before
claiming temporal trends). Confidence adjustments by register (+0.05 formal_address
and fragment_private; -0.05 campaign_speech and congressional_message; -0.10
legal_document).

### Step 4 — Write both subagent TOML files

**subagents/lincoln_corpus_reader.toml**
- role: close-reading and annotation specialist
- read_first: all 8 skill files + corpus_manifest.json
- task: Stage 3 segmentation (all docs before Stage 4), then Stage 4 annotation
- special handling for doc_009 (Seward), doc_006a-g (debates), doc_017 (Bliss copy)
- quality gate checklist before submitting each document
- output paths: corpus/segmented/{id}_segmented.json, corpus/annotated/{id}_annotated.json

**subagents/koenigsberg_comparativist.toml**
- role: theoretical analyst and synthesis specialist
- read_first: koenigsberg_method.md, schema_definitions.md, diachronic_tracking.md,
  absence_analysis.md, corpus_manifest.json
- prerequisite: all annotated files must exist
- task: Stage 5 concordance aggregation, Stage 6 analysis, all written deliverables
- written deliverables: 6 cluster profiles, diachronic_map, systematic_absence,
  koenigsberg_comparison, theoretical_framework, findings, open_questions
- output paths listed explicitly

### Step 5 — Write the 4 JavaScript pipeline scripts

All scripts in scripts/. Write complete, working Node.js code.

**scripts/pipeline_status.js** — Reads corpus_manifest.json, checks for existence
of raw/, text/, segmented/, annotated/ files per doc_id. Prints a table with
S1/S2/S3/S4 tick or dot per document. Reports concordance instance count and
analysis status. No dependencies beyond Node stdlib.

**scripts/validate_schema.js** — Validates corpus_manifest.json (required fields,
confidence range 0-1), all segmented JSONs (sentence IDs, empty metaphor_instances
arrays), all annotated JSONs (every instance has cmt + koenigsberg + meta, all
required fields, sacrificial_economy/yield consistency, absence_flags as array),
concordance.json (indexes present), analysis.json (all 6 cluster stubs). Exit 1
on any error. No dependencies beyond Node stdlib.

**scripts/build_concordance.js** — Reads all corpus/annotated/*_annotated.json.
Extracts every metaphor_instance from every sentence. Writes concordance.json with
all indexes: by_cluster, by_document, by_register, by_fantasy_type, by_violence_logic,
by_absence_flag, high_confidence_only (>= 0.90), suppression_instances. Adds
pipeline_log entry. Reports counts on completion.

**scripts/run_analysis.js** — Reads concordance.json. For each of the 6 clusters
computes: instance_count, diachronic by_year distribution, CMT profile (dominant
forms, top 5 entailments by frequency, novel instances), Koenigsberg profile
(dominant fantasy types, violence logic, obligatory_frame_rate, sacrificial_economy_rate,
dominant projected_entity, dominant guilt_distribution, absence_flags_distribution),
register_distribution. Computes systematic_absence aggregates (by_cluster,
by_register, by_year). Computes co_activation_matrix. Preserves manually-written
fields from existing analysis.json (political_moral_work, what_metaphor_conceals,
hitler_comparison analyst notes). Writes analysis.json.

### Step 6 — Write package.json and .vscode/ config

**package.json**
```json
{
  "name": "lincoln-metaphor",
  "version": "1.0.0",
  "description": "Koenigsberg ideological fantasy analysis on Lincoln's corpus",
  "scripts": {
    "status": "node scripts/pipeline_status.js",
    "validate": "node scripts/validate_schema.js",
    "concordance": "node scripts/build_concordance.js",
    "analysis": "node scripts/run_analysis.js",
    "pipeline": "npm run validate && npm run concordance && npm run analysis"
  },
  "engines": { "node": ">=18" }
}
```

**.vscode/settings.json** — word wrap on, tabSize 2, file nesting patterns
(PROMPT.md nests DECISIONS.md; corpus_manifest.json nests schema), json.maxItemsComputed 50000

**.vscode/extensions.json** — recommend: prettier, even-better-toml,
markdown-all-in-one, vscode-markdownlint, json editor, code-spell-checker

**.vscode/tasks.json** — four tasks: Pipeline status (test group),
Validate all JSON (test), Build concordance (build, dependsOn validate),
Run analysis (build, dependsOn concordance)

**.vscode/launch.json** — Node launch configs for each script

### Step 7 — Write stub concordance and analysis JSON
Use the schemas above. Concordance: status "stub", all indexes empty arrays.
Analysis: status "stub", all 6 cluster_analyses entries with null counts,
koenigsberg_master_comparison pre-populated with known constructs.

### Step 8 — Write all analytical documents with full structure

For each of the following, write a complete structured document —
not a single-line stub. Include all sections, table headers, and
methodological guidance comments so the koenigsberg_comparativist
knows exactly what to populate.

**analysis/cluster_profiles/cluster_01.md through cluster_06.md**
Each must contain: CMT profile section (source/target, instances table,
linguistic forms, entailments, novel/conventional, extended groups),
diachronic distribution (by_year table with register column), Koenigsberg
profile (all 8 constructs with their rates), political/moral work section,
what_metaphor_conceals section, Hitler comparison section (with explicit note
on disease_and_purification presence or absence), key quoted instances.

**analysis/diachronic_map.md** — Phase structure table, cluster frequency
by year table, guilt_distribution arc table (per document), cluster shift
events table, register-controlled analysis table, narrative summary placeholder.

**analysis/systematic_absence.md** — Theoretical basis, primary absent entity
description, quantitative summary table (all absence flags), diachronic pattern
table, register differential table, cluster differential table, Black soldiers
finding table (post-1863 docs), comparative significance vs. Hitler, key findings.

**comparison/theoretical_framework.md** — CMT section (core claim, key constructs,
entailments, what CMT doesn't explain), Koenigsberg section (magical object,
obligatory frame, sacrificial economy, systematic absence), integration section
(CMT + Koenigsberg together), Lincoln vs. Hitler structural question (shared/Lincoln-
specific/Hitler-specific elements, the purification-logic absence as key finding),
scope and limitations.

**comparison/koenigsberg_comparison.md** — Shared elements (sacrificial economy,
obligatory frame, body-politic projection, ancestral debt) with evidence placeholders,
Lincoln-specific elements (experiment/proof, oath/obligation, distributed guilt),
Hitler-specific elements (disease/purification as KEY FINDING, ethnic body, scapegoat),
master comparison table, theoretical significance.

**synthesis/findings.md** — Template for 4 findings with claim/evidence/significance/
limitations structure. Pre-state two findings: (1) systematic absence of enslaved
people as agents, (2) absence of purification logic as the structural off-ramp
for reconciliation.

**synthesis/open_questions.md** — Pre-populate 5 interpretive problems:
Greeley letter reversal, Seward problem, audience problem, Black soldiers gap,
corpus limits vs. Hitler comparison. Plus directions for further research.

### Step 9 — Write PROMPT.md, DECISIONS.md, README.md

**PROMPT.md** — The master Codex/Claude Code entry point. Summarize: project goal,
corpus, 6 clusters, subagents (roles and responsibilities), pipeline stages,
skills (list with paths), deliverables checklist, execution order (always read
skills first, corpus_manifest second, segment before annotate, etc.).

**DECISIONS.md** — Resolved: wide corpus, CMT+Koenigsberg, structured JSON output,
Lincoln diachronic axis, absence thread as central. Unresolved: add 1863/1864
Annual Messages?, debate transcription variant strategy?

**README.md** — Project overview, quick start (npm run status / validate / pipeline),
directory tree, cluster table, pipeline stage table, current status.

### Step 10 — Verify
Run `node scripts/validate_schema.js` and confirm zero errors.
Run `node scripts/pipeline_status.js` and confirm all 29 documents show · · · ·
(correctly at Stage 1 — source files not yet fetched).
Report the output of both commands.

---

## Key constraints

- Never modify a completed Stage N file when working on Stage N+1
- Sentence IDs are permanent after Stage 3 — never renumber
- The absence thread is a required deliverable, not optional
- All frequency claims in analysis must have register-controlled versions
- Legal document metaphor absence is a finding, not a null result
- `disease_and_purification` fantasy type must be tracked; its absence is the key finding
- Run all analyses twice: full corpus and authorship_confidence >= 0.95 only
