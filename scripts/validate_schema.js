#!/usr/bin/env node
// Validates all JSON files against expected schemas. Exits 1 on any error.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errorCount = 0;

function err(file, msg) {
  console.error(`  ERROR [${path.relative(ROOT, file)}]: ${msg}`);
  errorCount++;
}

function warn(file, msg) {
  console.warn(`  WARN  [${path.relative(ROOT, file)}]: ${msg}`);
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    err(filePath, `JSON parse error: ${e.message}`);
    return null;
  }
}

function exists(p) {
  return fs.existsSync(p);
}

function readCSVHeader(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const firstLine = text.split(/\r?\n/, 1)[0] || '';
    return firstLine.split(',').map(value => value.trim().replace(/^\uFEFF/, ''));
  } catch (e) {
    err(filePath, `CSV read error: ${e.message}`);
    return [];
  }
}

function requireCsvColumns(filePath, expectedColumns) {
  if (!exists(filePath)) {
    err(filePath, 'File not found');
    return;
  }
  const header = readCSVHeader(filePath);
  for (const column of expectedColumns) {
    if (!header.includes(column)) err(filePath, `Missing CSV column: ${column}`);
  }
}

// ─── Corpus Manifest ────────────────────────────────────────────────────────

function validateManifest() {
  const filePath = path.join(ROOT, 'corpus', 'corpus_manifest.json');
  console.log('\nValidating corpus_manifest.json...');

  if (!exists(filePath)) { err(filePath, 'File not found'); return; }
  const manifest = readJSON(filePath);
  if (!manifest) return;

  const required = ['version', 'generated', 'register_enum', 'authorship_enum', 'periodization_enum', 'genre_enum', 'documents'];
  for (const field of required) {
    if (manifest[field] === undefined) err(filePath, `Missing top-level field: ${field}`);
  }

  if (!Array.isArray(manifest.documents)) { err(filePath, 'documents is not an array'); return; }

  const docFields = [
    'id', 'title', 'short_title', 'date', 'date_precision', 'period', 'genre',
    'register', 'authorship', 'authorship_confidence', 'source_text', 'source_edition',
    'source_url', 'editorial_status', 'inclusion_rationale', 'known_limitations',
    'risk_flags', 'analytical_priority', 'pipeline_stage_completed'
  ];

  const seenIds = new Set();
  for (const doc of manifest.documents) {
    if (!doc.id) { err(filePath, 'Document missing id'); continue; }
    if (seenIds.has(doc.id)) err(filePath, `Duplicate document id: ${doc.id}`);
    seenIds.add(doc.id);

    for (const field of docFields) {
      if (doc[field] === undefined) err(filePath, `${doc.id}: missing field '${field}'`);
    }

    if (manifest.register_enum && !manifest.register_enum.includes(doc.register)) {
      err(filePath, `${doc.id}: register '${doc.register}' not in register_enum`);
    }

    if (manifest.authorship_enum && !manifest.authorship_enum.includes(doc.authorship)) {
      err(filePath, `${doc.id}: authorship '${doc.authorship}' not in authorship_enum`);
    }

    if (manifest.periodization_enum && !manifest.periodization_enum.includes(doc.period)) {
      err(filePath, `${doc.id}: period '${doc.period}' not in periodization_enum`);
    }

    if (manifest.genre_enum && !manifest.genre_enum.includes(doc.genre)) {
      err(filePath, `${doc.id}: genre '${doc.genre}' not in genre_enum`);
    }

    if (!Array.isArray(doc.known_limitations)) {
      err(filePath, `${doc.id}: known_limitations must be an array`);
    }

    if (!Array.isArray(doc.risk_flags)) {
      err(filePath, `${doc.id}: risk_flags must be an array`);
    }

    if (typeof doc.authorship_confidence === 'number') {
      if (doc.authorship_confidence < 0 || doc.authorship_confidence > 1) {
        err(filePath, `${doc.id}: authorship_confidence out of range [0,1]: ${doc.authorship_confidence}`);
      }
    }
  }

  console.log(`  Documents: ${manifest.documents.length}`);
}

// ─── Segmented JSONs ─────────────────────────────────────────────────────────

function validateSegmentedJSON(filePath) {
  const data = readJSON(filePath);
  if (!data) return;

  if (!data.document_id) err(filePath, 'Missing document_id');
  if (!data.meta) err(filePath, 'Missing meta object');
  if (!Array.isArray(data.sections)) { err(filePath, 'Missing sections array'); return; }

  const seenIds = new Set();

  for (const section of data.sections) {
    if (!section.section_id) err(filePath, 'Section missing section_id');
    if (!Array.isArray(section.paragraphs)) { err(filePath, `${section.section_id}: missing paragraphs`); continue; }

    for (const para of section.paragraphs) {
      if (!para.paragraph_id) err(filePath, 'Paragraph missing paragraph_id');
      if (!Array.isArray(para.sentences)) { err(filePath, `${para.paragraph_id}: missing sentences`); continue; }

      for (const sent of para.sentences) {
        if (!sent.sentence_id) { err(filePath, 'Sentence missing sentence_id'); continue; }
        if (seenIds.has(sent.sentence_id)) err(filePath, `Duplicate sentence_id: ${sent.sentence_id}`);
        seenIds.add(sent.sentence_id);

        if (!Array.isArray(sent.metaphor_instances)) {
          err(filePath, `${sent.sentence_id}: metaphor_instances must be an array`);
        }
      }
    }
  }
}

function validateAllSegmented() {
  const dir = path.join(ROOT, 'corpus', 'segmented');
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => f.endsWith('.json') && /^doc_.*\.json$/.test(f))
    : [];
  console.log(`\nValidating segmented JSONs (${files.length} files)...`);
  for (const f of files) validateSegmentedJSON(path.join(dir, f));
}

// ─── Annotated JSONs ─────────────────────────────────────────────────────────

const VALID_CLUSTERS = new Set([
  'cluster_01_body_organism', 'cluster_02_covenant_oath', 'cluster_03_experiment_proposition',
  'cluster_04_birth_creation', 'cluster_05_fathers_inheritance', 'cluster_06_providence_theodicy'
]);

const VALID_FANTASY_TYPES = new Set([
  'wound_and_healing', 'birth_and_creation', 'sacrifice_and_redemption', 'oath_and_obligation',
  'punishment_and_theodicy', 'ancestral_debt', 'experiment_and_proof', 'disease_and_purification'
]);

const VALID_ABSENCE_FLAGS = new Set([
  'enslaved_people_non_agent', 'black_soldiers_erased', 'lincoln_non_agent',
  'confederates_depersonalized', 'death_abstracted', 'women_absent',
  'disease_purification_absent'
]);

function validateInstance(filePath, inst, sentId) {
  const loc = `${sentId} > ${inst.instance_id || 'NO_ID'}`;

  if (!inst.instance_id) err(filePath, `${loc}: missing instance_id`);
  if (!inst.sentence_id) err(filePath, `${loc}: missing sentence_id`);
  if (!inst.document_id) err(filePath, `${loc}: missing document_id`);
  if (!inst.span_text) err(filePath, `${loc}: missing span_text`);

  // CMT layer
  if (!inst.cmt) { err(filePath, `${loc}: missing cmt object`); }
  else {
    if (!inst.cmt.cluster_id) err(filePath, `${loc}: cmt.cluster_id missing`);
    else if (!VALID_CLUSTERS.has(inst.cmt.cluster_id)) err(filePath, `${loc}: invalid cluster_id '${inst.cmt.cluster_id}'`);
    if (!Array.isArray(inst.cmt.entailments)) err(filePath, `${loc}: cmt.entailments must be array`);
    if (inst.cmt.is_extended_metaphor === true && !inst.cmt.extension_group_id) {
      err(filePath, `${loc}: is_extended_metaphor true but extension_group_id is null`);
    }
  }

  // Koenigsberg layer
  if (!inst.koenigsberg) { err(filePath, `${loc}: missing koenigsberg object`); }
  else {
    const k = inst.koenigsberg;
    if (!k.fantasy_type) err(filePath, `${loc}: koenigsberg.fantasy_type missing`);
    else if (!VALID_FANTASY_TYPES.has(k.fantasy_type)) err(filePath, `${loc}: invalid fantasy_type '${k.fantasy_type}'`);

    if (typeof k.obligatory_frame !== 'boolean') err(filePath, `${loc}: obligatory_frame must be boolean`);
    if (typeof k.sacrificial_economy !== 'boolean') err(filePath, `${loc}: sacrificial_economy must be boolean`);

    // sacrificial_economy/yield consistency
    if (k.sacrificial_economy === false && k.sacrificial_yield !== null && k.sacrificial_yield !== undefined) {
      err(filePath, `${loc}: sacrificial_economy is false but sacrificial_yield is set ('${k.sacrificial_yield}')`);
    }

    if (!Array.isArray(k.absence_flags)) {
      err(filePath, `${loc}: absence_flags must be an array`);
    } else {
      for (const flag of k.absence_flags) {
        if (!VALID_ABSENCE_FLAGS.has(flag)) err(filePath, `${loc}: invalid absence_flag '${flag}'`);
      }
      if (k.absence_flags.length > 0 && !k.absence_notes) {
        warn(filePath, `${loc}: absence_flags set but absence_notes is null`);
      }
    }
  }

  // Meta layer
  if (!inst.meta) { err(filePath, `${loc}: missing meta object`); }
  else {
    const m = inst.meta;
    if (typeof m.confidence !== 'number') err(filePath, `${loc}: meta.confidence must be a number`);
    else if (m.confidence < 0.5 || m.confidence > 1.0) {
      err(filePath, `${loc}: meta.confidence out of range [0.5, 1.0]: ${m.confidence}`);
    }
    if (typeof m.ambiguity_flag !== 'boolean') err(filePath, `${loc}: meta.ambiguity_flag must be boolean`);
  }
}

function validateAnnotatedJSON(filePath) {
  const data = readJSON(filePath);
  if (!data) return;

  if (!data.document_id) err(filePath, 'Missing document_id');
  if (!Array.isArray(data.sections)) { err(filePath, 'Missing sections array'); return; }

  for (const section of data.sections) {
    if (!Array.isArray(section.paragraphs)) continue;
    for (const para of section.paragraphs) {
      if (!Array.isArray(para.sentences)) continue;
      for (const sent of para.sentences) {
        if (!Array.isArray(sent.metaphor_instances)) {
          err(filePath, `${sent.sentence_id}: metaphor_instances must be array`);
          continue;
        }
        for (const inst of sent.metaphor_instances) {
          validateInstance(filePath, inst, sent.sentence_id || 'UNKNOWN');
        }
      }
    }
  }
}

function validateAllAnnotated() {
  const dir = path.join(ROOT, 'corpus', 'annotated');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('_annotated.json')) : [];
  console.log(`\nValidating annotated JSONs (${files.length} files)...`);
  for (const f of files) validateAnnotatedJSON(path.join(dir, f));
}

// ─── Concordance ─────────────────────────────────────────────────────────────

function validateConcordance() {
  const filePath = path.join(ROOT, 'data', 'concordance.json');
  console.log('\nValidating concordance.json...');
  if (!exists(filePath)) { err(filePath, 'File not found'); return; }
  const data = readJSON(filePath);
  if (!data) return;

  const required = ['version', 'status', 'total_instances', 'instances', 'indexes'];
  for (const field of required) {
    if (data[field] === undefined) err(filePath, `Missing field: ${field}`);
  }

  if (data.indexes) {
    const requiredIndexes = ['by_cluster', 'by_document', 'by_register', 'by_fantasy_type', 'by_violence_logic', 'by_absence_flag', 'high_confidence_only', 'suppression_instances'];
    for (const idx of requiredIndexes) {
      if (data.indexes[idx] === undefined) err(filePath, `Missing index: indexes.${idx}`);
    }
  }
}

// ─── Analysis ────────────────────────────────────────────────────────────────

function validateAnalysis() {
  const filePath = path.join(ROOT, 'analysis', 'analysis.json');
  console.log('\nValidating analysis.json...');
  if (!exists(filePath)) { err(filePath, 'File not found'); return; }
  const data = readJSON(filePath);
  if (!data) return;

  if (!Array.isArray(data.cluster_analyses)) { err(filePath, 'Missing cluster_analyses array'); return; }

  const expectedClusters = [
    'cluster_01_body_organism', 'cluster_02_covenant_oath', 'cluster_03_experiment_proposition',
    'cluster_04_birth_creation', 'cluster_05_fathers_inheritance', 'cluster_06_providence_theodicy'
  ];

  const foundClusters = data.cluster_analyses.map(c => c.cluster_id);
  for (const expected of expectedClusters) {
    if (!foundClusters.includes(expected)) err(filePath, `Missing cluster stub: ${expected}`);
  }

  if (!data.systematic_absence) err(filePath, 'Missing systematic_absence block');
  if (!data.cross_cluster) err(filePath, 'Missing cross_cluster block');
  if (!data.koenigsberg_master_comparison) err(filePath, 'Missing koenigsberg_master_comparison block');
}

// ─── Evidence Chain JSON ────────────────────────────────────────────────────

function validateEvidenceChains() {
  const filePath = path.join(ROOT, 'data', 'evidence', 'annotation-evidence.json');
  console.log('\nValidating annotation-evidence.json...');
  if (!exists(filePath)) { err(filePath, 'File not found'); return; }
  const data = readJSON(filePath);
  if (!data) return;

  const required = ['version', 'status', 'source_stage', 'migration_policy', 'total_records', 'records', 'indexes'];
  for (const field of required) {
    if (data[field] === undefined) err(filePath, `Missing field: ${field}`);
  }

  if (data.migration_policy !== 'preserve_stage4_generate_derivative') {
    err(filePath, `Unexpected migration_policy: ${data.migration_policy}`);
  }

  if (!Array.isArray(data.records)) {
    err(filePath, 'records must be an array');
    return;
  }

  if (data.total_records !== data.records.length) {
    err(filePath, `total_records ${data.total_records} does not match records length ${data.records.length}`);
  }

  const seenAuditIds = new Set();
  for (const record of data.records) {
    const loc = record.audit_id || 'NO_AUDIT_ID';
    if (!record.audit_id) err(filePath, 'record missing audit_id');
    else if (seenAuditIds.has(record.audit_id)) err(filePath, `Duplicate audit_id: ${record.audit_id}`);
    seenAuditIds.add(record.audit_id);

    if (!record.document || !record.document.id) err(filePath, `${loc}: missing document.id`);
    if (!record.document || !record.document.source_url) err(filePath, `${loc}: missing document.source_url`);
    if (!record.location || !record.location.sentence_id) err(filePath, `${loc}: missing location.sentence_id`);
    if (!record.location || !record.location.span_text) err(filePath, `${loc}: missing location.span_text`);
    if (!record.lexical_unit) err(filePath, `${loc}: missing lexical_unit`);
    else {
      if (!record.lexical_unit.text) err(filePath, `${loc}: lexical_unit.text missing`);
      if (record.lexical_unit.mipvu_decision !== 'metaphor_related') {
        err(filePath, `${loc}: lexical_unit.mipvu_decision must be metaphor_related`);
      }
      if (!record.lexical_unit.contextual_meaning) err(filePath, `${loc}: lexical_unit.contextual_meaning missing`);
      if (!record.lexical_unit.basic_meaning) err(filePath, `${loc}: lexical_unit.basic_meaning missing`);
    }

    if (!record.cmt || !VALID_CLUSTERS.has(record.cmt.cluster_id)) {
      err(filePath, `${loc}: cmt.cluster_id invalid or missing`);
    }
    if (!record.cmt || !Array.isArray(record.cmt.entailments)) {
      err(filePath, `${loc}: cmt.entailments must be an array`);
    }
    if (!record.koenigsberg || !VALID_FANTASY_TYPES.has(record.koenigsberg.fantasy_type)) {
      err(filePath, `${loc}: koenigsberg.fantasy_type invalid or missing`);
    }
    if (!record.agency_absence || !Array.isArray(record.agency_absence.absence_flags)) {
      err(filePath, `${loc}: agency_absence.absence_flags must be an array`);
    } else {
      for (const flag of record.agency_absence.absence_flags) {
        if (!VALID_ABSENCE_FLAGS.has(flag)) err(filePath, `${loc}: invalid absence_flag '${flag}'`);
      }
    }
    if (!record.confidence || typeof record.confidence.score !== 'number') {
      err(filePath, `${loc}: confidence.score must be a number`);
    } else if (record.confidence.score < 0.5 || record.confidence.score > 1.0) {
      err(filePath, `${loc}: confidence.score out of range [0.5, 1.0]: ${record.confidence.score}`);
    }
    if (!record.claim_anchor || !record.claim_anchor.document_id || !record.claim_anchor.sentence_id || !record.claim_anchor.instance_id) {
      err(filePath, `${loc}: incomplete claim_anchor`);
    }
  }
}

// ─── Reliability Artifacts ──────────────────────────────────────────────────

function validateReliabilityArtifacts() {
  const samplePath = path.join(ROOT, 'data', 'reliability', 'reliability-sample.json');
  const templatePath = path.join(ROOT, 'data', 'reliability', 'double-coding-template.csv');
  const adjudicationPath = path.join(ROOT, 'data', 'reliability', 'adjudication-log.csv');
  console.log('\nValidating reliability artifacts...');

  if (!exists(samplePath)) { err(samplePath, 'File not found'); return; }
  const sample = readJSON(samplePath);
  if (!sample) return;

  const manifest = readJSON(path.join(ROOT, 'corpus', 'corpus_manifest.json'));
  const evidence = readJSON(path.join(ROOT, 'data', 'evidence', 'annotation-evidence.json'));
  if (!manifest || !evidence) return;

  const required = [
    'version', 'status', 'source_stage', 'sample_policy', 'double_coding_policy',
    'agreement_measures', 'disagreement_categories', 'documents',
    'identification_units', 'field_agreement_units', 'totals'
  ];
  for (const field of required) {
    if (sample[field] === undefined) err(samplePath, `Missing field: ${field}`);
  }

  if (sample.status !== 'sample_defined_adjudication_pending') {
    err(samplePath, `Unexpected status: ${sample.status}`);
  }
  if (sample.source_stage !== 'stage4a_annotation_evidence') {
    err(samplePath, `Unexpected source_stage: ${sample.source_stage}`);
  }

  if (!Array.isArray(sample.documents)) {
    err(samplePath, 'documents must be an array');
    return;
  }

  const manifestIds = new Set((manifest.documents || []).map(doc => doc.id));
  const sampleIds = new Set();
  for (const doc of sample.documents) {
    if (!doc.id) err(samplePath, 'Sample document missing id');
    else if (!manifestIds.has(doc.id)) err(samplePath, `Sample document not in manifest: ${doc.id}`);
    if (sampleIds.has(doc.id)) err(samplePath, `Duplicate sample document: ${doc.id}`);
    sampleIds.add(doc.id);
    if (!doc.rationale) err(samplePath, `${doc.id}: missing sample rationale`);
    if (!doc.period || !doc.register || !doc.source_url) err(samplePath, `${doc.id}: incomplete provenance metadata`);
  }

  const samplePercentage = sample.sample_policy && sample.sample_policy.sample_percentage;
  if (typeof samplePercentage !== 'number' || samplePercentage < 10 || samplePercentage > 20) {
    err(samplePath, `sample_percentage must be within [10,20], got ${samplePercentage}`);
  }
  if (sample.sample_policy && sample.sample_policy.sample_documents_total !== sample.documents.length) {
    err(samplePath, 'sample_policy.sample_documents_total does not match documents length');
  }
  if (sample.sample_policy && sample.sample_policy.corpus_documents_total !== manifest.documents.length) {
    err(samplePath, 'sample_policy.corpus_documents_total does not match manifest length');
  }

  const requiredAgreementBlocks = [
    'identification_reliability',
    'cmt_agreement',
    'koenigsberg_agreement',
    'confidence_agreement',
    'reporting_rule'
  ];
  for (const block of requiredAgreementBlocks) {
    if (!sample.agreement_measures || sample.agreement_measures[block] === undefined) {
      err(samplePath, `agreement_measures.${block} missing`);
    }
  }

  const requiredDisagreementCategories = [
    'mipvu_decision',
    'lexical_unit_boundary',
    'cluster_assignment',
    'fantasy_type',
    'agency_or_absence_flag',
    'confidence_band'
  ];
  for (const category of requiredDisagreementCategories) {
    if (!Array.isArray(sample.disagreement_categories) || !sample.disagreement_categories.includes(category)) {
      err(samplePath, `Missing disagreement category: ${category}`);
    }
  }

  const evidenceIds = new Set((evidence.records || []).map(record => record.audit_id));
  if (!Array.isArray(sample.identification_units) || sample.identification_units.length === 0) {
    err(samplePath, 'identification_units must be a non-empty array');
  } else {
    const allowedControlTypes = new Set(['positive_anchor', 'negative_control']);
    for (const unit of sample.identification_units) {
      if (!unit.reliability_unit_id) err(samplePath, 'identification unit missing reliability_unit_id');
      if (!sampleIds.has(unit.document_id)) err(samplePath, `${unit.reliability_unit_id}: document_id not in sample`);
      if (!unit.sentence_id) err(samplePath, `${unit.reliability_unit_id}: missing sentence_id`);
      if (!allowedControlTypes.has(unit.control_type)) err(samplePath, `${unit.reliability_unit_id}: invalid control_type '${unit.control_type}'`);
      if (!Array.isArray(unit.stage4_anchor_audit_ids)) {
        err(samplePath, `${unit.reliability_unit_id}: stage4_anchor_audit_ids must be an array`);
      } else {
        for (const auditId of unit.stage4_anchor_audit_ids) {
          if (!evidenceIds.has(auditId)) err(samplePath, `${unit.reliability_unit_id}: unknown audit id '${auditId}'`);
        }
      }
    }
  }

  if (!Array.isArray(sample.field_agreement_units) || sample.field_agreement_units.length === 0) {
    err(samplePath, 'field_agreement_units must be a non-empty array');
  } else {
    for (const unit of sample.field_agreement_units) {
      if (!unit.reliability_unit_id) err(samplePath, 'field agreement unit missing reliability_unit_id');
      if (!sampleIds.has(unit.document_id)) err(samplePath, `${unit.reliability_unit_id}: document_id not in sample`);
      if (!evidenceIds.has(unit.source_audit_id)) err(samplePath, `${unit.reliability_unit_id}: unknown source_audit_id '${unit.source_audit_id}'`);
      if (!unit.reference_values || !unit.reference_values.cluster_id || !unit.reference_values.fantasy_type) {
        err(samplePath, `${unit.reliability_unit_id}: incomplete reference_values`);
      }
    }
  }

  if (sample.totals) {
    if (sample.totals.documents !== sample.documents.length) err(samplePath, 'totals.documents does not match documents length');
    if (sample.totals.identification_units !== sample.identification_units.length) err(samplePath, 'totals.identification_units mismatch');
    if (sample.totals.field_agreement_units !== sample.field_agreement_units.length) err(samplePath, 'totals.field_agreement_units mismatch');
  }

  requireCsvColumns(templatePath, [
    'reliability_unit_id', 'unit_type', 'coder_id', 'document_id', 'sentence_id',
    'candidate_lexical_unit', 'mipvu_decision', 'cluster_id', 'fantasy_type',
    'absence_flags', 'confidence_score', 'disagreement_category', 'coder_notes'
  ]);
  requireCsvColumns(adjudicationPath, [
    'adjudication_id', 'reliability_unit_id', 'source_audit_id', 'document_id',
    'sentence_id', 'field_name', 'coder_a_value', 'coder_b_value',
    'disagreement_category', 'adjudicated_value', 'rationale', 'adjudicator',
    'adjudicated_date', 'follow_up_required', 'follow_up_issue'
  ]);
}

// ─── Controlled Analysis ────────────────────────────────────────────────────

function validateControlledAnalysis() {
  const filePath = path.join(ROOT, 'analysis', 'controlled-analysis.json');
  const pagePath = path.join(ROOT, 'analysis', 'controlled_outputs.md');
  console.log('\nValidating controlled-analysis.json...');

  if (!exists(filePath)) { err(filePath, 'File not found'); return; }
  const data = readJSON(filePath);
  if (!data) return;

  const evidence = readJSON(path.join(ROOT, 'data', 'evidence', 'annotation-evidence.json'));
  if (!evidence) return;

  const required = ['version', 'status', 'source', 'confidence_threshold', 'subsets', 'interpretation_rule'];
  for (const field of required) {
    if (data[field] === undefined) err(filePath, `Missing field: ${field}`);
  }

  if (data.status !== 'complete') err(filePath, `Unexpected status: ${data.status}`);
  if (data.source !== 'data/evidence/annotation-evidence.json') err(filePath, `Unexpected source: ${data.source}`);
  if (!data.confidence_threshold || data.confidence_threshold.field !== 'document.authorship_confidence') {
    err(filePath, 'confidence_threshold.field must be document.authorship_confidence');
  }
  if (!data.confidence_threshold || data.confidence_threshold.value !== 0.95) {
    err(filePath, 'confidence_threshold.value must be 0.95');
  }

  if (!Array.isArray(data.subsets)) {
    err(filePath, 'subsets must be an array');
    return;
  }

  const subsetMap = new Map(data.subsets.map(subset => [subset.name, subset]));
  for (const name of ['full_corpus', 'high_authorship_confidence_0_95']) {
    if (!subsetMap.has(name)) err(filePath, `Missing subset: ${name}`);
  }

  const expectedHighConfidence = (evidence.records || [])
    .filter(record => record.document && record.document.authorship_confidence >= 0.95)
    .length;

  const requiredClusterRows = ['cluster_by_register', 'cluster_by_period', 'cluster_by_document'];
  const requiredAbsenceRows = ['absence_by_register', 'absence_by_period', 'absence_by_document'];

  for (const subset of data.subsets) {
    if (typeof subset.total_instances !== 'number') err(filePath, `${subset.name}: total_instances must be a number`);
    if (typeof subset.total_documents !== 'number') err(filePath, `${subset.name}: total_documents must be a number`);
    if (!subset.cluster_totals) err(filePath, `${subset.name}: missing cluster_totals`);
    else {
      for (const cluster of VALID_CLUSTERS) {
        if (typeof subset.cluster_totals[cluster] !== 'number') {
          err(filePath, `${subset.name}: missing cluster total for ${cluster}`);
        }
      }
    }
    if (!subset.absence_totals) err(filePath, `${subset.name}: missing absence_totals`);
    else {
      for (const flag of VALID_ABSENCE_FLAGS) {
        if (typeof subset.absence_totals[flag] !== 'number') {
          err(filePath, `${subset.name}: missing absence total for ${flag}`);
        }
      }
    }
    for (const table of requiredClusterRows) {
      if (!Array.isArray(subset[table]) || subset[table].length === 0) {
        err(filePath, `${subset.name}: ${table} must be a non-empty array`);
      }
    }
    for (const table of requiredAbsenceRows) {
      if (!Array.isArray(subset[table]) || subset[table].length === 0) {
        err(filePath, `${subset.name}: ${table} must be a non-empty array`);
      }
    }
  }

  const fullSubset = subsetMap.get('full_corpus');
  if (fullSubset && fullSubset.total_instances !== evidence.records.length) {
    err(filePath, `full_corpus total_instances ${fullSubset.total_instances} does not match evidence records ${evidence.records.length}`);
  }
  const highSubset = subsetMap.get('high_authorship_confidence_0_95');
  if (highSubset && highSubset.total_instances !== expectedHighConfidence) {
    err(filePath, `high_authorship_confidence_0_95 total_instances ${highSubset.total_instances} does not match expected ${expectedHighConfidence}`);
  }

  if (!exists(pagePath)) err(pagePath, 'File not found');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('=== Schema Validation ===');
  validateManifest();
  validateAllSegmented();
  validateAllAnnotated();
  validateConcordance();
  validateAnalysis();
  validateEvidenceChains();
  validateReliabilityArtifacts();
  validateControlledAnalysis();

  console.log('\n' + '='.repeat(40));
  if (errorCount === 0) {
    console.log(`✓ All validations passed.`);
  } else {
    console.error(`✗ ${errorCount} error(s) found.`);
    process.exit(1);
  }
}

main();
