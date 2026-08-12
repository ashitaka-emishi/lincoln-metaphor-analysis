#!/usr/bin/env node
// Generates deterministic, blind Stage 4H human coding packets from Stage 4B inputs.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ABSENCE_FLAGS, CLUSTER_IDS, FANTASY_TYPES } = require('../schema_constants');
const { writeAtomic } = require('./write-guard');

const ROOT = process.env.STAGE4H_ROOT
  ? path.resolve(process.env.STAGE4H_ROOT)
  : path.resolve(__dirname, '..', '..');
const SCRIPT_VERSION = '1.0.0';
const SAMPLE_PATH = path.join(ROOT, 'data', 'reliability', 'reliability-sample.json');
const SEGMENTED_DIR = path.join(ROOT, 'corpus', 'segmented');
const CODEBOOK_PATH = path.join(ROOT, 'docs', 'methodology', 'annotation-codebook.md');
const TRAINING_GUIDE_PATH = path.join(ROOT, 'docs', 'methodology', 'human-coder-training-guide.md');
const SAMPLE_DESIGN_PATH = path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-sample-design.md');
const SCHEMA_CONSTANTS_PATH = path.join(ROOT, 'scripts', 'schema_constants.js');
const HUMAN_OUTPUT_SCHEMA_PATH = path.join(ROOT, 'schemas', 'stage4h-human-output.schema.json');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reliability', 'human-input-packets');

const OUTPUT_PATHS = Object.freeze({
  manifest: path.join(OUTPUT_DIR, 'human-packet-manifest.json'),
  sentences: path.join(OUTPUT_DIR, 'human-sentence-identification-packet.jsonl'),
  fieldAgreement: path.join(OUTPUT_DIR, 'human-field-agreement-packet.jsonl'),
  csvTemplate: path.join(OUTPUT_DIR, 'human-coder-template.csv'),
  jsonTemplate: path.join(OUTPUT_DIR, 'human-coder-template.json'),
  instructions: path.join(OUTPUT_DIR, 'human-packet-instructions.md')
});

const CODER_COLUMNS = Object.freeze([
  'submission_id',
  'coder_id',
  'coder_role',
  'submission_date',
  'input_packet_id',
  'input_packet_hash',
  'training_completed',
  'conflict_disclosure',
  'notes',
  'packet_unit_id',
  'task_type',
  'doc_id',
  'sentence_id',
  'span_id',
  'metaphor_present',
  'lexical_unit',
  'lexical_unit_start',
  'lexical_unit_end',
  'basic_meaning',
  'contextual_meaning',
  'semantic_contrast',
  'source_domain',
  'target_domain',
  'cluster_id',
  'mapping_description',
  'koenigsberg_function',
  'violence_logic',
  'obligatory_frame',
  'sacrifice_logic',
  'guilt_logic',
  'providence_logic',
  'reconciliation_logic',
  'primary_actor',
  'acted_upon_entity',
  'agency_status',
  'absence_flag',
  'enslaved_people_present',
  'black_soldiers_present',
  'disease_or_purification_present',
  'confidence',
  'ambiguity_flag',
  'rival_reading',
  'out_of_scope',
  'coder_comment'
]);

// Fields the coder fills in — must be blank in the seeded template.
const CODER_RESPONSE_FIELDS = Object.freeze([
  'span_id',
  'metaphor_present',
  'lexical_unit',
  'lexical_unit_start',
  'lexical_unit_end',
  'basic_meaning',
  'contextual_meaning',
  'semantic_contrast',
  'source_domain',
  'target_domain',
  'cluster_id',
  'mapping_description',
  'koenigsberg_function',
  'violence_logic',
  'obligatory_frame',
  'sacrifice_logic',
  'guilt_logic',
  'providence_logic',
  'reconciliation_logic',
  'primary_actor',
  'acted_upon_entity',
  'agency_status',
  'absence_flag',
  'enslaved_people_present',
  'black_soldiers_present',
  'disease_or_purification_present',
  'confidence',
  'ambiguity_flag',
  'rival_reading',
  'out_of_scope',
  'coder_comment'
]);

const VIOLENCE_LOGIC_VALUES = Object.freeze([
  'restorative',
  'generative',
  'punitive',
  'purifying',
  'evidentiary',
  'obligatory'
]);

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function hashFile(filePath) {
  return sha256Bytes(fs.readFileSync(filePath));
}

function canonicalJSON(value) {
  if (Array.isArray(value)) return value.map(canonicalJSON);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, canonicalJSON(value[key])])
    );
  }
  return value;
}

function generationTimestamp(packetId) {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch !== undefined) {
    if (!/^\d+$/.test(epoch)) throw new Error('SOURCE_DATE_EPOCH must be a non-negative integer Unix timestamp.');
    const milliseconds = Number(epoch) * 1000;
    if (!Number.isFinite(milliseconds)) throw new Error('SOURCE_DATE_EPOCH is outside the supported timestamp range.');
    return {
      value: new Date(milliseconds).toISOString(),
      source: 'SOURCE_DATE_EPOCH'
    };
  }

  if (fs.existsSync(OUTPUT_PATHS.manifest)) {
    const existing = readJSON(OUTPUT_PATHS.manifest);
    if (existing.packet_id === packetId && !Number.isNaN(Date.parse(existing.generated_at || ''))) {
      return {
        value: existing.generated_at,
        source: existing.generation_timestamp_source || 'preserved from existing manifest'
      };
    }
  }

  return {
    value: new Date().toISOString(),
    source: 'system clock at first generation for packet_id'
  };
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function makeCSV(rows) {
  return [
    CODER_COLUMNS.join(','),
    ...rows.map(row => CODER_COLUMNS.map(col => csvEscape(row[col])).join(','))
  ].join('\n') + '\n';
}

function makeJSONL(records) {
  return records.map(record => JSON.stringify(record)).join('\n') + '\n';
}

function flattenSentences(segmented) {
  const sentences = [];
  for (const section of segmented.sections || []) {
    for (const paragraph of section.paragraphs || []) {
      for (const sentence of paragraph.sentences || []) {
        sentences.push({
          document_id: segmented.document_id,
          section_id: section.section_id || null,
          section_label: section.section_label || null,
          paragraph_id: paragraph.paragraph_id || null,
          sentence_id: sentence.sentence_id,
          sentence_text: sentence.text || ''
        });
      }
    }
  }
  return sentences;
}

function buildSentenceIndex(documentIds) {
  const indexes = new Map();
  for (const documentId of documentIds) {
    const segmentedPath = path.join(SEGMENTED_DIR, `${documentId}.json`);
    const sentences = flattenSentences(readJSON(segmentedPath));
    const byParagraph = new Map();
    for (const sentence of sentences) {
      if (!byParagraph.has(sentence.paragraph_id)) byParagraph.set(sentence.paragraph_id, []);
      byParagraph.get(sentence.paragraph_id).push({
        sentence_id: sentence.sentence_id,
        sentence_text: sentence.sentence_text
      });
    }
    const byId = new Map();
    sentences.forEach((sentence, index) => {
      byId.set(sentence.sentence_id, {
        ...sentence,
        previous: index > 0 ? sentences[index - 1] : null,
        next: index + 1 < sentences.length ? sentences[index + 1] : null,
        paragraph_sentences: byParagraph.get(sentence.paragraph_id)
      });
    });
    indexes.set(documentId, byId);
  }
  return indexes;
}

function contextFor(sentence) {
  return {
    section_label: sentence.section_label,
    paragraph_sentences: sentence.paragraph_sentences,
    previous_sentence_id: sentence.previous ? sentence.previous.sentence_id : null,
    previous_sentence_text: sentence.previous ? sentence.previous.sentence_text : null,
    next_sentence_id: sentence.next ? sentence.next.sentence_id : null,
    next_sentence_text: sentence.next ? sentence.next.sentence_text : null
  };
}

function compareUnits(left, right) {
  return left.document_id.localeCompare(right.document_id)
    || left.sentence_id.localeCompare(right.sentence_id)
    || String(left.span_text || '').localeCompare(String(right.span_text || ''));
}

function buildPackets(sample, sentenceIndexes) {
  const identificationSource = [...(sample.identification_units || [])].sort(compareUnits);
  const fieldSource = [...(sample.field_agreement_units || [])].sort(compareUnits);
  const documents = new Map((sample.documents || []).map(document => [document.id, {
    document_id: document.id,
    title: document.title,
    short_title: document.short_title,
    date: document.date,
    period: document.period,
    register: document.register,
    authorship: document.authorship,
    authorship_confidence: document.authorship_confidence,
    editorial_status: document.editorial_status,
    risk_flags: document.risk_flags || []
  }]));

  for (const unit of [...identificationSource, ...fieldSource]) {
    if (!documents.has(unit.document_id)) {
      throw new Error(`Reliability sample metadata not found for ${unit.document_id}.`);
    }
  }

  const identification = identificationSource.map((unit, index) => {
    const sentence = sentenceIndexes.get(unit.document_id)?.get(unit.sentence_id);
    if (!sentence) throw new Error(`Canonical sentence not found: ${unit.document_id}/${unit.sentence_id}`);
    if (sentence.sentence_text !== unit.sentence_text) {
      throw new Error(`Sentence text mismatch for ${unit.sentence_id}.`);
    }
    return {
      packet_unit_id: `stage4h_ident_${String(index + 1).padStart(5, '0')}`,
      packet_type: 'sentence_identification',
      document_id: unit.document_id,
      section_id: sentence.section_id,
      paragraph_id: sentence.paragraph_id,
      sentence_id: sentence.sentence_id,
      sentence_text: sentence.sentence_text,
      document_context: documents.get(unit.document_id),
      context: contextFor(sentence)
    };
  });

  const fieldAgreement = fieldSource.map((unit, index) => {
    const sentence = sentenceIndexes.get(unit.document_id)?.get(unit.sentence_id);
    if (!sentence) throw new Error(`Canonical sentence not found: ${unit.document_id}/${unit.sentence_id}`);
    if (sentence.sentence_text !== unit.sentence_text) {
      throw new Error(`Sentence text mismatch for ${unit.sentence_id}.`);
    }
    const spanStart = sentence.sentence_text.indexOf(unit.span_text);
    if (spanStart === -1) {
      throw new Error(`Provided span is not present in canonical sentence ${unit.sentence_id}.`);
    }
    return {
      packet_unit_id: `stage4h_field_${String(index + 1).padStart(5, '0')}`,
      packet_type: 'field_agreement',
      document_id: unit.document_id,
      section_id: sentence.section_id,
      paragraph_id: sentence.paragraph_id,
      sentence_id: sentence.sentence_id,
      sentence_text: sentence.sentence_text,
      provided_span_text: unit.span_text,
      provided_span_char_start: spanStart,
      provided_span_char_end: spanStart + unit.span_text.length,
      document_context: documents.get(unit.document_id),
      context: contextFor(sentence)
    };
  });

  return { identification, fieldAgreement };
}

function templateRow(unit, packetId, inputPacketHash) {
  const isField = unit.packet_type === 'field_agreement';
  const row = {
    submission_id: '',
    coder_id: '',
    coder_role: 'human_coder',
    submission_date: '',
    input_packet_id: packetId,
    input_packet_hash: inputPacketHash,
    training_completed: '',
    conflict_disclosure: '',
    notes: '',
    packet_unit_id: unit.packet_unit_id,
    task_type: unit.packet_type,
    doc_id: unit.document_id,
    sentence_id: unit.sentence_id,
    span_id: isField ? unit.packet_unit_id : '',
    lexical_unit: isField ? unit.provided_span_text : '',
    lexical_unit_start: isField ? String(unit.provided_span_char_start) : '',
    lexical_unit_end: isField ? String(unit.provided_span_char_end) : ''
  };
  for (const field of CODER_RESPONSE_FIELDS) {
    if (!Object.hasOwn(row, field)) row[field] = '';
  }
  return row;
}

function bulletValues(values) {
  return values.map(v => `  - \`${v}\``).join('\n');
}

function makeInstructions(packetId, counts) {
  return `# Stage 4H Blind Human Coding Packet

Packet ID: \`${packetId}\`

This is a blind two-human inter-annotator reliability study. You are one of two independent coders applying the project's annotation scheme to Lincoln passages. Your work must be completed independently of the other coder.

Read the [Human Coder Training Guide](../../../docs/methodology/human-coder-training-guide.md) completely before beginning. If you have not completed the calibration packet and reviewed the answer key with your coordinator, stop and do that first.

## Blindness Rules

Before and during coding, do not consult:

- Stage 4A annotation files, evidence chains, or any project annotation outputs.
- Stage 4B or Stage 4M reliability results, comparison outputs, or adjudication records.
- Synthesis pages, claim-audit materials, or any document that states the project's conclusions.
- The other coder's worksheet.
- Any draft or published version of the project's final conclusions.

## Return Format

Return your completed \`human-coder-template.csv\`. Fill in the submission metadata columns on every row using the identifier your coordinator assigned you (\`human_coder_a\` or \`human_coder_b\`). Preserve \`packet_unit_id\`, \`task_type\`, \`doc_id\`, \`sentence_id\`, \`input_packet_id\`, \`input_packet_hash\`, and pre-filled field-agreement span values exactly.

Character offsets (\`lexical_unit_start\`, \`lexical_unit_end\`) are zero-based and end-exclusive relative to the sentence text in the JSONL packet.

## Sentence-Identification Tasks (${counts.identification})

For each row in \`human-sentence-identification-packet.jsonl\`:

1. Read the sentence and its paragraph context.
2. Decide whether the sentence contains a metaphor-related lexical unit using the MIPVU procedure in the training guide.
3. If yes: record \`metaphor_present\` as \`yes\`, enter the span in \`lexical_unit\`, and record character start/end positions. Add one row per additional unit if the sentence contains more than one.
4. If no: record \`metaphor_present\` as \`no\`, set \`semantic_contrast\` to \`no\`, and use \`null\` or empty values for fields that do not apply.
5. If uncertain: record \`metaphor_present\` as \`uncertain\`, set \`ambiguity_flag\` to \`yes\`, and explain in \`coder_comment\`.

## Field-Agreement Tasks (${counts.fieldAgreement})

For each row in \`human-field-agreement-packet.jsonl\`, the span has been identified for you in \`lexical_unit\`. Code it across all fields. If you believe the span is not metaphor-related, record \`metaphor_present\` as \`no\`, use \`null\` or empty values for downstream fields that do not apply, and explain in \`coder_comment\`.

## Controlled Values

\`metaphor_present\`:
  - \`yes\`
  - \`no\`
  - \`uncertain\`

\`cluster_id\`:
${bulletValues(CLUSTER_IDS)}

\`koenigsberg_function\`:
${bulletValues(FANTASY_TYPES)}

\`violence_logic\` (one or more, pipe-separated):
${bulletValues(VIOLENCE_LOGIC_VALUES)}

\`absence_flag\` (one flag per row):
${bulletValues(ABSENCE_FLAGS)}

\`obligatory_frame\`: free text or \`null\` when not applicable

\`semantic_contrast\`: \`yes\`, \`no\`, or \`uncertain\`

\`ambiguity_flag\`: \`yes\` or \`no\`

\`confidence\`: \`high\`, \`medium\`, or \`low\`

Use \`rival_reading\` to describe an alternative you considered but rejected. Use \`coder_comment\` for any other observations. Pipe-separate multiple values in \`violence_logic\` when needed.
`;
}

function sourceFiles(sample) {
  const selectedDocumentIds = sample.sample_policy && sample.sample_policy.selected_document_ids;
  if (!Array.isArray(selectedDocumentIds) || selectedDocumentIds.length === 0) {
    throw new Error('Reliability sample has no selected document IDs.');
  }
  return [
    SAMPLE_PATH,
    ...selectedDocumentIds.map(documentId => path.join(SEGMENTED_DIR, `${documentId}.json`)),
    CODEBOOK_PATH,
    TRAINING_GUIDE_PATH,
    SAMPLE_DESIGN_PATH,
    HUMAN_OUTPUT_SCHEMA_PATH,
    SCHEMA_CONSTANTS_PATH,
    __filename
  ];
}

function main() {
  const sample = readJSON(SAMPLE_PATH);

  const selectedDocumentIds = sample.sample_policy && sample.sample_policy.selected_document_ids;
  if (!Array.isArray(selectedDocumentIds) || selectedDocumentIds.length === 0) {
    throw new Error('Reliability sample has no selected document IDs.');
  }

  const allSourceFiles = sourceFiles(sample);
  for (const filePath of allSourceFiles) {
    if (!fs.existsSync(filePath)) throw new Error(`Required Stage 4H input is missing: ${relative(filePath)}`);
  }

  const sourceHashes = allSourceFiles
    .map(filePath => ({ path: relative(filePath), sha256: hashFile(filePath) }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const packetFingerprint = sha256Bytes(JSON.stringify(canonicalJSON({
    script_version: SCRIPT_VERSION,
    source_files: sourceHashes
  })));
  const packetId = `stage4h_${packetFingerprint.slice(0, 16)}`;
  const timestamp = generationTimestamp(packetId);

  const sentenceIndexes = buildSentenceIndex(selectedDocumentIds);
  const packets = buildPackets(sample, sentenceIndexes);
  const allUnits = [...packets.identification, ...packets.fieldAgreement];

  const instructions = makeInstructions(packetId, {
    identification: packets.identification.length,
    fieldAgreement: packets.fieldAgreement.length
  });
  const inputPacketHash = sha256Bytes(JSON.stringify(canonicalJSON(allUnits)));
  const templateRows = allUnits.map(unit => templateRow(unit, packetId, inputPacketHash));
  const metadataColumns = [
    'submission_id',
    'coder_id',
    'coder_role',
    'submission_date',
    'input_packet_id',
    'input_packet_hash',
    'training_completed',
    'conflict_disclosure',
    'notes'
  ];
  const jsonItemColumns = CODER_COLUMNS.filter(column => !metadataColumns.includes(column));
  const jsonItems = templateRows.map(row => Object.fromEntries(
    jsonItemColumns.map(column => [column, row[column]])
  ));

  const artifactContents = new Map([
    [OUTPUT_PATHS.sentences, makeJSONL(packets.identification)],
    [OUTPUT_PATHS.fieldAgreement, makeJSONL(packets.fieldAgreement)],
    [OUTPUT_PATHS.instructions, instructions],
    [OUTPUT_PATHS.csvTemplate, makeCSV(templateRows)],
    [OUTPUT_PATHS.jsonTemplate, JSON.stringify({
      submission_id: '',
      coder_id: '',
      coder_role: 'human_coder',
      submission_date: '',
      input_packet_id: packetId,
      input_packet_hash: inputPacketHash,
      training_completed: false,
      conflict_disclosure: '',
      notes: '',
      items: jsonItems
    }, null, 2) + '\n']
  ]);

  for (const [filePath, contents] of artifactContents) writeAtomic(filePath, contents);

  const outputs = [...artifactContents.entries()].map(([filePath, contents]) => ({
    path: relative(filePath),
    sha256: sha256Bytes(contents),
    records: filePath === OUTPUT_PATHS.sentences
      ? packets.identification.length
      : filePath === OUTPUT_PATHS.fieldAgreement
        ? packets.fieldAgreement.length
        : filePath === OUTPUT_PATHS.csvTemplate || filePath === OUTPUT_PATHS.jsonTemplate
          ? templateRows.length
          : null
  }));

  const manifest = {
    schema_version: 'stage4h-packet-manifest-1.0',
    packet_id: packetId,
    generated_at: timestamp.value,
    generation_timestamp_source: timestamp.source,
    generator: {
      path: relative(__filename),
      version: SCRIPT_VERSION,
      runtime: 'node'
    },
    status: 'packet_ready',
    blindness: {
      stage4a_reference_values_included: false,
      stage4b_values_included: false,
      stage4m_values_included: false,
      adjudication_results_included: false,
      reliability_results_included: false,
      synthesis_claims_included: false
    },
    input_packet_hash: inputPacketHash,
    selected_document_ids: selectedDocumentIds,
    counts: {
      sentence_identification_units: packets.identification.length,
      field_agreement_units: packets.fieldAgreement.length,
      template_rows: templateRows.length
    },
    source_files: sourceHashes,
    outputs
  };
  writeAtomic(OUTPUT_PATHS.manifest, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`Stage 4H packet generated: ${packetId}`);
  console.log(`Sentence-identification units: ${packets.identification.length}`);
  console.log(`Field-agreement units: ${packets.fieldAgreement.length}`);
  console.log(`Manifest: ${relative(OUTPUT_PATHS.manifest)}`);
}

main();
