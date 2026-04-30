# Close Reading — Sentence-Level Annotation Workflow

## Purpose

Close reading at the sentence level is the analytical core of this project. The schemas, scripts, and databases are infrastructure for this work. Every metaphor instance must be grounded in a specific span of text, a specific mapping, and a specific set of entailments derived from that span.

This skill file provides the sentence-level workflow: how to move from raw text through segmentation to a fully annotated instance.

---

## Sentence-Level Workflow

### Step 1: Read the paragraph in context
Before annotating any sentence, read the full paragraph it appears in, the section it belongs to, and the document occasion (from corpus_manifest.json notes). Metaphor activation is context-dependent: the same word can be figurative in one context and literal in another.

### Step 2: Identify the span
The span is the minimum text that instantiates the mapping. It may be a single word ("wound"), a phrase ("binding up the nation's wounds"), or a clause ("that government of the people, by the people, for the people, shall not perish from the earth").

`span_char_start` and `span_char_end` are character offsets within the sentence text. Count from 0.

### Step 3: State the mapping explicitly
Before writing any JSON, write out the mapping in plain language:
- Source domain: ___
- Target domain: ___
- Key correspondences: ___
- Entailments that transfer: ___

If you cannot state the mapping in plain language, the instance should not be annotated. Do not annotate what you cannot explain.

### Step 4: Assign the cluster
Match to one of the six clusters. If the instance activates multiple clusters (co-activation), list the primary cluster in `cluster_id` and all co-activated clusters in `co_activated_clusters`.

Co-activation is significant: instances that activate multiple clusters are doing more ideological work simultaneously. Note them explicitly.

### Step 5: Identify the extension group
Ask: Is this part of an extended metaphor that runs across multiple sentences? If yes, check whether an `extension_group_id` has already been assigned for this extension in this document. If not, assign the next available ID and record it. If yes, use the existing ID.

### Step 6: Work through the Koenigsberg layer
For every annotated instance, go through all 8 Koenigsberg constructs in order:
1. fantasy_type (required)
2. violence_logic (required)
3. obligatory_frame (required, boolean)
4. obligatory_frame_notes (required if true)
5. agent_of_violence + agent_is_abstract (required)
6. object_of_violence (required)
7. projected_entity (required)
8. guilt_distribution + notes (required)
9. sacrificial_economy + sacrificial_yield (required; yield null if economy false)
10. psychic_defense + notes (optional but encouraged)
11. absence_flags + absence_notes (required; flags array, notes required if non-empty)

Do not skip constructs. Assign null only when genuinely not applicable and note why.

### Step 7: Score confidence and set flags
Apply confidence scoring from `cmt_analysis.md` with adjustments from `corpus_register.md` and `annotation_protocol.md`. Set:
- `ambiguity_flag: true` if the figurative status of the span is genuinely debatable
- `irony_flag: true` if the mapping may be ironic or satirical (rare in Lincoln)
- `suppression_flag: true` if this instance represents the *absence* of an expected cluster, documented as a positive suppression finding

---

## Lincoln-Douglas Debate Annotation

The debates (doc_006a–g) require special care:

### Identifying Lincoln turns
Lincoln and Douglas alternate. Segment only Lincoln's turns. Mark each sentence `authorship_note: "lincoln_turn"`. Douglas sentences get `authorship_note: "douglas_turn"` and empty `metaphor_instances`.

### Responsive annotation
When Lincoln's metaphor directly responds to or counters a Douglas claim, add to `annotation_notes`:
```
"responsive_to_douglas: true — Douglas had claimed [X]; Lincoln's [cluster] responds by..."
```

This is analytically important because metaphors under adversarial pressure reveal which mappings Lincoln considers essential enough to defend.

### Audience context
The debates were held in geographically and politically varied locations. For suppression analysis (especially doc_006c Jonesboro and doc_006d Charleston), note the audience context explicitly and compare cluster activation to the more receptive northern Illinois venues.

---

## Seward Passage Protocol (doc_009)

The closing of the First Inaugural was drafted by Seward and revised by Lincoln. Lincoln's revision of Seward's draft is on record in Collected Works vol.4, appendix.

For Seward-origin sentences:
- Set `authorship_note: "seward_revised"` in segmentation
- Annotate normally but note in `annotation_notes`: "Seward draft; Lincoln revision preserved [X] but changed [Y]"
- In document-level summary, report cluster_distribution both including and excluding Seward-revised sentences

The "mystic chords of memory" sentence is Seward's most notable metaphor contribution to Lincoln's canon. Annotate it as `authorship_note: "seward_revised"` and note whether the cluster it activates (cluster_02 covenant) is consistent with Lincoln's own usage.

---

## Legal Document Baseline

For doc_013 (Preliminary Emancipation) and doc_015 (Final Emancipation):

The absence of metaphor is the finding. Annotate as follows:
- Segment normally
- Annotate any metaphor instance found, but expect very few
- In document-level summary, explicitly state: `primary_finding: "legal register produces near-total metaphor absence; flatness is data"`
- Note in `annotator_notes`: "The document that actually freed enslaved people is the most metaphor-sparse document in the corpus. Compare to the rich metaphor density of contemporaneous formal_public_addresses."

This contrast is analytically important: Lincoln's most rhetorically powerful metaphors (birth, sacrifice, proposition) appear in speeches about the war; the actual legal instrument of emancipation is stripped of them.

---

## Instance ID Generation

Before starting any annotation session:
1. Read `corpus/annotated/instance_counter.json`
2. Note the `last_instance_id` value
3. Assign new IDs sequentially from `last_instance_id + 1`
4. After completing the session, update `instance_counter.json` with the new `last_instance_id`

Format: `inst_` + 5-digit zero-padded integer. First instance: `inst_00001`.

Never reuse instance IDs. Never assign IDs without consulting the counter. Never leave gaps.

---

## Document-Level Summary Format

After completing Stage 4 for a document, compute and attach the `document_summary` object described in `annotation_protocol.md`. This is required for every document before the annotated JSON is considered complete.

The summary is the document's contribution to corpus-level analysis. The Stage 5 concordance builder reads these summaries to construct cross-document indexes.

Immediately after writing the annotated JSON, run `node scripts/validate_annotation_output.js {doc_id}`. If validation fails, pause and ask the user whether to fix the schema errors now, show the errors only, or leave the file as-is and stop.
