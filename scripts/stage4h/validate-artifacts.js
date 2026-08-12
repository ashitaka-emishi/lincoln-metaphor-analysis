#!/usr/bin/env node
// Validates generated Stage 4H/4J artifacts and cross-file status consistency.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = (process.env.STAGE4H_ROOT || process.env.STAGE4J_ROOT)
  ? path.resolve(process.env.STAGE4H_ROOT || process.env.STAGE4J_ROOT)
  : path.resolve(__dirname, '..', '..');
const RELIABILITY_DIR = path.join(ROOT, 'data', 'reliability');
const PACKET_DIR = path.join(RELIABILITY_DIR, 'human-input-packets');
const SUBMISSION_DIR = path.join(RELIABILITY_DIR, 'human-output-submissions');
const DECISION_INPUTS = Object.freeze([
  path.join(RELIABILITY_DIR, 'human-adjudication', 'stage4j-adjudication-decisions.json'),
  path.join(RELIABILITY_DIR, 'human-adjudication', 'stage4j-adjudication-decisions.csv')
]);

const CONTRACTS = Object.freeze([
  {
    label: 'normalized human runs',
    path: ['data', 'reliability', 'human-comparison', 'normalized-human-runs.json'],
    schema: 'stage4h-normalized-human-runs-1.0',
    required: ['status', 'packet_id', 'input_packet_hash', 'submissions'],
    arrays: ['submissions'],
    objects: [],
    strings: ['status', 'packet_id', 'input_packet_hash']
  },
  {
    label: 'human-output validation report',
    path: ['data', 'reliability', 'human-comparison', 'human-output-validation-report.json'],
    schema: 'stage4h-human-output-validation-report-1.0',
    required: ['status', 'packet_id', 'input_packet_hash', 'totals', 'files'],
    arrays: ['files'],
    objects: ['totals'],
    strings: ['status', 'packet_id', 'input_packet_hash']
  },
  {
    label: 'human-human agreement results',
    path: ['data', 'reliability', 'human-comparison', 'human-agreement-results.json'],
    schema: 'stage4h-human-agreement-results-1.0',
    required: ['status', 'packet_id', 'input_packet_hash', 'totals', 'human_human'],
    arrays: [],
    objects: ['totals'],
    strings: ['status', 'packet_id', 'input_packet_hash']
  },
  {
    label: 'human-vs-reference results',
    path: ['data', 'reliability', 'human-comparison', 'human-vs-reference-results.json'],
    schema: 'stage4h-human-vs-reference-results-1.0',
    required: ['status', 'packet_id', 'input_packet_hash', 'totals', 'human_vs_reference', 'stage4j_candidates'],
    arrays: ['human_vs_reference', 'stage4j_candidates'],
    objects: ['totals'],
    strings: ['status', 'packet_id', 'input_packet_hash']
  },
  {
    label: 'human disagreement log',
    path: ['data', 'reliability', 'human-comparison', 'human-disagreement-log.json'],
    schema: 'stage4h-human-disagreement-log-1.0',
    required: ['status', 'packet_id', 'input_packet_hash', 'totals', 'category_counts', 'disagreements'],
    arrays: ['disagreements'],
    objects: ['totals', 'category_counts'],
    strings: ['status', 'packet_id', 'input_packet_hash']
  },
  {
    label: 'Stage 4J adjudication queue',
    path: ['data', 'reliability', 'human-adjudication', 'stage4j-adjudication-queue.json'],
    schema: 'stage4j-adjudication-queue-1.0',
    required: ['status', 'packet_id', 'input_packet_hash', 'totals', 'decision_values', 'items'],
    arrays: ['decision_values', 'items'],
    objects: ['totals'],
    strings: ['status', 'packet_id', 'input_packet_hash']
  },
  {
    label: 'Stage 4J normalized decisions',
    path: ['data', 'reliability', 'human-adjudication', 'stage4j-adjudication-decisions-normalized.json'],
    schema: 'stage4j-adjudication-decisions-normalized-1.0',
    required: ['status', 'source_adjudication_queue', 'decision_files', 'totals', 'decisions', 'missing_decision_ids', 'stage4a_correction_candidates'],
    arrays: ['decision_files', 'decisions', 'missing_decision_ids', 'stage4a_correction_candidates'],
    objects: ['totals'],
    strings: ['status', 'source_adjudication_queue']
  },
  {
    label: 'human reliability report',
    path: ['data', 'reliability', 'human-comparison', 'human-reliability-report.json'],
    schema: 'stage4h-human-reliability-report-1.0',
    required: ['status', 'adjudication_status', 'packet_id', 'input_packet_hash', 'totals', 'summaries'],
    arrays: [],
    objects: ['totals', 'summaries'],
    strings: ['status', 'adjudication_status', 'packet_id', 'input_packet_hash']
  },
  {
    label: 'Stage 4A correction candidates',
    path: ['data', 'reliability', 'human-adjudication', 'stage4j-stage4a-correction-candidates.json'],
    schema: 'stage4j-stage4a-correction-candidates-1.0',
    required: ['status', 'source_normalized_decisions', 'mutation_policy', 'candidates'],
    arrays: ['candidates'],
    objects: [],
    strings: ['status', 'source_normalized_decisions', 'mutation_policy']
  }
]);

const PAGE_PATHS = Object.freeze([
  ['docs', 'methodology', 'human-reliability-results.md'],
  ['docs', 'methodology', 'stage4j-adjudication-results.md'],
  ['docs', 'methodology', 'stage4h-codebook-revision-notes.md'],
  ['data', 'reliability', 'human-adjudication', 'stage4j-adjudication-validation-report.md']
]);

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${relative(filePath)} is not valid JSON: ${error.message}`);
  }
}

function readArtifact(contract) {
  const filePath = path.join(ROOT, ...contract.path);
  if (!exists(filePath)) return null;
  const artifact = readJSON(filePath);
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    throw new Error(`${relative(filePath)} must contain one JSON object.`);
  }
  if (artifact.schema_version !== contract.schema) {
    throw new Error(`${relative(filePath)} schema_version must be '${contract.schema}'.`);
  }
  for (const field of contract.required) {
    if (!(field in artifact)) throw new Error(`${relative(filePath)} is missing required field '${field}'.`);
  }
  for (const field of contract.arrays) {
    if (!Array.isArray(artifact[field])) throw new Error(`${relative(filePath)} field '${field}' must be an array.`);
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

function jsonOrCsvFiles(directory) {
  return exists(directory)
    ? fs.readdirSync(directory).filter(name => /\.(json|csv)$/i.test(name) && !name.startsWith('.'))
    : [];
}

function hasDecisionInputs() {
  return DECISION_INPUTS.some(filePath => exists(filePath));
}

function readPacketContext() {
  const manifestPath = path.join(PACKET_DIR, 'human-packet-manifest.json');
  if (!exists(manifestPath)) return null;
  const manifest = readJSON(manifestPath);
  const units = new Map();
  for (const name of ['human-sentence-identification-packet.jsonl', 'human-field-agreement-packet.jsonl']) {
    const filePath = path.join(PACKET_DIR, name);
    if (!exists(filePath)) throw new Error(`${relative(filePath)} is required by the packet manifest.`);
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
    for (const [index, line] of lines.entries()) {
      let unit;
      try {
        unit = JSON.parse(line);
      } catch (error) {
        throw new Error(`${relative(filePath)} line ${index + 1} is not valid JSON: ${error.message}`);
      }
      if (!unit.packet_unit_id || units.has(unit.packet_unit_id)) {
        throw new Error(`${relative(filePath)} has a missing or duplicate packet_unit_id at line ${index + 1}.`);
      }
      units.set(unit.packet_unit_id, {
        doc_id: unit.doc_id || unit.document_id,
        sentence_id: unit.sentence_id
      });
    }
  }
  return { manifest, units };
}

function validatePacketIdentity(artifacts, packetContext) {
  if (!packetContext) {
    if (artifacts.some(Boolean)) throw new Error('Generated Stage 4H/4J artifacts exist but the packet manifest is missing.');
    return;
  }
  const { manifest, units } = packetContext;
  const packetId = manifest.packet_id;
  const packetHash = manifest.input_packet_hash;
  if (!packetId || !packetHash) throw new Error('Packet manifest is missing packet identity fields.');

  for (const artifact of artifacts) {
    if (!artifact) continue;
    if ('packet_id' in artifact) assertEqual(artifact.packet_id, packetId, `${artifact.schema_version} packet ID mismatch`);
    if ('input_packet_hash' in artifact) assertEqual(artifact.input_packet_hash, packetHash, `${artifact.schema_version} packet hash mismatch`);
  }

  const normalized = artifacts[0];
  for (const submission of normalized?.submissions || []) {
    assertEqual(submission.input_packet_id, packetId, `Submission '${submission.submission_id}' packet ID mismatch`);
    assertEqual(submission.input_packet_hash, packetHash, `Submission '${submission.submission_id}' packet hash mismatch`);
    for (const item of submission.items || []) {
      const expected = units.get(item.packet_unit_id);
      if (!expected) throw new Error(`Submission '${submission.submission_id}' references unknown packet item '${item.packet_unit_id}'.`);
      assertEqual(item.doc_id, expected.doc_id, `Submission item '${item.packet_unit_id}' document mismatch`);
      assertEqual(item.sentence_id, expected.sentence_id, `Submission item '${item.packet_unit_id}' sentence mismatch`);
    }
  }

  const disagreementLog = artifacts[4];
  for (const disagreement of disagreementLog?.disagreements || []) {
    const expected = units.get(disagreement.packet_unit_id);
    if (!expected) throw new Error(`Disagreement artifact references unknown packet item '${disagreement.packet_unit_id}'.`);
    assertEqual(disagreement.doc_id, expected.doc_id, `Disagreement '${disagreement.disagreement_id}' document mismatch`);
    assertEqual(disagreement.sentence_id, expected.sentence_id, `Disagreement '${disagreement.disagreement_id}' sentence mismatch`);
  }
}

function validateCrossFile(artifacts, packetContext) {
  const [
    normalized,
    validation,
    agreement,
    reference,
    disagreement,
    queue,
    decisions,
    report,
    correctionCandidates
  ] = artifacts;

  if (normalized && validation) {
    assertEqual(validation.totals.submission_files, validation.files.length, 'Human-output validation file count mismatch');
    assertEqual(validation.totals.valid_submissions, normalized.submissions.length, 'Validated human-submission count mismatch');
  }
  if (normalized && agreement) {
    assertEqual(agreement.totals.primary_human_coders, (normalized.submissions || []).filter(item => ['human_coder_a', 'human_coder_b'].includes(item.coder_id)).length, 'Agreement primary-coder count mismatch');
  }
  if (agreement && reference && disagreement) {
    assertEqual(agreement.status, reference.status, 'Human agreement and human-vs-reference statuses differ');
    const expectedDisagreement = agreement.status === 'complete' ? 'review_ready' : agreement.status;
    assertEqual(disagreement.status, expectedDisagreement, 'Human disagreement status mismatch');
    assertEqual(disagreement.totals.disagreements, disagreement.disagreements.length, 'Human disagreement count mismatch');
  }
  if (disagreement && queue) {
    assertEqual(queue.totals.queue_items, queue.items.length, 'Stage 4J queue item count mismatch');
    if (disagreement.status === 'review_ready') {
      assertEqual(queue.totals.queue_items, disagreement.disagreements.length, 'Stage 4J queue coverage mismatch');
    }
  }
  if (queue && decisions) {
    assertEqual(decisions.source_adjudication_queue, 'data/reliability/human-adjudication/stage4j-adjudication-queue.json', 'Stage 4J decision source queue mismatch');
    assertEqual(decisions.totals.decision_files, decisions.decision_files.length, 'Stage 4J decision file count mismatch');
    assertEqual(decisions.totals.valid_decisions, decisions.decisions.length, 'Stage 4J valid decision count mismatch');
    assertEqual(decisions.totals.queue_items, queue.items.length, 'Stage 4J decision queue-item count mismatch');
    assertEqual(decisions.totals.missing_decisions, decisions.missing_decision_ids.length, 'Stage 4J missing-decision count mismatch');
    assertEqual(decisions.totals.stage4a_correction_candidates, decisions.stage4a_correction_candidates.length, 'Stage 4A correction-candidate count mismatch');
  }
  if (decisions && report) {
    assertEqual(report.source_stage4j_adjudication_decisions, 'data/reliability/human-adjudication/stage4j-adjudication-decisions-normalized.json', 'Human reliability report Stage 4J source mismatch');
    assertEqual(report.adjudication_status, decisions.status, 'Human reliability report adjudication status mismatch');
  }
  if (decisions && correctionCandidates) {
    assertEqual(correctionCandidates.source_normalized_decisions, 'data/reliability/human-adjudication/stage4j-adjudication-decisions-normalized.json', 'Correction-candidate source mismatch');
    assertEqual(correctionCandidates.candidates.length, decisions.stage4a_correction_candidates.length, 'Correction-candidate export count mismatch');
  }
  validatePacketIdentity(artifacts, packetContext);
}

function validatePages({ decisions }) {
  const decisionInputsPresent = hasDecisionInputs();
  const decisionsExecuted = decisions?.status === 'valid' || decisions?.status === 'incomplete';
  if (!decisionInputsPresent && !decisionsExecuted) return;
  for (const parts of PAGE_PATHS) {
    const filePath = path.join(ROOT, ...parts);
    if (!exists(filePath)) throw new Error(`${relative(filePath)} is required by Stage 4H/4J validation.`);
  }
  if (decisionInputsPresent && !decisionsExecuted) {
    throw new Error(`Stage 4J decision inputs exist but normalized decisions status is '${decisions?.status || 'missing'}'.`);
  }
}

function validate() {
  const artifacts = CONTRACTS.map(readArtifact);
  const present = artifacts.filter(Boolean).length;
  const packetContext = readPacketContext();
  const submissionFiles = jsonOrCsvFiles(SUBMISSION_DIR);
  const decisionInputsPresent = hasDecisionInputs();

  if (submissionFiles.length > 0 && present !== CONTRACTS.length) {
    const missing = CONTRACTS
      .filter((contract, index) => !artifacts[index])
      .map(contract => contract.path.join('/'));
    throw new Error(`Human submissions exist but generated Stage 4H/4J artifacts are incomplete; run 'npm run stage4h'. Missing: ${missing.join(', ')}`);
  }
  if (decisionInputsPresent && present !== CONTRACTS.length) {
    const missing = CONTRACTS
      .filter((contract, index) => !artifacts[index])
      .map(contract => contract.path.join('/'));
    throw new Error(`Stage 4J decision inputs exist but generated Stage 4H/4J artifacts are incomplete; run 'npm run stage4j'. Missing: ${missing.join(', ')}`);
  }

  validateCrossFile(artifacts, packetContext);
  if (present > 0) validatePages({ decisions: artifacts[6] });

  const report = artifacts[7];
  const decisions = artifacts[6];
  if (submissionFiles.length === 0) {
    console.warn('WARN: Stage 4H designed but not executed (no human-output submissions).');
  } else if (report?.status === 'partially_executed') {
    console.warn('WARN: Stage 4H partially executed (one primary human submission).');
  }
  if (decisions?.status === 'no_decisions') {
    console.warn('WARN: Stage 4J adjudication pending (no completed decision files).');
  }

  if (present === 0) {
    console.warn('WARN: No generated Stage 4H/4J JSON artifacts exist yet.');
  } else {
    console.log(`Stage 4H/4J generated artifacts valid (${present}/${CONTRACTS.length} present).`);
  }
  return { present, expected: CONTRACTS.length };
}

if (require.main === module) {
  try {
    validate();
  } catch (error) {
    console.error(`Stage 4H/4J artifact validation failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { CONTRACTS, validate };
