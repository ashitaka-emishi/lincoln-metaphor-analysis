#!/usr/bin/env node
// Computes layered Stage 4M model-vs-reference and model-vs-model agreement.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.env.STAGE4M_ROOT
  ? path.resolve(process.env.STAGE4M_ROOT)
  : path.resolve(__dirname, '..', '..');
const NORMALIZED_PATH = path.join(ROOT, 'data', 'reliability', 'model-comparison', 'normalized-model-runs.json');
const SAMPLE_PATH = path.join(ROOT, 'data', 'reliability', 'reliability-sample.json');
const COMPLETED_PATH = path.join(ROOT, 'data', 'reliability', 'double-coding-completed.csv');
const ADJUDICATION_PATH = path.join(ROOT, 'data', 'reliability', 'adjudication-log.csv');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reliability', 'model-comparison');
const OUTPUT_PATHS = Object.freeze({
  results: path.join(OUTPUT_DIR, 'model-agreement-results.json'),
  summary: path.join(OUTPUT_DIR, 'model-agreement-summary.csv'),
  markdown: path.join(OUTPUT_DIR, 'model-agreement-results.md')
});

const FIELD_SPECS = Object.freeze({
  metaphor_present: { layer: 'metaphor_identification', task: 'all' },
  lexical_unit_boundary: { layer: 'lexical_unit_boundary', task: 'all' },
  source_domain: { layer: 'cmt_mapping', task: 'field_agreement', requires_metaphor: true },
  target_domain: { layer: 'cmt_mapping', task: 'field_agreement', requires_metaphor: true },
  cluster_id: { layer: 'cmt_mapping', task: 'field_agreement', requires_metaphor: true },
  koenigsberg_function: { layer: 'koenigsberg_interpretation', task: 'field_agreement', requires_metaphor: true },
  violence_logic: { layer: 'koenigsberg_interpretation', task: 'field_agreement', requires_metaphor: true },
  obligatory_frame: { layer: 'koenigsberg_interpretation', task: 'field_agreement', requires_metaphor: true },
  agency_or_absence_flag: { layer: 'agency_absence', task: 'field_agreement' },
  confidence: { layer: 'confidence_ambiguity', task: 'field_agreement' },
  ambiguity_flag: { layer: 'confidence_ambiguity', task: 'field_agreement' },
  rival_reading_presence: { layer: 'confidence_ambiguity', task: 'field_agreement' }
});

const SUMMARY_COLUMNS = Object.freeze([
  'scope', 'comparison_id', 'layer', 'field', 'agreements', 'comparisons',
  'agreement_rate_pct', 'notes'
]);

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }
  if (quoted) throw new Error('Unterminated quoted CSV field.');
  if (field || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  const nonempty = rows.filter(values => values.some(value => value !== ''));
  if (nonempty.length === 0) return [];
  const headers = nonempty[0];
  return nonempty.slice(1).map((values, index) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function makeCSV(rows) {
  return [
    SUMMARY_COLUMNS.join(','),
    ...rows.map(row => SUMMARY_COLUMNS.map(column => csvEscape(row[column])).join(','))
  ].join('\n') + '\n';
}

function normalize(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim().replace(/\s+/g, ' ').toLowerCase();
  return text === '' ? null : text;
}

function splitList(value) {
  if (Array.isArray(value)) return value.map(normalize).filter(Boolean).sort();
  if (value === undefined || value === null || value === '') return [];
  return String(value).split('|').map(normalize).filter(Boolean).sort();
}

function confidenceBand(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  if (score >= 0.9) return 'high';
  if (score >= 0.75) return 'medium';
  return 'low';
}

function yesNo(value) {
  const normalized = normalize(value);
  if (['true', 'yes', '1'].includes(normalized)) return true;
  if (['false', 'no', '0'].includes(normalized)) return false;
  return null;
}

function metaphorLabel(value) {
  const normalized = normalize(value);
  if (['metaphor_related', 'yes'].includes(normalized)) return 'yes';
  if (['not_metaphor_related', 'not_metaphor_related_for_current_stage4_scope', 'no'].includes(normalized)) return 'no';
  return 'uncertain';
}

function metric(agreements, comparisons) {
  return {
    agreements,
    comparisons,
    agreement_rate_pct: comparisons === 0 ? null : Number(((agreements / comparisons) * 100).toFixed(2))
  };
}

function valuesEqual(field, left, right) {
  if (field === 'agency_or_absence_flag') {
    const leftValues = Array.isArray(left) ? left : left === null ? [] : [left];
    const rightValues = Array.isArray(right) ? right : right === null ? [] : [right];
    if (leftValues.length === 0 && rightValues.length === 0) return true;
    if (leftValues.length === 1 && rightValues.length > 1) return rightValues.includes(leftValues[0]);
    if (rightValues.length === 1 && leftValues.length > 1) return leftValues.includes(rightValues[0]);
    return JSON.stringify([...leftValues].sort()) === JSON.stringify([...rightValues].sort());
  }
  return normalize(left) === normalize(right);
}

function lexicalOverlap(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const aTokens = new Set(a.split(/[^a-z0-9]+/).filter(token => token.length > 2));
  const bTokens = new Set(b.split(/[^a-z0-9]+/).filter(token => token.length > 2));
  const intersection = [...aTokens].filter(token => bTokens.has(token)).length;
  return intersection > 0 && intersection / Math.min(aTokens.size, bTokens.size) >= 0.5;
}

function boundaryClassification(leftSpans, rightSpans) {
  const left = [...new Set(leftSpans.map(normalize).filter(Boolean))].sort();
  const right = [...new Set(rightSpans.map(normalize).filter(Boolean))].sort();
  if (left.length === 0 || right.length === 0) return 'missing_boundary';
  if (JSON.stringify(left) === JSON.stringify(right)) return 'exact_match';
  if (left.some(a => right.some(b => lexicalOverlap(a, b)))) return 'partial_overlap';
  return 'no_overlap';
}

function compareUnitOrder(left, right) {
  return left.document_id.localeCompare(right.document_id)
    || left.sentence_id.localeCompare(right.sentence_id)
    || String(left.span_text || '').localeCompare(String(right.span_text || ''));
}

function referenceFromRow(packetUnitId, unit, row, adjudications) {
  if (!row) throw new Error(`Stage 4A reference row missing for ${unit.reliability_unit_id}.`);
  return {
    packet_unit_id: packetUnitId,
    reliability_unit_id: unit.reliability_unit_id,
    task_type: unit.unit_type,
    doc_id: unit.document_id,
    sentence_id: unit.sentence_id,
    control_type: unit.control_type || null,
    metaphor_present: metaphorLabel(row.mipvu_decision),
    lexical_units: splitList(row.candidate_lexical_unit),
    source_domain: normalize(row.source_domain),
    target_domain: normalize(row.target_domain),
    cluster_id: normalize(row.cluster_id),
    koenigsberg_function: normalize(row.fantasy_type),
    violence_logic: normalize(row.violence_logic),
    obligatory_frame: yesNo(row.obligatory_frame),
    agency_or_absence_flag: splitList(row.absence_flags),
    confidence: confidenceBand(row.confidence_score),
    ambiguity_flag: yesNo(row.ambiguity_flag) === true ? 'yes' : 'no',
    rival_reading_presence: false,
    adjudications: adjudications.map(item => ({
      adjudication_id: item.adjudication_id,
      field_name: item.field_name,
      adjudicated_value: item.adjudicated_value,
      disagreement_category: item.disagreement_category
    }))
  };
}

function buildReferences(sample, codingRows, adjudicationRows) {
  const referenceRows = new Map(codingRows
    .filter(row => row.coder_id === 'coder_a_stage4a_reference')
    .map(row => [row.reliability_unit_id, row]));
  const adjudications = new Map();
  for (const row of adjudicationRows) {
    if (!adjudications.has(row.reliability_unit_id)) adjudications.set(row.reliability_unit_id, []);
    adjudications.get(row.reliability_unit_id).push(row);
  }

  const identification = [...sample.identification_units].sort(compareUnitOrder);
  const fieldAgreement = [...sample.field_agreement_units].sort(compareUnitOrder);
  const references = new Map();
  [...identification, ...fieldAgreement].forEach((unit, index) => {
    const packetUnitId = `stage4m_unit_${String(index + 1).padStart(5, '0')}`;
    references.set(packetUnitId, referenceFromRow(
      packetUnitId,
      unit,
      referenceRows.get(unit.reliability_unit_id),
      adjudications.get(unit.reliability_unit_id) || []
    ));
  });
  return references;
}

function groupRunItems(run) {
  const grouped = new Map();
  for (const item of run.items || []) {
    if (!grouped.has(item.packet_unit_id)) grouped.set(item.packet_unit_id, []);
    grouped.get(item.packet_unit_id).push(item);
  }
  return grouped;
}

function aggregateItems(items) {
  if (!items || items.length === 0) return null;
  const metaphorPresent = items.some(item => item.metaphor_present === 'yes')
    ? 'yes'
    : items.some(item => item.metaphor_present === 'uncertain') ? 'uncertain' : 'no';
  const primary = items[0];
  return {
    metaphor_present: metaphorPresent,
    lexical_units: items.map(item => item.lexical_unit).filter(Boolean),
    source_domain: normalize(primary.source_domain),
    target_domain: normalize(primary.target_domain),
    cluster_id: normalize(primary.cluster_id),
    koenigsberg_function: normalize(primary.koenigsberg_function),
    violence_logic: normalize(primary.violence_logic),
    obligatory_frame: primary.obligatory_frame !== null,
    agency_or_absence_flag: primary.agency_or_absence_flag ? [normalize(primary.agency_or_absence_flag)] : [],
    confidence: normalize(primary.confidence),
    ambiguity_flag: normalize(primary.ambiguity_flag),
    rival_reading_presence: primary.rival_reading !== null
  };
}

function fieldValue(record, field) {
  if (field === 'lexical_unit_boundary') return record.lexical_units;
  return record[field];
}

function compareFields(left, right, task, counters) {
  for (const [field, spec] of Object.entries(FIELD_SPECS)) {
    if ((spec.task !== 'all' && spec.task !== task) || field === 'lexical_unit_boundary') continue;
    if (spec.requires_metaphor && left.metaphor_present !== 'yes' && right.metaphor_present !== 'yes') continue;
    counters[field].comparisons += 1;
    if (valuesEqual(field, fieldValue(left, field), fieldValue(right, field))) counters[field].agreements += 1;
  }
  if (left.metaphor_present === 'yes' || right.metaphor_present === 'yes') {
    const classification = boundaryClassification(left.lexical_units, right.lexical_units);
    counters.lexical_unit_boundary.comparisons += 1;
    counters.lexical_unit_boundary[classification] += 1;
    if (classification === 'exact_match') counters.lexical_unit_boundary.agreements += 1;
  }
}

function emptyCounters() {
  return Object.fromEntries(Object.keys(FIELD_SPECS).map(field => [field, {
    agreements: 0,
    comparisons: 0,
    ...(field === 'lexical_unit_boundary' ? {
      exact_match: 0,
      partial_overlap: 0,
      no_overlap: 0,
      missing_boundary: 0
    } : {})
  }]));
}

function finalizeCounters(counters) {
  return Object.fromEntries(Object.entries(counters).map(([field, value]) => [field, {
    ...metric(value.agreements, value.comparisons),
    ...(field === 'lexical_unit_boundary' ? {
      exact_match: value.exact_match,
      partial_overlap: value.partial_overlap,
      no_overlap: value.no_overlap,
      missing_boundary: value.missing_boundary
    } : {})
  }]));
}

function binaryDetection(records, predicate) {
  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  for (const { reference, model } of records) {
    const expected = predicate(reference);
    const actual = predicate(model);
    if (expected && actual) truePositive += 1;
    else if (!expected && !actual) trueNegative += 1;
    else if (!expected && actual) falsePositive += 1;
    else falseNegative += 1;
  }
  return {
    true_positive: truePositive,
    true_negative: trueNegative,
    false_positive: falsePositive,
    false_negative: falseNegative,
    ...metric(truePositive + trueNegative, records.length)
  };
}

function compareRunToReference(run, references) {
  const grouped = groupRunItems(run);
  const counters = emptyCounters();
  const identification = {
    true_positive: 0,
    true_negative: 0,
    false_positive: 0,
    false_negative: 0,
    uncertain: 0
  };
  const negativeControls = { total: 0, correct_absent: 0, false_positive: 0, uncertain: 0 };
  const fieldRecords = [];
  let covered = 0;

  for (const reference of references.values()) {
    const model = aggregateItems(grouped.get(reference.packet_unit_id));
    if (!model) continue;
    covered += 1;
    compareFields(reference, model, reference.task_type, counters);
    if (reference.task_type === 'sentence_identification') {
      if (model.metaphor_present === 'uncertain') identification.uncertain += 1;
      else if (reference.metaphor_present === 'yes' && model.metaphor_present === 'yes') identification.true_positive += 1;
      else if (reference.metaphor_present === 'no' && model.metaphor_present === 'no') identification.true_negative += 1;
      else if (reference.metaphor_present === 'no' && model.metaphor_present === 'yes') identification.false_positive += 1;
      else if (reference.metaphor_present === 'yes' && model.metaphor_present === 'no') identification.false_negative += 1;
      if (reference.control_type === 'negative_control') {
        negativeControls.total += 1;
        if (model.metaphor_present === 'no') negativeControls.correct_absent += 1;
        else if (model.metaphor_present === 'yes') negativeControls.false_positive += 1;
        else negativeControls.uncertain += 1;
      }
    } else fieldRecords.push({ reference, model });
  }

  const comparedIdentification = identification.true_positive + identification.true_negative
    + identification.false_positive + identification.false_negative + identification.uncertain;
  return {
    comparison_id: `${run.run_id}__vs__stage4a_reference`,
    run_id: run.run_id,
    coverage: {
      covered_packet_units: covered,
      total_packet_units: references.size,
      coverage_rate_pct: Number(((covered / references.size) * 100).toFixed(2))
    },
    fields: finalizeCounters(counters),
    metaphor_identification: {
      ...identification,
      comparisons: comparedIdentification,
      agreement_rate_pct: comparedIdentification === 0
        ? null
        : Number((((identification.true_positive + identification.true_negative) / comparedIdentification) * 100).toFixed(2)),
      negative_control_performance: {
        ...negativeControls,
        accuracy_pct: negativeControls.total === 0
          ? null
          : Number(((negativeControls.correct_absent / negativeControls.total) * 100).toFixed(2))
      }
    },
    focal_categories: {
      sacrifice_and_redemption: binaryDetection(fieldRecords, record => record.koenigsberg_function === 'sacrifice_and_redemption'),
      guilt_or_theodicy: binaryDetection(fieldRecords, record => record.koenigsberg_function === 'punishment_and_theodicy'),
      reconciliation_or_restoration: binaryDetection(fieldRecords, record => record.violence_logic === 'restorative'),
      disease_or_purification: binaryDetection(fieldRecords, record => record.koenigsberg_function === 'disease_and_purification' || record.violence_logic === 'purifying'),
      enslaved_people_non_agent: binaryDetection(fieldRecords, record => record.agency_or_absence_flag.includes('enslaved_people_non_agent')),
      black_soldiers_erased: binaryDetection(fieldRecords, record => record.agency_or_absence_flag.includes('black_soldiers_erased'))
    },
    adjudication_context_units: [...references.values()].filter(reference => reference.adjudications.length > 0).length
  };
}

function compareModelPair(leftRun, rightRun, references) {
  const leftItems = groupRunItems(leftRun);
  const rightItems = groupRunItems(rightRun);
  const counters = emptyCounters();
  let shared = 0;
  for (const reference of references.values()) {
    const left = aggregateItems(leftItems.get(reference.packet_unit_id));
    const right = aggregateItems(rightItems.get(reference.packet_unit_id));
    if (!left || !right) continue;
    shared += 1;
    compareFields(left, right, reference.task_type, counters);
  }
  return {
    comparison_id: `${leftRun.run_id}__vs__${rightRun.run_id}`,
    left_run_id: leftRun.run_id,
    right_run_id: rightRun.run_id,
    shared_packet_units: shared,
    fields: finalizeCounters(counters)
  };
}

function patternValue(record, field) {
  const value = fieldValue(record, field);
  if (Array.isArray(value)) return JSON.stringify([...value].sort());
  return JSON.stringify(value === undefined ? null : value);
}

function classifyPattern(values) {
  if (values.length < 2) return 'insufficient_coverage';
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  const ordered = [...counts.values()].sort((a, b) => b - a);
  if (ordered[0] === values.length) return 'unanimity';
  if (values.length >= 3 && ordered[0] === values.length - 1 && ordered[1] === 1) return 'outlier';
  if (ordered[0] > values.length / 2) return 'majority';
  return 'split';
}

function agreementPatterns(runs, references) {
  const groupedRuns = runs.map(run => ({ run, items: groupRunItems(run) }));
  const byField = Object.fromEntries(Object.keys(FIELD_SPECS).map(field => [field, {
    unanimity: 0, majority: 0, split: 0, outlier: 0, insufficient_coverage: 0,
    unanimous_with_reference: 0, unanimous_against_reference: 0,
    majority_with_reference: 0, majority_against_reference: 0
  }]));

  for (const reference of references.values()) {
    for (const [field, spec] of Object.entries(FIELD_SPECS)) {
      if (spec.task !== 'all' && spec.task !== reference.task_type) continue;
      const modelRecords = groupedRuns
        .map(({ items }) => aggregateItems(items.get(reference.packet_unit_id)))
        .filter(Boolean);
      if (field === 'lexical_unit_boundary'
        && reference.metaphor_present !== 'yes'
        && !modelRecords.some(record => record.metaphor_present === 'yes')) continue;
      const values = modelRecords.map(record => patternValue(record, field));
      const classification = classifyPattern(values);
      byField[field][classification] += 1;
      if (['unanimity', 'majority'].includes(classification)) {
        const counts = new Map();
        for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
        const winningValue = [...counts].sort((a, b) => b[1] - a[1])[0][0];
        const matchesReference = winningValue === patternValue(reference, field);
        byField[field][`${classification === 'unanimity' ? 'unanimous' : 'majority'}_${matchesReference ? 'with' : 'against'}_reference`] += 1;
      }
    }
  }

  const totals = {
    unanimity: 0,
    majority: 0,
    split: 0,
    outlier: 0,
    insufficient_coverage: 0
  };
  for (const field of Object.values(byField)) {
    for (const key of Object.keys(totals)) totals[key] += field[key];
  }
  return { totals, by_field: byField };
}

function stability(modelVsReference, modelVsModel) {
  const minimumComparisons = 10;
  const categories = {};
  for (const [field, spec] of Object.entries(FIELD_SPECS)) {
    let agreements = 0;
    let comparisons = 0;
    for (const comparison of [...modelVsReference, ...modelVsModel]) {
      agreements += comparison.fields[field].agreements;
      comparisons += comparison.fields[field].comparisons;
    }
    const combined = metric(agreements, comparisons);
    categories[field] = {
      layer: spec.layer,
      ...combined,
      classification: comparisons < minimumComparisons ? 'insufficient_evidence' : combined.agreement_rate_pct >= 80 ? 'stable' : 'unstable'
    };
  }
  return {
    policy: `Stable requires at least ${minimumComparisons} pooled model-reference/model-model comparisons and >=80% exact agreement; lower observed agreement is unstable; smaller denominators are insufficient evidence.`,
    stable_categories: Object.entries(categories).filter(([, value]) => value.classification === 'stable').map(([field]) => field),
    unstable_categories: Object.entries(categories).filter(([, value]) => value.classification === 'unstable').map(([field]) => field),
    insufficient_evidence_categories: Object.entries(categories).filter(([, value]) => value.classification === 'insufficient_evidence').map(([field]) => field),
    categories
  };
}

function summaryRows(modelVsReference, modelVsModel) {
  const rows = [];
  for (const [scope, comparisons] of [['model_vs_reference', modelVsReference], ['model_vs_model', modelVsModel]]) {
    for (const comparison of comparisons) {
      for (const [field, values] of Object.entries(comparison.fields)) {
        rows.push({
          scope,
          comparison_id: comparison.comparison_id,
          layer: FIELD_SPECS[field].layer,
          field,
          agreements: values.agreements,
          comparisons: values.comparisons,
          agreement_rate_pct: values.agreement_rate_pct,
          notes: field === 'lexical_unit_boundary'
            ? `exact=${values.exact_match}; partial=${values.partial_overlap}; none=${values.no_overlap}; missing=${values.missing_boundary}`
            : ''
        });
      }
    }
  }
  return rows;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`)
  ].join('\n');
}

function renderMarkdown(results) {
  const lines = [
    '# Stage 4M Model Agreement Results',
    '',
    `Status: **${results.status.replaceAll('_', ' ')}**`,
    '',
    'These metrics are a diagnostic AI-assisted reliability stress test. They do not revise Stage 4A and are not human inter-annotator reliability.',
    ''
  ];
  if (results.status === 'no_submissions') {
    lines.push('No validated model runs are available. Agreement metrics will be generated after model submissions are ingested.');
    return lines.join('\n').trimEnd() + '\n';
  }

  lines.push('## Coverage', '');
  lines.push(markdownTable(
    ['Run', 'Covered units', 'Total units', 'Coverage'],
    results.model_vs_reference.map(item => [
      item.run_id,
      String(item.coverage.covered_packet_units),
      String(item.coverage.total_packet_units),
      `${item.coverage.coverage_rate_pct}%`
    ])
  ), '', '## Model vs Stage 4A', '');
  const referenceRows = [];
  for (const comparison of results.model_vs_reference) {
    for (const [field, values] of Object.entries(comparison.fields)) {
      referenceRows.push([comparison.run_id, FIELD_SPECS[field].layer, field, `${values.agreements}/${values.comparisons}`, values.agreement_rate_pct === null ? 'n/a' : `${values.agreement_rate_pct}%`]);
    }
  }
  lines.push(markdownTable(['Run', 'Layer', 'Field', 'Agreement', 'Rate'], referenceRows), '', '## Model vs Model', '');
  const pairRows = [];
  for (const comparison of results.model_vs_model) {
    for (const [field, values] of Object.entries(comparison.fields)) {
      pairRows.push([comparison.comparison_id, FIELD_SPECS[field].layer, field, `${values.agreements}/${values.comparisons}`, values.agreement_rate_pct === null ? 'n/a' : `${values.agreement_rate_pct}%`]);
    }
  }
  lines.push(pairRows.length > 0
    ? markdownTable(['Pair', 'Layer', 'Field', 'Agreement', 'Rate'], pairRows)
    : 'At least two validated model runs are required for model-vs-model metrics.');
  lines.push('', '## Identification Diagnostics', '', markdownTable(
    ['Run', 'TP', 'TN', 'FP', 'FN', 'Uncertain', 'Negative-control accuracy'],
    results.model_vs_reference.map(item => [
      item.run_id,
      String(item.metaphor_identification.true_positive),
      String(item.metaphor_identification.true_negative),
      String(item.metaphor_identification.false_positive),
      String(item.metaphor_identification.false_negative),
      String(item.metaphor_identification.uncertain),
      item.metaphor_identification.negative_control_performance.accuracy_pct === null
        ? 'n/a'
        : `${item.metaphor_identification.negative_control_performance.accuracy_pct}%`
    ])
  ), '', '## Focal Interpretive Categories', '');
  const focalRows = [];
  for (const comparison of results.model_vs_reference) {
    for (const [category, values] of Object.entries(comparison.focal_categories)) {
      focalRows.push([
        comparison.run_id,
        category,
        `${values.agreements}/${values.comparisons}`,
        values.agreement_rate_pct === null ? 'n/a' : `${values.agreement_rate_pct}%`,
        String(values.false_positive),
        String(values.false_negative)
      ]);
    }
  }
  lines.push(markdownTable(['Run', 'Category', 'Agreement', 'Rate', 'FP', 'FN'], focalRows),
    '', '## Stability', '', `Policy: ${results.stability.policy}`, '',
    `Stable categories: ${results.stability.stable_categories.join(', ') || 'none'}.`, '',
    `Unstable categories: ${results.stability.unstable_categories.join(', ') || 'none'}.`, '',
    '## Agreement Patterns', '',
    markdownTable(['Pattern', 'Count'], Object.entries(results.agreement_patterns.totals).map(([key, value]) => [key, String(value)])), '',
    '## Reference Policy', '', results.reference_policy);
  return lines.join('\n').trimEnd() + '\n';
}

function writeAtomic(filePath, contents) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(OUTPUT_DIR) + path.sep)) throw new Error(`Refusing write outside Stage 4M comparison directory: ${filePath}`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, contents);
  fs.renameSync(temporaryPath, filePath);
}

function compare({ write }) {
  const normalized = readJSON(NORMALIZED_PATH);
  if (normalized.status === 'validation_failed') {
    throw new Error('Normalized model runs report upstream validation failures; fix submissions and rerun ingestion before comparison.');
  }
  const sample = readJSON(SAMPLE_PATH);
  const codingRows = parseCSV(fs.readFileSync(COMPLETED_PATH, 'utf8'));
  const adjudicationRows = parseCSV(fs.readFileSync(ADJUDICATION_PATH, 'utf8'));
  const references = buildReferences(sample, codingRows, adjudicationRows);
  const runs = normalized.runs || [];
  const modelVsReference = runs.map(run => compareRunToReference(run, references));
  const modelVsModel = [];
  for (let left = 0; left < runs.length; left += 1) {
    for (let right = left + 1; right < runs.length; right += 1) {
      modelVsModel.push(compareModelPair(runs[left], runs[right], references));
    }
  }
  const status = runs.length === 0 ? 'no_submissions' : runs.length === 1 ? 'single_model_only' : 'complete';
  const results = {
    schema_version: 'stage4m-model-agreement-results-1.0',
    status,
    source_normalized_runs: relative(NORMALIZED_PATH),
    source_reliability_sample: relative(SAMPLE_PATH),
    source_completed_coding: relative(COMPLETED_PATH),
    source_adjudication_log: relative(ADJUDICATION_PATH),
    packet_id: normalized.packet_id,
    reference_policy: 'Primary agreement is scored against immutable Stage 4A coder-A values. Stage 4B adjudications are carried as review context and never overwrite Stage 4A in this output.',
    metric_notes: {
      sacrifice_and_redemption: 'Binary detection of koenigsberg_function=sacrifice_and_redemption.',
      guilt_or_theodicy: 'Binary detection of koenigsberg_function=punishment_and_theodicy.',
      reconciliation_or_restoration: 'Binary proxy using violence_logic=restorative.',
      disease_or_purification: 'Binary detection of disease_and_purification function or purifying violence logic.',
      stability: 'Stability pools explicit comparisons across both scopes and never treats missing denominators as agreement.'
    },
    totals: {
      model_runs: runs.length,
      packet_units: references.size,
      identification_units: [...references.values()].filter(item => item.task_type === 'sentence_identification').length,
      field_agreement_units: [...references.values()].filter(item => item.task_type === 'field_agreement').length,
      adjudicated_context_units: [...references.values()].filter(item => item.adjudications.length > 0).length
    },
    model_vs_reference: modelVsReference,
    model_vs_model: modelVsModel,
    agreement_patterns: agreementPatterns(runs, references),
    stability: stability(modelVsReference, modelVsModel)
  };
  const rows = summaryRows(modelVsReference, modelVsModel);
  if (write) {
    writeAtomic(OUTPUT_PATHS.results, JSON.stringify(results, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.summary, makeCSV(rows));
    writeAtomic(OUTPUT_PATHS.markdown, renderMarkdown(results));
  }
  if (status === 'no_submissions') console.warn('WARN: No validated Stage 4M model runs are available for agreement metrics.');
  else console.log(`Stage 4M agreement computed for ${runs.length} model run(s) and ${modelVsModel.length} model pair(s).`);
  if (write) console.log(`Agreement results: ${relative(OUTPUT_PATHS.results)}`);
  return results;
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(arg => arg !== '--check');
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  compare({ write: !args.includes('--check') });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Stage 4M comparison failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  agreementPatterns,
  boundaryClassification,
  buildReferences,
  compare,
  compareRunToReference,
  stability
};
