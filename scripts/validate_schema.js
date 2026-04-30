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

// ─── Corpus Manifest ────────────────────────────────────────────────────────

function validateManifest() {
  const filePath = path.join(ROOT, 'corpus', 'corpus_manifest.json');
  console.log('\nValidating corpus_manifest.json...');

  if (!exists(filePath)) { err(filePath, 'File not found'); return; }
  const manifest = readJSON(filePath);
  if (!manifest) return;

  const required = ['version', 'generated', 'register_enum', 'authorship_enum', 'documents'];
  for (const field of required) {
    if (manifest[field] === undefined) err(filePath, `Missing top-level field: ${field}`);
  }

  if (!Array.isArray(manifest.documents)) { err(filePath, 'documents is not an array'); return; }

  const docFields = ['id', 'title', 'short_title', 'date', 'register', 'authorship_confidence', 'source_text', 'source_url', 'analytical_priority', 'pipeline_stage_completed'];

  const seenIds = new Set();
  for (const doc of manifest.documents) {
    if (!doc.id) { err(filePath, 'Document missing id'); continue; }
    if (seenIds.has(doc.id)) err(filePath, `Duplicate document id: ${doc.id}`);
    seenIds.add(doc.id);

    for (const field of docFields) {
      if (doc[field] === undefined) err(filePath, `${doc.id}: missing field '${field}'`);
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
  const filePath = path.join(ROOT, 'concordance', 'concordance.json');
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

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('=== Schema Validation ===');
  validateManifest();
  validateAllSegmented();
  validateAllAnnotated();
  validateConcordance();
  validateAnalysis();

  console.log('\n' + '='.repeat(40));
  if (errorCount === 0) {
    console.log(`✓ All validations passed.`);
  } else {
    console.error(`✗ ${errorCount} error(s) found.`);
    process.exit(1);
  }
}

main();
