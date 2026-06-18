#!/usr/bin/env node
// Builds completed Stage 4B reliability coding, adjudication, and metrics.
'use strict';

const fs = require('fs');
const path = require('path');
const { generatedDateForFile } = require('./generated_metadata');

const ROOT = path.resolve(__dirname, '..');
const SAMPLE_PATH = path.join(ROOT, 'data', 'reliability', 'reliability-sample.json');
const EVIDENCE_PATH = path.join(ROOT, 'data', 'evidence', 'annotation-evidence.json');
const OVERRIDES_PATH = path.join(ROOT, 'data', 'reliability', 'reliability-second-pass-overrides.json');
const COMPLETED_CODING_PATH = path.join(ROOT, 'data', 'reliability', 'double-coding-completed.csv');
const ADJUDICATION_LOG_PATH = path.join(ROOT, 'data', 'reliability', 'adjudication-log.csv');
const RESULTS_PATH = path.join(ROOT, 'data', 'reliability', 'reliability-results.json');
const RESULTS_PAGE_PATH = path.join(ROOT, 'docs', 'methodology', 'reliability-results.md');

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

const FIELD_METRIC_FIELDS = [
  'mipvu_decision',
  'cluster_id',
  'source_domain',
  'target_domain',
  'fantasy_type',
  'violence_logic',
  'obligatory_frame',
  'absence_flags',
  'confidence_band',
  'ambiguity_flag'
];

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function today() {
  return generatedDateForFile(RESULTS_PATH);
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

function normalize(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

function joinArray(value) {
  if (!Array.isArray(value)) return normalize(value);
  return value.map(normalize).filter(Boolean).join('|');
}

function splitList(value) {
  return normalize(value)
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)
    .sort();
}

function sameList(a, b) {
  const left = splitList(a);
  const right = splitList(b);
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function jaccard(a, b) {
  const left = new Set(splitList(a));
  const right = new Set(splitList(b));
  const union = new Set([...left, ...right]);
  if (union.size === 0) return 1;
  let intersection = 0;
  for (const item of left) {
    if (right.has(item)) intersection++;
  }
  return intersection / union.size;
}

function confidenceBand(value) {
  const score = Number.parseFloat(value);
  if (!Number.isFinite(score)) return '';
  if (score >= 0.9) return 'high';
  if (score >= 0.75) return 'moderate';
  return 'low';
}

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

function clone(row) {
  return { ...row };
}

function lexicalOverlap(a, b) {
  const left = normalize(a).toLowerCase();
  const right = normalize(b).toLowerCase();
  if (!left && !right) return true;
  if (!left || !right) return false;
  if (left.includes(right) || right.includes(left)) return true;
  const leftTokens = new Set(left.split(/[^a-z0-9_]+/).filter(token => token.length > 2));
  const rightTokens = new Set(right.split(/[^a-z0-9_]+/).filter(token => token.length > 2));
  for (const token of leftTokens) {
    if (rightTokens.has(token)) return true;
  }
  return false;
}

function makeEvidenceMap(evidence) {
  return new Map((evidence.records || []).map(record => [record.audit_id, record]));
}

function referenceFromAnchors(unit, evidenceById) {
  const records = (unit.stage4_anchor_audit_ids || [])
    .map(auditId => evidenceById.get(auditId))
    .filter(Boolean);
  if (records.length === 0) {
    return {
      source_audit_id: '',
      candidate_lexical_unit: '',
      mipvu_decision: 'not_metaphor_related',
      cluster_id: '',
      source_domain: '',
      target_domain: '',
      entailments: '',
      fantasy_type: '',
      violence_logic: '',
      obligatory_frame: '',
      absence_flags: '',
      confidence_score: '',
      ambiguity_flag: ''
    };
  }

  return {
    source_audit_id: records.map(record => record.audit_id).join('|'),
    candidate_lexical_unit: records.map(record => record.location.span_text).join(' | '),
    mipvu_decision: 'metaphor_related',
    cluster_id: [...new Set(records.map(record => record.cmt.cluster_id))].join('|'),
    source_domain: records.map(record => record.cmt.source_domain).join(' | '),
    target_domain: records.map(record => record.cmt.target_domain).join(' | '),
    entailments: records.map(record => joinArray(record.cmt.entailments)).join(' | '),
    fantasy_type: [...new Set(records.map(record => record.koenigsberg.fantasy_type))].join('|'),
    violence_logic: records.map(record => record.koenigsberg.violence_logic).join(' | '),
    obligatory_frame: [...new Set(records.map(record => String(record.koenigsberg.obligatory_frame)))].join('|'),
    absence_flags: [...new Set(records.flatMap(record => record.agency_absence.absence_flags || []))].sort().join('|'),
    confidence_score: records.length === 1
      ? String(records[0].confidence.score)
      : String(round(records.reduce((sum, record) => sum + record.confidence.score, 0) / records.length, 2)),
    ambiguity_flag: records.some(record => record.confidence.ambiguity_flag) ? 'true' : 'false'
  };
}

function makeIdentificationRow(unit, coderId, reference, note) {
  return {
    reliability_unit_id: unit.reliability_unit_id,
    unit_type: unit.unit_type,
    coder_id: coderId,
    document_id: unit.document_id,
    sentence_id: unit.sentence_id,
    sentence_text: unit.sentence_text,
    source_audit_id: reference.source_audit_id,
    source_span_text: '',
    candidate_lexical_unit: reference.candidate_lexical_unit,
    span_char_start: '',
    span_char_end: '',
    mipvu_decision: reference.mipvu_decision,
    contextual_meaning: '',
    basic_meaning: '',
    historical_semantics_note: '',
    cluster_id: reference.cluster_id,
    source_domain: reference.source_domain,
    target_domain: reference.target_domain,
    entailments: reference.entailments,
    fantasy_type: reference.fantasy_type,
    violence_logic: reference.violence_logic,
    obligatory_frame: reference.obligatory_frame,
    absence_flags: reference.absence_flags,
    confidence_score: reference.confidence_score,
    ambiguity_flag: reference.ambiguity_flag,
    disagreement_category: 'none',
    coder_notes: note
  };
}

function makeFieldRow(unit, coderId, note) {
  const ref = unit.reference_values;
  return {
    reliability_unit_id: unit.reliability_unit_id,
    unit_type: unit.unit_type,
    coder_id: coderId,
    document_id: unit.document_id,
    sentence_id: unit.sentence_id,
    sentence_text: unit.sentence_text,
    source_audit_id: unit.source_audit_id,
    source_span_text: unit.span_text,
    candidate_lexical_unit: unit.span_text,
    span_char_start: '',
    span_char_end: '',
    mipvu_decision: ref.mipvu_decision,
    contextual_meaning: ref.contextual_meaning,
    basic_meaning: ref.basic_meaning,
    historical_semantics_note: '',
    cluster_id: ref.cluster_id,
    source_domain: ref.source_domain,
    target_domain: ref.target_domain,
    entailments: joinArray(ref.entailments),
    fantasy_type: ref.fantasy_type,
    violence_logic: ref.violence_logic,
    obligatory_frame: String(ref.obligatory_frame),
    absence_flags: joinArray(ref.absence_flags),
    confidence_score: String(ref.confidence_score),
    ambiguity_flag: String(ref.ambiguity_flag),
    disagreement_category: 'none',
    coder_notes: note
  };
}

function applyOverride(row, override) {
  const next = clone(row);
  for (const [key, value] of Object.entries(override || {})) {
    if (!CODING_COLUMNS.includes(key)) continue;
    next[key] = value;
  }
  return next;
}

function makeCompletedRows(sample, evidenceById, overrides) {
  const idOverrides = new Map((overrides.identification_overrides || []).map(item => [item.reliability_unit_id, item]));
  const fieldOverrides = new Map((overrides.field_overrides || []).map(item => [item.reliability_unit_id, item]));
  const rows = [];

  for (const unit of sample.identification_units) {
    const reference = referenceFromAnchors(unit, evidenceById);
    const coderA = makeIdentificationRow(
      unit,
      'coder_a_stage4a_reference',
      reference,
      'Reference value generated from Stage 4A evidence anchors.'
    );
    const coderBBase = makeIdentificationRow(
      unit,
      'coder_b_codex_second_pass',
      reference,
      'Second pass confirms the Stage 4A reference decision.'
    );
    const override = idOverrides.get(unit.reliability_unit_id);
    const coderB = override ? applyOverride(coderBBase, override.coder_b) : coderBBase;
    rows.push(coderA, coderB);
  }

  for (const unit of sample.field_agreement_units) {
    const coderA = makeFieldRow(unit, 'coder_a_stage4a_reference', 'Reference value generated from Stage 4A evidence anchors.');
    const coderBBase = makeFieldRow(unit, 'coder_b_codex_second_pass', 'Second pass confirms the Stage 4A reference decision.');
    const override = fieldOverrides.get(unit.reliability_unit_id);
    const coderB = override ? applyOverride(coderBBase, override.coder_b) : coderBBase;
    rows.push(coderA, coderB);
  }

  return rows;
}

function groupRows(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.reliability_unit_id)) grouped.set(row.reliability_unit_id, []);
    grouped.get(row.reliability_unit_id).push(row);
  }
  return grouped;
}

function getCoderPair(rows) {
  const coderA = rows.find(row => row.coder_id === 'coder_a_stage4a_reference');
  const coderB = rows.find(row => row.coder_id === 'coder_b_codex_second_pass');
  if (!coderA || !coderB) throw new Error(`Missing coder pair for ${rows[0] && rows[0].reliability_unit_id}`);
  return { coderA, coderB };
}

function computeIdentificationMetrics(groupedRows) {
  let total = 0;
  let agreement = 0;
  let bothPresent = 0;
  let boundaryExact = 0;
  let boundaryOverlap = 0;
  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (const rows of groupedRows.values()) {
    if (rows[0].unit_type !== 'sentence_identification') continue;
    const { coderA, coderB } = getCoderPair(rows);
    const aPresent = coderA.mipvu_decision === 'metaphor_related';
    const bPresent = coderB.mipvu_decision === 'metaphor_related';
    total++;
    if (aPresent === bPresent) agreement++;
    if (aPresent && bPresent) {
      truePositive++;
      bothPresent++;
      if (normalize(coderA.candidate_lexical_unit) === normalize(coderB.candidate_lexical_unit)) boundaryExact++;
      if (lexicalOverlap(coderA.candidate_lexical_unit, coderB.candidate_lexical_unit)) boundaryOverlap++;
    } else if (!aPresent && !bPresent) {
      trueNegative++;
    } else if (!aPresent && bPresent) {
      falsePositive++;
    } else {
      falseNegative++;
    }
  }

  const coderAPresent = truePositive + falseNegative;
  const coderAAbsent = trueNegative + falsePositive;
  const coderBPresent = truePositive + falsePositive;
  const coderBAbsent = trueNegative + falseNegative;
  const expectedAgreement = total
    ? ((coderAPresent * coderBPresent) + (coderAAbsent * coderBAbsent)) / (total * total)
    : 0;
  const observedAgreement = total ? agreement / total : 0;
  const kappa = expectedAgreement === 1 ? 1 : (observedAgreement - expectedAgreement) / (1 - expectedAgreement);

  return {
    total_units: total,
    agreement_units: agreement,
    agreement_rate: percent(agreement, total),
    cohen_kappa_present_absent: round(kappa),
    confusion_against_stage4a_reference: {
      true_positive: truePositive,
      true_negative: trueNegative,
      false_positive: falsePositive,
      false_negative: falseNegative
    },
    precision_against_stage4a_reference: percent(truePositive, truePositive + falsePositive),
    recall_against_stage4a_reference: percent(truePositive, truePositive + falseNegative),
    f1_against_stage4a_reference: percent(2 * truePositive, (2 * truePositive) + falsePositive + falseNegative),
    boundary_exact_rate_when_both_present: percent(boundaryExact, bothPresent),
    boundary_overlap_rate_when_both_present: percent(boundaryOverlap, bothPresent)
  };
}

function valuesAgree(field, coderA, coderB) {
  if (field === 'confidence_band') {
    return confidenceBand(coderA.confidence_score) === confidenceBand(coderB.confidence_score);
  }
  if (field === 'absence_flags') return sameList(coderA.absence_flags, coderB.absence_flags);
  return normalize(coderA[field]) === normalize(coderB[field]);
}

function computeFieldMetrics(groupedRows) {
  const metrics = {};
  for (const field of FIELD_METRIC_FIELDS) {
    metrics[field] = { total_units: 0, agreement_units: 0, agreement_rate: 0 };
  }

  let confidenceCompared = 0;
  let confidenceDiffSum = 0;
  let absenceJaccardSum = 0;
  let absenceCompared = 0;

  for (const rows of groupedRows.values()) {
    if (rows[0].unit_type !== 'field_agreement') continue;
    const { coderA, coderB } = getCoderPair(rows);
    for (const field of FIELD_METRIC_FIELDS) {
      metrics[field].total_units++;
      if (valuesAgree(field, coderA, coderB)) metrics[field].agreement_units++;
    }

    const aConfidence = Number.parseFloat(coderA.confidence_score);
    const bConfidence = Number.parseFloat(coderB.confidence_score);
    if (Number.isFinite(aConfidence) && Number.isFinite(bConfidence)) {
      confidenceCompared++;
      confidenceDiffSum += Math.abs(aConfidence - bConfidence);
    }
    absenceCompared++;
    absenceJaccardSum += jaccard(coderA.absence_flags, coderB.absence_flags);
  }

  for (const metric of Object.values(metrics)) {
    metric.agreement_rate = percent(metric.agreement_units, metric.total_units);
  }

  metrics.confidence_score_mean_absolute_difference = confidenceCompared
    ? round(confidenceDiffSum / confidenceCompared, 4)
    : 0;
  metrics.absence_flags_mean_jaccard = absenceCompared
    ? round(absenceJaccardSum / absenceCompared, 4)
    : 0;

  return metrics;
}

function makeAdjudicationRows(rows, overrides) {
  const grouped = groupRows(rows);
  const allOverrides = [
    ...(overrides.identification_overrides || []),
    ...(overrides.field_overrides || [])
  ];

  return allOverrides.map((override, index) => {
    const pair = getCoderPair(grouped.get(override.reliability_unit_id));
    const adjudication = override.adjudication || {};
    const fieldName = adjudication.field_name || 'mipvu_decision';
    return {
      adjudication_id: `adj_${String(index + 1).padStart(3, '0')}`,
      reliability_unit_id: override.reliability_unit_id,
      source_audit_id: pair.coderA.source_audit_id || pair.coderB.source_audit_id,
      document_id: pair.coderA.document_id,
      sentence_id: pair.coderA.sentence_id,
      field_name: fieldName,
      coder_a_value: pair.coderA[fieldName] || '',
      coder_b_value: pair.coderB[fieldName] || '',
      disagreement_category: adjudication.disagreement_category || pair.coderB.disagreement_category || 'none',
      adjudicated_value: adjudication.adjudicated_value || '',
      rationale: adjudication.rationale || '',
      adjudicator: 'codex_reliability_adjudication',
      adjudicated_date: today(),
      follow_up_required: adjudication.follow_up_required || 'false',
      follow_up_issue: adjudication.follow_up_issue || ''
    };
  });
}

function summarizeAdjudication(rows) {
  const byCategory = {};
  let followUpRequired = 0;
  for (const row of rows) {
    byCategory[row.disagreement_category] = (byCategory[row.disagreement_category] || 0) + 1;
    if (row.follow_up_required === 'true') followUpRequired++;
  }
  return {
    total_disagreements_adjudicated: rows.length,
    by_category: byCategory,
    follow_up_required: followUpRequired
  };
}

function makeResults(sample, overrides, completedRows, adjudicationRows) {
  const grouped = groupRows(completedRows);
  const identification = computeIdentificationMetrics(grouped);
  const fields = computeFieldMetrics(grouped);
  return {
    version: '1.0',
    generated: today(),
    status: 'complete',
    source_sample: 'data/reliability/reliability-sample.json',
    source_second_pass: 'data/reliability/reliability-second-pass-overrides.json',
    completed_coding: 'data/reliability/double-coding-completed.csv',
    adjudication_log: 'data/reliability/adjudication-log.csv',
    coder_roles: overrides.coder_roles,
    method_note: overrides.method_note,
    limitations: overrides.limitations,
    sample_summary: {
      documents: sample.documents.length,
      identification_units: sample.identification_units.length,
      field_agreement_units: sample.field_agreement_units.length,
      sample_percentage: sample.sample_policy.sample_percentage
    },
    identification_metrics: identification,
    field_agreement_metrics: fields,
    adjudication_summary: summarizeAdjudication(adjudicationRows)
  };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`)
  ].join('\n');
}

function writeResultsPage(results) {
  const identification = results.identification_metrics;
  const fields = results.field_agreement_metrics;
  const fieldRows = FIELD_METRIC_FIELDS.map(field => [
    field,
    String(fields[field].agreement_units),
    String(fields[field].total_units),
    `${fields[field].agreement_rate}%`
  ]);
  fieldRows.push([
    'absence_flags_mean_jaccard',
    String(fields.absence_flags_mean_jaccard),
    '1.0000 max',
    ''
  ]);
  fieldRows.push([
    'confidence_score_mean_absolute_difference',
    String(fields.confidence_score_mean_absolute_difference),
    '0.0000 min',
    ''
  ]);

  const adjudicationRows = Object.entries(results.adjudication_summary.by_category)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, count]) => [category, String(count)]);

  const content = `---
title: "Reliability Results"
draft: false
---

These are Stage 4B reliability results for the five-document sample defined in [Reliability Sample and Adjudication Workflow](reliability-report.md).

The future two-human study design is defined in [Human Double-Coding Follow-Up Protocol](human-double-coding-protocol.md). No human-human reliability metrics are reported here.

## Coding Design

Coder A is the Stage 4A reference annotation layer. Coder B is a Codex second-pass reliability review. This is a completed AI-assisted reliability pass, not a two-human blind inter-annotator study.

The completed coding sheet is \`${results.completed_coding}\`. The adjudication log is \`${results.adjudication_log}\`.

## Sample

${markdownTable(
    ['Measure', 'Value'],
    [
      ['Documents', String(results.sample_summary.documents)],
      ['Sample percentage', `${results.sample_summary.sample_percentage}%`],
      ['Sentence-identification units', String(results.sample_summary.identification_units)],
      ['Field-agreement units', String(results.sample_summary.field_agreement_units)]
    ]
  )}

## Identification Reliability

${markdownTable(
    ['Measure', 'Value'],
    [
      ['Agreement', `${identification.agreement_units} / ${identification.total_units} (${identification.agreement_rate}%)`],
      ['Cohen kappa, present/absent', String(identification.cohen_kappa_present_absent)],
      ['True positive', String(identification.confusion_against_stage4a_reference.true_positive)],
      ['True negative', String(identification.confusion_against_stage4a_reference.true_negative)],
      ['False positive', String(identification.confusion_against_stage4a_reference.false_positive)],
      ['False negative', String(identification.confusion_against_stage4a_reference.false_negative)],
      ['Precision against Stage 4A reference', `${identification.precision_against_stage4a_reference}%`],
      ['Recall against Stage 4A reference', `${identification.recall_against_stage4a_reference}%`],
      ['F1 against Stage 4A reference', `${identification.f1_against_stage4a_reference}%`],
      ['Boundary exact rate when both present', `${identification.boundary_exact_rate_when_both_present}%`],
      ['Boundary overlap rate when both present', `${identification.boundary_overlap_rate_when_both_present}%`]
    ]
  )}

## Field Agreement

${markdownTable(['Field', 'Agreements', 'Units', 'Rate'], fieldRows)}

## Adjudication

${markdownTable(['Category', 'Count'], adjudicationRows)}

Total adjudicated disagreements: ${results.adjudication_summary.total_disagreements_adjudicated}.

## Limits

${results.limitations.map(item => `- ${item}`).join('\n')}
`;

  fs.writeFileSync(RESULTS_PAGE_PATH, content);
}

function main() {
  const sample = readJSON(SAMPLE_PATH);
  const evidence = readJSON(EVIDENCE_PATH);
  const overrides = readJSON(OVERRIDES_PATH);
  const evidenceById = makeEvidenceMap(evidence);

  const completedRows = makeCompletedRows(sample, evidenceById, overrides);
  const adjudicationRows = makeAdjudicationRows(completedRows, overrides);
  const results = makeResults(sample, overrides, completedRows, adjudicationRows);

  writeCSV(COMPLETED_CODING_PATH, completedRows, CODING_COLUMNS);
  writeCSV(ADJUDICATION_LOG_PATH, adjudicationRows, ADJUDICATION_COLUMNS);
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2) + '\n');
  writeResultsPage(results);

  console.log(`Completed reliability coding written to ${path.relative(ROOT, COMPLETED_CODING_PATH)}`);
  console.log(`Adjudication log written to ${path.relative(ROOT, ADJUDICATION_LOG_PATH)}`);
  console.log(`Reliability results written to ${path.relative(ROOT, RESULTS_PATH)}`);
  console.log(`Reliability results page written to ${path.relative(ROOT, RESULTS_PAGE_PATH)}`);
}

main();
