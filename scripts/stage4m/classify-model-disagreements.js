#!/usr/bin/env node
// Classifies item-level Stage 4M disagreement and interpretive instability.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.env.STAGE4M_ROOT
  ? path.resolve(process.env.STAGE4M_ROOT)
  : path.resolve(__dirname, '..', '..');
const COMPARISON_DIR = path.join(ROOT, 'data', 'reliability', 'model-comparison');
const AGREEMENT_PATH = path.join(COMPARISON_DIR, 'model-agreement-results.json');
const NORMALIZED_PATH = path.join(COMPARISON_DIR, 'normalized-model-runs.json');
const SAMPLE_PATH = path.join(ROOT, 'data', 'reliability', 'reliability-sample.json');
const OUTPUT_PATHS = Object.freeze({
  json: path.join(COMPARISON_DIR, 'model-disagreement-log.json'),
  csv: path.join(COMPARISON_DIR, 'model-disagreement-log.csv'),
  markdown: path.join(COMPARISON_DIR, 'model-instability-report.md')
});

const FIELD_CATEGORY = Object.freeze({
  metaphor_present: 'mipvu_decision',
  lexical_unit: 'lexical_unit_boundary',
  cluster_id: 'cluster_assignment',
  source_domain: 'source_domain',
  target_domain: 'target_domain',
  koenigsberg_function: 'koenigsberg_function',
  violence_logic: 'violence_logic',
  obligatory_frame: 'obligatory_frame',
  agency_or_absence_flag: 'agency_or_absence_flag',
  confidence: 'confidence_band',
  ambiguity_flag: 'ambiguity_flag',
  rival_reading: 'rival_reading'
});

const CSV_COLUMNS = Object.freeze([
  'disagreement_id', 'packet_unit_id', 'task_type', 'doc_id', 'sentence_id',
  'field_name', 'disagreement_category', 'agreement_pattern', 'reference_value',
  'model_values', 'all_models_against_reference',
  'cmt_agreement_koenigsberg_disagreement', 'over_read_type',
  'requires_human_adjudication', 'rationale'
]);

const OVER_READ_FUNCTIONS = Object.freeze({
  sacrifice_and_redemption: 'sacrifice',
  punishment_and_theodicy: 'providence',
  disease_and_purification: 'purification'
});

const DISAGREEMENT_CATEGORIES = Object.freeze([
  'mipvu_decision',
  'lexical_unit_boundary',
  'cluster_assignment',
  'source_domain',
  'target_domain',
  'koenigsberg_function',
  'violence_logic',
  'obligatory_frame',
  'agency_or_absence_flag',
  'confidence_band',
  'ambiguity_flag',
  'rival_reading',
  'over_interpretation',
  'under_interpretation',
  'historical_context_error',
  'model_hallucination',
  'schema_noncompliance',
  'reference_challenge'
]);

const AGREEMENT_PATTERNS = Object.freeze([
  'unanimous_with_reference',
  'unanimous_against_reference',
  'majority_with_reference',
  'majority_against_reference',
  'split_no_majority',
  'single_model_outlier',
  'reference_only',
  'all_models_uncertain',
  'unstable_category',
  'requires_human_adjudication'
]);

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(value) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return [...new Set(value.map(normalize).filter(Boolean))].sort();
  const text = String(value).trim().replace(/\s+/g, ' ').toLowerCase();
  return text === '' ? null : text;
}

function stableValue(value) {
  return JSON.stringify(normalize(value));
}

function equalValues(left, right) {
  return stableValue(left) === stableValue(right);
}

function confidenceBand(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  if (score >= 0.9) return 'high';
  if (score >= 0.75) return 'medium';
  return 'low';
}

function sortUnits(left, right) {
  return left.document_id.localeCompare(right.document_id)
    || left.sentence_id.localeCompare(right.sentence_id)
    || String(left.span_text || '').localeCompare(String(right.span_text || ''));
}

function buildReferences(sample) {
  const fieldsBySentence = new Map();
  for (const unit of sample.field_agreement_units || []) {
    const key = `${unit.document_id}|${unit.sentence_id}`;
    if (!fieldsBySentence.has(key)) fieldsBySentence.set(key, []);
    fieldsBySentence.get(key).push(unit.span_text);
  }

  const identification = [...(sample.identification_units || [])].sort(sortUnits);
  const fieldAgreement = [...(sample.field_agreement_units || [])].sort(sortUnits);
  return [...identification, ...fieldAgreement].map((unit, index) => {
    const packetUnitId = `stage4m_unit_${String(index + 1).padStart(5, '0')}`;
    if (unit.unit_type === 'sentence_identification') {
      return {
        packet_unit_id: packetUnitId,
        reliability_unit_id: unit.reliability_unit_id,
        task_type: unit.unit_type,
        doc_id: unit.document_id,
        sentence_id: unit.sentence_id,
        sentence_text: unit.sentence_text,
        metaphor_present: unit.stage4_anchor_count > 0 ? 'yes' : 'no',
        lexical_unit: normalize(fieldsBySentence.get(`${unit.document_id}|${unit.sentence_id}`) || []),
        control_type: unit.control_type,
        cluster_id: null,
        source_domain: null,
        target_domain: null,
        koenigsberg_function: null,
        violence_logic: null,
        obligatory_frame: null,
        agency_or_absence_flag: [],
        confidence: null,
        ambiguity_flag: null,
        rival_reading: null
      };
    }

    const values = unit.reference_values || {};
    return {
      packet_unit_id: packetUnitId,
      reliability_unit_id: unit.reliability_unit_id,
      task_type: unit.unit_type,
      doc_id: unit.document_id,
      sentence_id: unit.sentence_id,
      sentence_text: unit.sentence_text,
      metaphor_present: values.mipvu_decision === 'metaphor_related' ? 'yes' : 'no',
      lexical_unit: normalize(unit.span_text),
      control_type: null,
      cluster_id: normalize(values.cluster_id),
      source_domain: normalize(values.source_domain),
      target_domain: normalize(values.target_domain),
      koenigsberg_function: normalize(values.fantasy_type),
      violence_logic: normalize(values.violence_logic),
      obligatory_frame: values.obligatory_frame === true,
      agency_or_absence_flag: normalize(values.absence_flags || []),
      confidence: confidenceBand(values.confidence_score),
      ambiguity_flag: values.ambiguity_flag === true ? 'yes' : 'no',
      rival_reading: null
    };
  });
}

function groupRunItems(run) {
  const grouped = new Map();
  for (const item of run.items || []) {
    if (!grouped.has(item.packet_unit_id)) grouped.set(item.packet_unit_id, []);
    grouped.get(item.packet_unit_id).push(item);
  }
  return grouped;
}

function aggregateModel(items) {
  if (!items || items.length === 0) return null;
  const primary = items[0];
  return {
    metaphor_present: items.some(item => item.metaphor_present === 'yes')
      ? 'yes'
      : items.some(item => item.metaphor_present === 'uncertain') ? 'uncertain' : 'no',
    lexical_unit: normalize(items.map(item => item.lexical_unit).filter(Boolean)),
    cluster_id: normalize(primary.cluster_id),
    source_domain: normalize(primary.source_domain),
    target_domain: normalize(primary.target_domain),
    koenigsberg_function: normalize(primary.koenigsberg_function),
    violence_logic: normalize(primary.violence_logic),
    obligatory_frame: primary.obligatory_frame !== null,
    agency_or_absence_flag: primary.agency_or_absence_flag
      ? [normalize(primary.agency_or_absence_flag)]
      : [],
    confidence: normalize(primary.confidence),
    ambiguity_flag: normalize(primary.ambiguity_flag),
    rival_reading: normalize(primary.rival_reading)
  };
}

function modelValuesFor(reference, groupedRuns) {
  return Object.fromEntries(groupedRuns
    .map(({ run, items }) => [run.run_id, aggregateModel(items.get(reference.packet_unit_id))])
    .filter(([, value]) => value !== null));
}

function boundaryEqual(referenceValue, modelValue) {
  const referenceSpans = Array.isArray(referenceValue) ? referenceValue : referenceValue ? [referenceValue] : [];
  const modelSpans = Array.isArray(modelValue) ? modelValue : modelValue ? [modelValue] : [];
  if (referenceSpans.length === 0 && modelSpans.length === 0) return true;
  return equalValues(referenceSpans, modelSpans);
}

function fieldEqual(field, referenceValue, modelValue) {
  if (field === 'lexical_unit') return boundaryEqual(referenceValue, modelValue);
  if (field === 'agency_or_absence_flag') {
    const referenceFlags = Array.isArray(referenceValue) ? referenceValue : [];
    const modelFlags = Array.isArray(modelValue) ? modelValue : [];
    if (referenceFlags.length === 0 && modelFlags.length === 0) return true;
    if (modelFlags.length === 1 && referenceFlags.includes(modelFlags[0])) return true;
  }
  if (field === 'rival_reading') return Boolean(referenceValue) === Boolean(modelValue);
  return equalValues(referenceValue, modelValue);
}

function applicableFields(reference) {
  const common = ['metaphor_present', 'lexical_unit'];
  if (reference.task_type === 'sentence_identification') return common;
  return [
    ...common, 'cluster_id', 'source_domain', 'target_domain',
    'koenigsberg_function', 'violence_logic', 'obligatory_frame',
    'agency_or_absence_flag', 'confidence', 'ambiguity_flag', 'rival_reading'
  ];
}

function consensusPattern(referenceValue, modelValues, field) {
  const entries = Object.entries(modelValues);
  if (entries.length === 0) return 'reference_only';
  const values = entries.map(([, record]) => record[field]);
  if (field === 'metaphor_present' && values.every(value => value === 'uncertain')) {
    return 'all_models_uncertain';
  }
  const counts = new Map();
  for (const value of values) {
    const key = stableValue(value);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const ordered = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  const winning = ordered[0];
  const allSame = winning[1] === values.length;
  const matchesReference = winning[0] === stableValue(referenceValue);
  if (allSame) return matchesReference ? 'unanimous_with_reference' : 'unanimous_against_reference';
  if (values.length >= 3 && winning[1] === values.length - 1 && ordered[1][1] === 1) {
    return 'single_model_outlier';
  }
  if (winning[1] > values.length / 2) {
    return matchesReference ? 'majority_with_reference' : 'majority_against_reference';
  }
  return 'split_no_majority';
}

function allModelsAgainst(referenceValue, modelValues, field) {
  const records = Object.values(modelValues);
  return records.length > 0 && records.every(record => !fieldEqual(field, referenceValue, record[field]));
}

function overReadType(reference, modelValues) {
  const referenceFunction = reference.koenigsberg_function;
  for (const record of Object.values(modelValues)) {
    const type = OVER_READ_FUNCTIONS[record.koenigsberg_function];
    if (type && record.koenigsberg_function !== referenceFunction) return type;
  }
  return null;
}

function underInterpretation(referenceValue, modelValues, field) {
  if (referenceValue === null || (Array.isArray(referenceValue) && referenceValue.length === 0)) return false;
  return Object.values(modelValues).some(record => {
    const value = record[field];
    return value === null || (Array.isArray(value) && value.length === 0);
  });
}

function hallucinatedSpan(reference, modelValues) {
  const sentence = normalize(reference.sentence_text) || '';
  return Object.values(modelValues).some(record => {
    const spans = Array.isArray(record.lexical_unit) ? record.lexical_unit : [record.lexical_unit];
    return spans.filter(Boolean).some(span => !sentence.includes(normalize(span)));
  });
}

function cmtKoenigsbergSplit(reference, modelValues) {
  const records = Object.values(modelValues);
  if (records.length < 2 || reference.task_type !== 'field_agreement') return false;
  const cmtFields = ['cluster_id', 'source_domain', 'target_domain'];
  const koenigsbergFields = ['koenigsberg_function', 'violence_logic', 'obligatory_frame'];
  const unanimous = fields => fields.every(field => {
    const values = records.map(record => stableValue(record[field]));
    return new Set(values).size === 1;
  });
  return unanimous(cmtFields) && !unanimous(koenigsbergFields);
}

function chooseCategory(field, reference, modelValues) {
  if (field === 'agency_or_absence_flag') return 'agency_or_absence_flag';
  if (field === 'lexical_unit' && hallucinatedSpan(reference, modelValues)) return 'model_hallucination';
  if (field === 'koenigsberg_function' && overReadType(reference, modelValues)) return 'over_interpretation';
  if (underInterpretation(reference[field], modelValues, field)) return 'under_interpretation';
  return FIELD_CATEGORY[field];
}

function needsHumanReview(category, pattern, flags) {
  return category === 'agency_or_absence_flag'
    || category === 'reference_challenge'
    || category === 'over_interpretation'
    || flags.all_models_against_reference
    || pattern === 'unanimous_against_reference'
    || flags.cmt_agreement_koenigsberg_disagreement;
}

function rationaleFor(category, field, pattern, flags) {
  if (category === 'model_hallucination') return 'A submitted lexical span is not present in the canonical sentence text.';
  if (category === 'over_interpretation') return `A model introduced a ${flags.over_read_type} interpretation absent from the Stage 4A reference.`;
  if (category === 'under_interpretation') return `A model omitted the reference value for ${field}.`;
  if (category === 'reference_challenge') return 'All available models agree with one another and disagree with the immutable Stage 4A reference.';
  if (flags.cmt_agreement_koenigsberg_disagreement) return 'Models agree on CMT mapping but diverge on Koenigsberg interpretation.';
  return `Model values diverge from one another or from Stage 4A for ${field} (${pattern}).`;
}

function classify(agreement, normalized, sample) {
  if (agreement.packet_id !== normalized.packet_id) {
    throw new Error(`Packet mismatch between agreement results '${agreement.packet_id}' and normalized runs '${normalized.packet_id}'.`);
  }
  if (agreement.totals && agreement.totals.model_runs !== (normalized.runs || []).length) {
    throw new Error('Agreement results are stale: model-run count does not match normalized runs.');
  }
  if (normalized.status === 'validation_failed') {
    throw new Error('Normalized model runs contain upstream validation failures; rerun ingestion before classification.');
  }
  if (agreement.status === 'no_submissions' && (normalized.runs || []).length > 0) {
    throw new Error('Agreement results are stale: normalized runs exist but agreement status is no_submissions.');
  }
  const references = buildReferences(sample);
  const groupedRuns = (normalized.runs || []).map(run => ({ run, items: groupRunItems(run) }));
  const itemResults = [];
  const disagreements = [];

  for (const reference of references) {
    const modelValues = modelValuesFor(reference, groupedRuns);
    const fields = applicableFields(reference);
    const fieldPatterns = {};
    const cmtSplit = cmtKoenigsbergSplit(reference, modelValues);
    let unitNeedsReview = false;
    let unitHasDisagreement = false;

    for (const field of fields) {
      const referenceValue = reference[field];
      const pattern = consensusPattern(referenceValue, modelValues, field);
      fieldPatterns[field] = pattern;
      const divergentRuns = Object.entries(modelValues)
        .filter(([, record]) => !fieldEqual(field, referenceValue, record[field]))
        .map(([runId]) => runId);
      const modelValueSet = new Set(Object.values(modelValues).map(record => stableValue(record[field])));
      const hasDisagreement = divergentRuns.length > 0 || modelValueSet.size > 1;
      if (!hasDisagreement) continue;
      unitHasDisagreement = true;

      const flags = {
        all_models_against_reference: allModelsAgainst(referenceValue, modelValues, field),
        cmt_agreement_koenigsberg_disagreement: cmtSplit
          && ['koenigsberg_function', 'violence_logic', 'obligatory_frame'].includes(field),
        over_read_type: field === 'koenigsberg_function' ? overReadType(reference, modelValues) : null
      };
      let category = chooseCategory(field, reference, modelValues);
      if (flags.all_models_against_reference
        && pattern === 'unanimous_against_reference'
        && category !== 'over_interpretation'
        && category !== 'model_hallucination'
        && category !== 'agency_or_absence_flag') {
        category = 'reference_challenge';
      }
      const humanReview = needsHumanReview(category, pattern, flags);
      unitNeedsReview ||= humanReview;
      disagreements.push({
        disagreement_id: `stage4m_disagreement_${String(disagreements.length + 1).padStart(5, '0')}`,
        packet_unit_id: reference.packet_unit_id,
        reliability_unit_id: reference.reliability_unit_id,
        task_type: reference.task_type,
        doc_id: reference.doc_id,
        sentence_id: reference.sentence_id,
        field_name: field,
        disagreement_category: category,
        agreement_pattern: pattern,
        reference_value: referenceValue,
        model_values: Object.fromEntries(Object.entries(modelValues).map(([runId, record]) => [runId, record[field]])),
        divergent_run_ids: divergentRuns,
        all_models_against_reference: flags.all_models_against_reference,
        cmt_agreement_koenigsberg_disagreement: flags.cmt_agreement_koenigsberg_disagreement,
        over_read_type: flags.over_read_type,
        requires_human_adjudication: humanReview,
        rationale: rationaleFor(category, field, pattern, flags)
      });
    }

    const patterns = Object.values(fieldPatterns);
    let agreementPattern = 'reference_only';
    if (patterns.includes('all_models_uncertain')) agreementPattern = 'all_models_uncertain';
    else if (patterns.includes('unanimous_against_reference')) agreementPattern = 'unanimous_against_reference';
    else if (patterns.includes('majority_against_reference')) agreementPattern = 'majority_against_reference';
    else if (patterns.includes('split_no_majority')) agreementPattern = 'split_no_majority';
    else if (patterns.includes('single_model_outlier')) agreementPattern = 'single_model_outlier';
    else if (patterns.includes('majority_with_reference')) agreementPattern = 'majority_with_reference';
    else if (patterns.includes('unanimous_with_reference')) agreementPattern = 'unanimous_with_reference';

    const stabilityFields = disagreements
      .filter(item => item.packet_unit_id === reference.packet_unit_id)
      .map(item => item.field_name)
      .filter(field => agreement.stability
        && agreement.stability.categories
        && agreement.stability.categories[field === 'lexical_unit' ? 'lexical_unit_boundary' : field]
        && agreement.stability.categories[field === 'lexical_unit' ? 'lexical_unit_boundary' : field].classification === 'unstable');
    const patternFlags = [];
    if (stabilityFields.length > 0) patternFlags.push('unstable_category');
    if (unitNeedsReview) patternFlags.push('requires_human_adjudication');
    if (!unitHasDisagreement && groupedRuns.length > 0 && agreementPattern === 'reference_only') {
      agreementPattern = 'unanimous_with_reference';
    }

    itemResults.push({
      packet_unit_id: reference.packet_unit_id,
      reliability_unit_id: reference.reliability_unit_id,
      task_type: reference.task_type,
      doc_id: reference.doc_id,
      sentence_id: reference.sentence_id,
      model_run_count: Object.keys(modelValues).length,
      agreement_pattern: agreementPattern,
      pattern_flags: patternFlags,
      disagreement_count: disagreements.filter(item => item.packet_unit_id === reference.packet_unit_id).length,
      requires_human_adjudication: unitNeedsReview,
      field_patterns: fieldPatterns
    });
  }

  const countBy = (items, field) => Object.fromEntries([...items.reduce((map, item) => {
    const value = item[field];
    map.set(value, (map.get(value) || 0) + 1);
    return map;
  }, new Map()).entries()].sort(([left], [right]) => left.localeCompare(right)));
  const status = groupedRuns.length === 0 ? 'no_submissions' : disagreements.length === 0 ? 'no_disagreements' : 'complete';
  return {
    schema_version: 'stage4m-model-disagreement-log-1.0',
    status,
    source_agreement_results: relative(AGREEMENT_PATH),
    source_normalized_runs: relative(NORMALIZED_PATH),
    source_reliability_sample: relative(SAMPLE_PATH),
    reference_policy: 'Stage 4A remains immutable. Any case where all available models disagree with Stage 4A requires human review; model consensus against Stage 4A is additionally classified as a reference challenge, never an automatic correction.',
    taxonomy: {
      disagreement_categories: DISAGREEMENT_CATEGORIES,
      agreement_patterns: AGREEMENT_PATTERNS,
      reserved_manual_categories: [
        'historical_context_error',
        'schema_noncompliance'
      ]
    },
    totals: {
      packet_items: itemResults.length,
      model_runs: groupedRuns.length,
      items_with_disagreement: itemResults.filter(item => item.disagreement_count > 0).length,
      disagreement_records: disagreements.length,
      items_requiring_human_adjudication: itemResults.filter(item => item.requires_human_adjudication).length
    },
    summaries: {
      by_disagreement_category: countBy(disagreements, 'disagreement_category'),
      by_agreement_pattern: countBy(itemResults, 'agreement_pattern')
    },
    item_results: itemResults,
    disagreements
  };
}

function csvEscape(value) {
  const text = value === null || value === undefined
    ? ''
    : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function makeCSV(disagreements) {
  return [
    CSV_COLUMNS.join(','),
    ...disagreements.map(item => CSV_COLUMNS.map(column => csvEscape(item[column])).join(','))
  ].join('\n') + '\n';
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`)
  ].join('\n');
}

function renderMarkdown(result) {
  const lines = [
    '# Stage 4M Model Instability Report',
    '',
    `Status: **${result.status.replaceAll('_', ' ')}**`,
    '',
    'This is an AI-assisted diagnostic stress test. Disagreement identifies review priorities; it does not authorize changes to Stage 4A.',
    '',
    `Packet items: ${result.totals.packet_items}; model runs: ${result.totals.model_runs}; disagreement records: ${result.totals.disagreement_records}; human-review items: ${result.totals.items_requiring_human_adjudication}.`,
    ''
  ];
  if (result.status === 'no_submissions') {
    lines.push('No validated model submissions are available. Every packet item is currently classified as `reference_only`.');
    return lines.join('\n').trimEnd() + '\n';
  }

  lines.push('## Disagreement Categories', '', markdownTable(
    ['Category', 'Count'],
    Object.entries(result.summaries.by_disagreement_category).map(([category, count]) => [category, String(count)])
  ), '', '## Agreement Patterns', '', markdownTable(
    ['Pattern', 'Items'],
    Object.entries(result.summaries.by_agreement_pattern).map(([pattern, count]) => [pattern, String(count)])
  ), '', '## Human Review Priorities', '');
  const priorities = result.disagreements.filter(item => item.requires_human_adjudication);
  if (priorities.length === 0) lines.push('No disagreement currently triggers mandatory human review.');
  else lines.push(markdownTable(
    ['Packet item', 'Field', 'Category', 'Pattern', 'Reason'],
    priorities.map(item => [
      item.packet_unit_id,
      item.field_name,
      item.disagreement_category,
      item.agreement_pattern,
      item.rationale.replace(/\|/g, '\\|')
    ])
  ));
  lines.push('', '## Special Flags', '',
    `- All-model reference challenges: ${result.disagreements.filter(item => item.all_models_against_reference).length}.`,
    `- CMT-agree / Koenigsberg-disagree records: ${result.disagreements.filter(item => item.cmt_agreement_koenigsberg_disagreement).length}.`,
    `- Sacrifice, providence, or purification over-reads: ${result.disagreements.filter(item => item.over_read_type).length}.`,
    `- Agency/absence disagreements preserved for review: ${result.disagreements.filter(item => item.disagreement_category === 'agency_or_absence_flag').length}.`,
    '', '## Reference Policy', '', result.reference_policy);
  return lines.join('\n').trimEnd() + '\n';
}

function writeAtomic(filePath, contents) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(COMPARISON_DIR) + path.sep)) {
    throw new Error(`Refusing write outside Stage 4M comparison directory: ${filePath}`);
  }
  fs.mkdirSync(COMPARISON_DIR, { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, contents);
  fs.renameSync(temporaryPath, filePath);
}

function run({ write }) {
  const agreement = readJSON(AGREEMENT_PATH);
  const normalized = readJSON(NORMALIZED_PATH);
  const sample = readJSON(SAMPLE_PATH);
  const result = classify(agreement, normalized, sample);
  if (write) {
    writeAtomic(OUTPUT_PATHS.json, JSON.stringify(result, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.csv, makeCSV(result.disagreements));
    writeAtomic(OUTPUT_PATHS.markdown, renderMarkdown(result));
  }
  if (result.status === 'no_submissions') {
    console.warn('WARN: No validated Stage 4M model submissions are available for disagreement classification.');
  } else {
    console.log(`Stage 4M disagreements: ${result.totals.disagreement_records}; human-review items: ${result.totals.items_requiring_human_adjudication}.`);
  }
  if (write) console.log(`Instability report: ${relative(OUTPUT_PATHS.markdown)}`);
  return result;
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(arg => arg !== '--check');
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  run({ write: !args.includes('--check') });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Stage 4M disagreement classification failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { buildReferences, classify, consensusPattern, run };
