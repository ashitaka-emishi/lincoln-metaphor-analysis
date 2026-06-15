#!/usr/bin/env node
// Builds the Stage 4B reliability sample and double-coding templates.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');
const EVIDENCE_PATH = path.join(ROOT, 'data', 'evidence', 'annotation-evidence.json');
const SEGMENTED_DIR = path.join(ROOT, 'corpus', 'segmented');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reliability');
const SAMPLE_PATH = path.join(OUTPUT_DIR, 'reliability-sample.json');
const CODING_TEMPLATE_PATH = path.join(OUTPUT_DIR, 'double-coding-template.csv');
const ADJUDICATION_LOG_PATH = path.join(OUTPUT_DIR, 'adjudication-log.csv');

const SAMPLE_DOCS = [
  {
    id: 'doc_001',
    rationale: 'Phase 1 baseline formal address with early covenant, inheritance, and organism evidence.'
  },
  {
    id: 'doc_006g',
    rationale: 'Phase 2 campaign debate document with Lincoln-primary authorship and transcription-variant risk.'
  },
  {
    id: 'doc_010',
    rationale: 'Phase 3 congressional message with obligation logic and lower authorship confidence than the formal-address core.'
  },
  {
    id: 'doc_017',
    rationale: 'Phase 4 Gettysburg evidence with dense multi-cluster annotation and manuscript-variant caution.'
  },
  {
    id: 'doc_021',
    rationale: 'Phase 5 Second Inaugural evidence where providence, theodicy, guilt, and reconciliation are concentrated.'
  }
];

const DISAGREEMENT_CATEGORIES = [
  'none',
  'mipvu_decision',
  'lexical_unit_boundary',
  'basic_or_contextual_meaning',
  'historical_semantics',
  'cluster_assignment',
  'source_domain',
  'target_domain',
  'entailment',
  'fantasy_type',
  'violence_logic',
  'obligatory_frame',
  'agency_or_absence_flag',
  'confidence_band',
  'textual_or_provenance_uncertainty',
  'out_of_scope'
];

const CODING_COLUMNS = [
  'reliability_unit_id',
  'unit_type',
  'coder_id',
  'document_id',
  'sentence_id',
  'sentence_text',
  'source_audit_id',
  'source_span_text',
  'candidate_lexical_unit',
  'span_char_start',
  'span_char_end',
  'mipvu_decision',
  'contextual_meaning',
  'basic_meaning',
  'historical_semantics_note',
  'cluster_id',
  'source_domain',
  'target_domain',
  'entailments',
  'fantasy_type',
  'violence_logic',
  'obligatory_frame',
  'absence_flags',
  'confidence_score',
  'ambiguity_flag',
  'disagreement_category',
  'coder_notes'
];

const ADJUDICATION_COLUMNS = [
  'adjudication_id',
  'reliability_unit_id',
  'source_audit_id',
  'document_id',
  'sentence_id',
  'field_name',
  'coder_a_value',
  'coder_b_value',
  'disagreement_category',
  'adjudicated_value',
  'rationale',
  'adjudicator',
  'adjudicated_date',
  'follow_up_required',
  'follow_up_issue'
];

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCSV(filePath, rows, columns) {
  const lines = [
    columns.join(','),
    ...rows.map(row => columns.map(column => csvEscape(row[column])).join(','))
  ];
  fs.writeFileSync(filePath, lines.join('\n') + '\n');
}

function flattenSentences(segmented) {
  const sentences = [];
  for (const section of segmented.sections || []) {
    for (const paragraph of section.paragraphs || []) {
      for (const sentence of paragraph.sentences || []) {
        sentences.push({
          document_id: segmented.document_id,
          section_id: section.section_id || null,
          paragraph_id: paragraph.paragraph_id || null,
          sentence_id: sentence.sentence_id,
          sentence_text: sentence.text || '',
          sentence_ordinal: sentence.sentence_ordinal || null
        });
      }
    }
  }
  return sentences;
}

function selectEvenlySpaced(items, count) {
  if (items.length <= count) return items;
  if (count <= 1) return [items[Math.floor(items.length / 2)]];
  const selected = [];
  const last = items.length - 1;
  for (let i = 0; i < count; i++) {
    selected.push(items[Math.round((i * last) / (count - 1))]);
  }
  return selected;
}

function makeIdentificationUnits(docId, sentences, records) {
  const bySentence = new Map();
  for (const record of records) {
    const sentenceId = record.location.sentence_id;
    if (!bySentence.has(sentenceId)) bySentence.set(sentenceId, []);
    bySentence.get(sentenceId).push(record.audit_id);
  }

  const positiveSentenceIds = new Set(bySentence.keys());
  const positiveUnits = sentences
    .filter(sentence => positiveSentenceIds.has(sentence.sentence_id))
    .map(sentence => ({
      reliability_unit_id: `rel_ident_${sentence.sentence_id}`,
      unit_type: 'sentence_identification',
      document_id: docId,
      section_id: sentence.section_id,
      paragraph_id: sentence.paragraph_id,
      sentence_id: sentence.sentence_id,
      sentence_text: sentence.sentence_text,
      stage4_anchor_audit_ids: bySentence.get(sentence.sentence_id),
      stage4_anchor_count: bySentence.get(sentence.sentence_id).length,
      control_type: 'positive_anchor'
    }));

  const negativeCandidates = sentences.filter(sentence => !positiveSentenceIds.has(sentence.sentence_id));
  const negativeUnits = selectEvenlySpaced(negativeCandidates, 3).map(sentence => ({
    reliability_unit_id: `rel_ident_${sentence.sentence_id}`,
    unit_type: 'sentence_identification',
    document_id: docId,
    section_id: sentence.section_id,
    paragraph_id: sentence.paragraph_id,
    sentence_id: sentence.sentence_id,
    sentence_text: sentence.sentence_text,
    stage4_anchor_audit_ids: [],
    stage4_anchor_count: 0,
    control_type: 'negative_control'
  }));

  return [...positiveUnits, ...negativeUnits].sort((a, b) => a.sentence_id.localeCompare(b.sentence_id));
}

function makeFieldAgreementUnit(record) {
  return {
    reliability_unit_id: `rel_field_${record.audit_id}`,
    unit_type: 'field_agreement',
    source_audit_id: record.audit_id,
    document_id: record.document.id,
    sentence_id: record.location.sentence_id,
    sentence_text: record.location.sentence_text,
    span_text: record.location.span_text,
    reference_values: {
      mipvu_decision: record.lexical_unit.mipvu_decision,
      contextual_meaning: record.lexical_unit.contextual_meaning,
      basic_meaning: record.lexical_unit.basic_meaning,
      cluster_id: record.cmt.cluster_id,
      source_domain: record.cmt.source_domain,
      target_domain: record.cmt.target_domain,
      entailments: record.cmt.entailments,
      fantasy_type: record.koenigsberg.fantasy_type,
      violence_logic: record.koenigsberg.violence_logic,
      obligatory_frame: record.koenigsberg.obligatory_frame,
      absence_flags: record.agency_absence.absence_flags,
      confidence_score: record.confidence.score,
      ambiguity_flag: record.confidence.ambiguity_flag
    }
  };
}

function makeCodingTemplateRows(identificationUnits, fieldAgreementUnits) {
  const identificationRows = identificationUnits.map(unit => ({
    reliability_unit_id: unit.reliability_unit_id,
    unit_type: unit.unit_type,
    coder_id: '',
    document_id: unit.document_id,
    sentence_id: unit.sentence_id,
    sentence_text: unit.sentence_text,
    source_audit_id: '',
    source_span_text: '',
    candidate_lexical_unit: '',
    span_char_start: '',
    span_char_end: '',
    mipvu_decision: '',
    contextual_meaning: '',
    basic_meaning: '',
    historical_semantics_note: '',
    cluster_id: '',
    source_domain: '',
    target_domain: '',
    entailments: '',
    fantasy_type: '',
    violence_logic: '',
    obligatory_frame: '',
    absence_flags: '',
    confidence_score: '',
    ambiguity_flag: '',
    disagreement_category: '',
    coder_notes: ''
  }));

  const fieldRows = fieldAgreementUnits.map(unit => ({
    reliability_unit_id: unit.reliability_unit_id,
    unit_type: unit.unit_type,
    coder_id: '',
    document_id: unit.document_id,
    sentence_id: unit.sentence_id,
    sentence_text: unit.sentence_text,
    source_audit_id: unit.source_audit_id,
    source_span_text: unit.span_text,
    candidate_lexical_unit: unit.span_text,
    span_char_start: '',
    span_char_end: '',
    mipvu_decision: '',
    contextual_meaning: '',
    basic_meaning: '',
    historical_semantics_note: '',
    cluster_id: '',
    source_domain: '',
    target_domain: '',
    entailments: '',
    fantasy_type: '',
    violence_logic: '',
    obligatory_frame: '',
    absence_flags: '',
    confidence_score: '',
    ambiguity_flag: '',
    disagreement_category: '',
    coder_notes: ''
  }));

  return [...identificationRows, ...fieldRows];
}

function main() {
  const manifest = readJSON(MANIFEST_PATH);
  const evidence = readJSON(EVIDENCE_PATH);
  const docMeta = new Map((manifest.documents || []).map(doc => [doc.id, doc]));
  const sampleDocIds = SAMPLE_DOCS.map(doc => doc.id);
  const sampleDocSet = new Set(sampleDocIds);
  const sampleRecords = evidence.records.filter(record => sampleDocSet.has(record.document.id));

  const documents = [];
  const identificationUnits = [];
  const fieldAgreementUnits = sampleRecords.map(makeFieldAgreementUnit);

  for (const sampleDoc of SAMPLE_DOCS) {
    const meta = docMeta.get(sampleDoc.id);
    if (!meta) throw new Error(`Sample document not found in manifest: ${sampleDoc.id}`);

    const segmented = readJSON(path.join(SEGMENTED_DIR, `${sampleDoc.id}.json`));
    const sentences = flattenSentences(segmented);
    const docRecords = sampleRecords.filter(record => record.document.id === sampleDoc.id);
    const docIdentificationUnits = makeIdentificationUnits(sampleDoc.id, sentences, docRecords);
    identificationUnits.push(...docIdentificationUnits);

    documents.push({
      id: meta.id,
      title: meta.title,
      short_title: meta.short_title,
      date: meta.date,
      period: meta.period,
      genre: meta.genre,
      register: meta.register,
      authorship: meta.authorship,
      authorship_confidence: meta.authorship_confidence,
      source_url: meta.source_url,
      editorial_status: meta.editorial_status,
      risk_flags: meta.risk_flags || [],
      analytical_priority: meta.analytical_priority,
      sentences_total: sentences.length,
      evidence_records_total: docRecords.length,
      identification_units_total: docIdentificationUnits.length,
      rationale: sampleDoc.rationale
    });
  }

  const output = {
    version: '1.0',
    generated: today(),
    status: 'sample_defined_adjudication_pending',
    source_stage: 'stage4a_annotation_evidence',
    sample_policy: {
      unit: 'document_stratified_reliability_sample',
      corpus_documents_total: manifest.documents.length,
      sample_documents_total: documents.length,
      sample_percentage: Number(((documents.length / manifest.documents.length) * 100).toFixed(2)),
      allowed_percentage_range: [10, 20],
      selection_method: 'purposive stratified sample: one document from each diachronic period, favoring high analytical priority, dense evidence, and known provenance risks',
      selected_document_ids: sampleDocIds,
      limitations: [
        'The sample tests all five diachronic periods but cannot cover every register within the 20 percent document cap.',
        'Identification units include positive anchors from Stage 4A plus deterministic negative sentence controls; coders should add rows when they identify additional metaphor-related lexical units.'
      ]
    },
    double_coding_policy: {
      coders_required: 2,
      blind_to_reference_values: true,
      identification_pass: 'sentence_identification rows test whether coders identify metaphor-related lexical units and boundaries before seeing CMT or Koenigsberg fields.',
      field_agreement_pass: 'field_agreement rows provide Stage 4A span text so coders can independently assign CMT, Koenigsberg, absence, confidence, and ambiguity fields.',
      adjudication_log: 'data/reliability/adjudication-log.csv'
    },
    agreement_measures: {
      identification_reliability: [
        'sentence-level present/absent agreement',
        'boundary exact match and overlap match',
        'precision, recall, and F1 against adjudicated consensus for metaphor-related lexical units'
      ],
      cmt_agreement: [
        'cluster_id exact agreement',
        'source_domain and target_domain family agreement',
        'entailment overlap reviewed qualitatively'
      ],
      koenigsberg_agreement: [
        'fantasy_type exact agreement',
        'violence_logic and obligatory_frame agreement',
        'absence_flags Jaccard overlap plus adjudicated rationale'
      ],
      confidence_agreement: [
        'same confidence band agreement',
        'mean absolute score difference'
      ],
      reporting_rule: 'Do not collapse identification reliability and interpretive agreement into one score.'
    },
    disagreement_categories: DISAGREEMENT_CATEGORIES,
    documents,
    identification_units: identificationUnits,
    field_agreement_units: fieldAgreementUnits,
    totals: {
      documents: documents.length,
      identification_units: identificationUnits.length,
      field_agreement_units: fieldAgreementUnits.length,
      evidence_records_in_sample: sampleRecords.length,
      negative_control_units: identificationUnits.filter(unit => unit.control_type === 'negative_control').length
    },
    pipeline_log: [
      {
        stage: '4B',
        agent: 'build_reliability_sample.js',
        date: today(),
        sample_documents_total: documents.length,
        identification_units: identificationUnits.length,
        field_agreement_units: fieldAgreementUnits.length
      }
    ]
  };

  const templateRows = makeCodingTemplateRows(identificationUnits, fieldAgreementUnits);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(SAMPLE_PATH, JSON.stringify(output, null, 2) + '\n');
  writeCSV(CODING_TEMPLATE_PATH, templateRows, CODING_COLUMNS);
  writeCSV(ADJUDICATION_LOG_PATH, [], ADJUDICATION_COLUMNS);

  console.log(`Reliability sample written to ${path.relative(ROOT, SAMPLE_PATH)}`);
  console.log(`Double-coding template written to ${path.relative(ROOT, CODING_TEMPLATE_PATH)}`);
  console.log(`Adjudication log initialized at ${path.relative(ROOT, ADJUDICATION_LOG_PATH)}`);
  console.log(`Sample documents: ${documents.length}/${manifest.documents.length} (${output.sample_policy.sample_percentage}%)`);
  console.log(`Identification units: ${identificationUnits.length}`);
  console.log(`Field-agreement units: ${fieldAgreementUnits.length}`);
}

main();
