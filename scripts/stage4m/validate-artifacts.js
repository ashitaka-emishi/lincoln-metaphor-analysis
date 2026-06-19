#!/usr/bin/env node
// Validates generated Stage 4M JSON artifacts and their cross-file counts.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.env.STAGE4M_ROOT
  ? path.resolve(process.env.STAGE4M_ROOT)
  : path.resolve(__dirname, '..', '..');

const CONTRACTS = Object.freeze([
  {
    path: ['data', 'reliability', 'model-comparison', 'normalized-model-runs.json'],
    schema: 'stage4m-normalized-model-runs-1.0',
    required: ['status', 'packet_id', 'input_packet_hash', 'runs'],
    arrays: ['runs'],
    objects: [],
    strings: ['status', 'packet_id', 'input_packet_hash']
  },
  {
    path: ['data', 'reliability', 'model-comparison', 'model-run-validation-report.json'],
    schema: 'stage4m-model-run-validation-report-1.0',
    required: ['status', 'packet_id', 'input_packet_hash', 'totals', 'files'],
    arrays: ['files'],
    objects: ['totals'],
    strings: ['status', 'packet_id', 'input_packet_hash']
  },
  {
    path: ['data', 'reliability', 'model-comparison', 'model-agreement-results.json'],
    schema: 'stage4m-model-agreement-results-1.0',
    required: ['status', 'packet_id', 'totals', 'model_vs_reference', 'model_vs_model', 'agreement_patterns', 'stability'],
    arrays: ['model_vs_reference', 'model_vs_model'],
    objects: ['totals', 'agreement_patterns', 'stability'],
    strings: ['status', 'packet_id']
  },
  {
    path: ['data', 'reliability', 'model-comparison', 'model-disagreement-log.json'],
    schema: 'stage4m-model-disagreement-log-1.0',
    required: ['status', 'totals', 'taxonomy', 'summaries', 'item_results', 'disagreements'],
    arrays: ['item_results', 'disagreements'],
    objects: ['totals', 'taxonomy', 'summaries'],
    strings: ['status']
  },
  {
    path: ['data', 'reliability', 'model-adjudication', 'stage4m-adjudication-queue.json'],
    schema: 'stage4m-adjudication-queue-1.0',
    required: ['status', 'totals', 'decision_values', 'items'],
    arrays: ['decision_values', 'items'],
    objects: ['totals'],
    strings: ['status']
  },
  {
    path: ['data', 'reliability', 'model-comparison', 'model-consensus-report.json'],
    schema: 'stage4m-model-consensus-report-1.0',
    required: [
      'status', 'summary', 'stable_coding_fields', 'unstable_coding_fields',
      'insufficient_evidence_fields', 'high_risk_documents', 'high_risk_clusters',
      'high_risk_interpretive_categories', 'cases_where_models_challenge_reference',
      'cases_where_reference_remains_strong', 'human_review_priorities',
      'annotation_codebook_implications'
    ],
    arrays: [
      'stable_coding_fields', 'unstable_coding_fields', 'insufficient_evidence_fields',
      'high_risk_documents', 'high_risk_clusters', 'high_risk_interpretive_categories',
      'cases_where_models_challenge_reference', 'cases_where_reference_remains_strong',
      'human_review_priorities', 'annotation_codebook_implications'
    ],
    objects: ['summary'],
    strings: ['status']
  }
]);

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function readArtifact(contract) {
  const filePath = path.join(ROOT, ...contract.path);
  if (!fs.existsSync(filePath)) return null;
  let artifact;
  try {
    artifact = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${relative(filePath)} is not valid JSON: ${error.message}`);
  }
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    throw new Error(`${relative(filePath)} must contain one JSON object.`);
  }
  if (artifact.schema_version !== contract.schema) {
    throw new Error(`${relative(filePath)} schema_version must be '${contract.schema}'.`);
  }
  for (const field of contract.required) {
    if (!(field in artifact)) {
      throw new Error(`${relative(filePath)} is missing required field '${field}'.`);
    }
  }
  for (const field of contract.arrays) {
    if (!Array.isArray(artifact[field])) {
      throw new Error(`${relative(filePath)} field '${field}' must be an array.`);
    }
  }
  for (const field of contract.objects) {
    if (!artifact[field] || typeof artifact[field] !== 'object' || Array.isArray(artifact[field])) {
      throw new Error(`${relative(filePath)} field '${field}' must be an object.`);
    }
  }
  for (const field of contract.strings) {
    if (typeof artifact[field] !== 'string' || artifact[field].trim() === '') {
      throw new Error(`${relative(filePath)} field '${field}' must be a non-empty string.`);
    }
  }
  return artifact;
}

function assertEqual(left, right, message) {
  if (left !== right) throw new Error(`${message}: ${left} !== ${right}`);
}

function validateCrossFile(artifacts) {
  const [
    normalized,
    validation,
    agreement,
    disagreements,
    queue,
    consensus
  ] = artifacts;

  if (normalized && validation) {
    assertEqual(normalized.packet_id, validation.packet_id, 'Packet ID mismatch between normalized runs and validation report');
    assertEqual(normalized.input_packet_hash, validation.input_packet_hash, 'Packet hash mismatch between normalized runs and validation report');
    assertEqual(validation.totals.submission_files, validation.files.length, 'Validation-report file count mismatch');
    assertEqual(validation.totals.valid_runs, normalized.runs.length, 'Validated-run count mismatch');
  }
  if (normalized && agreement) {
    assertEqual(normalized.packet_id, agreement.packet_id, 'Packet ID mismatch between normalized runs and agreement results');
    assertEqual(agreement.totals.model_runs, normalized.runs.length, 'Agreement model-run count mismatch');
  }
  if (agreement && disagreements) {
    assertEqual(disagreements.totals.model_runs, agreement.totals.model_runs, 'Disagreement model-run count mismatch');
    assertEqual(disagreements.totals.disagreement_records, disagreements.disagreements.length, 'Disagreement-record count mismatch');
  }
  if (disagreements && queue) {
    assertEqual(queue.totals.queue_items, queue.items.length, 'Adjudication queue item count mismatch');
    assertEqual(queue.totals.queue_items, disagreements.disagreements.length, 'Adjudication queue coverage mismatch');
  }
  if (agreement && disagreements && queue && consensus) {
    assertEqual(consensus.summary.model_runs, agreement.totals.model_runs, 'Consensus model-run count mismatch');
    assertEqual(consensus.summary.disagreement_records, disagreements.disagreements.length, 'Consensus disagreement count mismatch');
    assertEqual(consensus.summary.human_review_items, queue.items.length, 'Consensus review-item count mismatch');
  }
}

function validate() {
  const artifacts = CONTRACTS.map(readArtifact);
  const present = artifacts.filter(Boolean).length;
  validateCrossFile(artifacts);
  if (present === 0) {
    console.warn('WARN: No generated Stage 4M JSON artifacts exist yet.');
  } else {
    console.log(`Stage 4M generated artifacts valid (${present}/${CONTRACTS.length} present).`);
  }
  return { present, expected: CONTRACTS.length };
}

if (require.main === module) {
  try {
    validate();
  } catch (error) {
    console.error(`Stage 4M artifact validation failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { CONTRACTS, validate };
