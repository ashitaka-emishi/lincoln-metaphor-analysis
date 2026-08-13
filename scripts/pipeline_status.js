#!/usr/bin/env node
// Pipeline status: shows S1-S4, aggregate analysis, and reliability status.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.env.PIPELINE_ROOT
  ? path.resolve(process.env.PIPELINE_ROOT)
  : path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'corpus', 'corpus_manifest.json');

function exists(p) {
  return fs.existsSync(p);
}

function tick(flag) {
  return flag ? '✓' : '·';
}

function pad(str, len) {
  return String(str).padEnd(len);
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readOptionalJSON(filePath) {
  return exists(filePath) ? readJSON(filePath) : null;
}

function txtFileCount(directory) {
  return exists(directory)
    ? fs.readdirSync(directory).filter(name => name.endsWith('.txt') && !name.startsWith('.')).length
    : 0;
}

function envFlag(name) {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').toLowerCase());
}

function v4ReleaseMarker(root) {
  const marker = readOptionalJSON(path.join(root, 'data', 'corpus', 'corpus-v4-release-status.json'));
  if (!marker) return { marked: false, status: 'not_marked' };
  const marked = marker.release_ready === true || ['release_candidate', 'release-ready', 'release_ready'].includes(marker.status);
  return { marked, status: marker.status || (marked ? 'release_candidate' : 'not_marked') };
}

function reportStatus(report) {
  return report?.status || 'not_generated';
}

function reportWarnings(report) {
  return report?.summary?.warnings ?? report?.warnings?.length ?? 0;
}

function reportErrors(report) {
  return report?.summary?.errors ?? report?.errors?.length ?? 0;
}

function statusFailures(statuses) {
  return statuses.filter(status => !['pass', 'generated'].includes(status)).length;
}

function v4CorpusStatus(root = ROOT) {
  const corpusDir = path.join(root, 'data', 'corpus');
  const coreInventory = readOptionalJSON(path.join(corpusDir, 'corpus-v4-core-inventory.json'));
  const validationInventory = readOptionalJSON(path.join(corpusDir, 'corpus-v4-validation-inventory.json'));
  const referenceInventory = readOptionalJSON(path.join(corpusDir, 'corpus-v4-reference-inventory.json'));
  const inventoryReport = readOptionalJSON(path.join(corpusDir, 'corpus-v4-inventory-validation-report.json'));
  const provenanceReport = readOptionalJSON(path.join(corpusDir, 'corpus-v4-provenance-validation-report.json'));
  const ingestion = readOptionalJSON(path.join(corpusDir, 'corpus-v4-ingestion-manifest.json'));
  const segmentation = readOptionalJSON(path.join(corpusDir, 'corpus-v4-segmentation-manifest.json'));
  const sentenceIds = readOptionalJSON(path.join(corpusDir, 'corpus-v4-sentence-id-validation-report.json'));
  const coverage = readOptionalJSON(path.join(corpusDir, 'corpus-v4-coverage-summary.json'));
  const impact = readOptionalJSON(path.join(corpusDir, 'corpus-v4-expansion-impact-report.json'));
  const reliability = readOptionalJSON(path.join(corpusDir, 'corpus-v4-reliability-sample-frame.json'));
  const lightAnnotation = exists(path.join(corpusDir, 'v4-validation-light-annotation-template.csv'));
  const coreRawFiles = txtFileCount(path.join(root, 'corpus', 'raw', 'v4-core'));
  const validationRawFiles = txtFileCount(path.join(root, 'corpus', 'raw', 'v4-validation'));
  const release = v4ReleaseMarker(root);
  const releaseMode = release.marked || envFlag('CORPUS_V4_RELEASE_MODE') || envFlag('V4_RELEASE_MODE');
  const v4FilesExist = Boolean(
    release.marked || coreInventory || validationInventory || referenceInventory || ingestion || segmentation || coreRawFiles || validationRawFiles
  );
  const missingRawFiles = ingestion?.summary?.missing_raw_files ?? null;
  const baseStatuses = coreInventory ? [reportStatus(inventoryReport)] : [];
  const coreProgressStatuses = coreInventory && coreRawFiles > 0
    ? [reportStatus(provenanceReport), reportStatus(ingestion), reportStatus(segmentation), reportStatus(sentenceIds)]
    : [];
  const releaseStatuses = releaseMode
    ? [
        reportStatus(coverage),
        reportStatus(impact),
        reportStatus(reliability),
        lightAnnotation ? 'generated' : 'not_generated'
      ]
    : [];
  const requiredStatusFailures = statusFailures(baseStatuses.concat(coreProgressStatuses, releaseStatuses));
  const errors = [
    reportErrors(inventoryReport),
    reportErrors(provenanceReport),
    ingestion?.summary?.errors ?? 0,
    sentenceIds?.summary?.errors ?? 0,
    requiredStatusFailures
  ].reduce((sum, count) => sum + count, 0);
  const warnings = [
    reportWarnings(inventoryReport),
    reportWarnings(provenanceReport),
    ingestion?.summary?.warnings ?? 0
  ].reduce((sum, count) => sum + count, 0);

  let summary;
  if (!v4FilesExist) {
    summary = 'not implemented';
  } else if (releaseMode) {
    summary = 'release candidate';
  } else if (coreInventory && coreRawFiles > 0) {
    summary = 'core corpus in progress';
  } else if (coreInventory) {
    summary = 'inventory drafted, ingestion incomplete';
  } else {
    summary = 'not implemented';
  }

  let validationSummary;
  if (!v4FilesExist) {
    validationSummary = 'pass';
  } else if (errors > 0 || (releaseMode && (missingRawFiles ?? 0) > 0)) {
    validationSummary = 'fail';
  } else if (warnings > 0 || (missingRawFiles ?? 0) > 0) {
    validationSummary = 'pass_with_warnings';
  } else {
    validationSummary = 'pass';
  }

  return {
    summary,
    validation_summary: validationSummary,
    release_mode: releaseMode,
    release_marker_status: release.status,
    inventory_status: reportStatus(inventoryReport),
    provenance_status: reportStatus(provenanceReport),
    ingestion_status: reportStatus(ingestion),
    segmentation_status: reportStatus(segmentation),
    sentence_id_status: reportStatus(sentenceIds),
    coverage_status: reportStatus(coverage),
    impact_status: reportStatus(impact),
    reliability_sample_status: reportStatus(reliability),
    light_annotation_status: lightAnnotation ? 'generated' : 'not_generated',
    core_documents: coreInventory?.document_count ?? 0,
    validation_documents: validationInventory?.document_count ?? 0,
    reference_documents: referenceInventory?.document_count ?? 0,
    core_raw_files: coreRawFiles,
    validation_raw_files: validationRawFiles,
    normalized_files: ingestion?.summary?.normalized_files_written ?? 0,
    missing_raw_files: missingRawFiles ?? 0,
    segmented_documents: segmentation?.summary?.documents ?? 0,
    required_status_failures: requiredStatusFailures,
    warnings,
    errors
  };
}

function stage4mStatus(root = ROOT) {
  const reliability = path.join(root, 'data', 'reliability');
  const submissionDir = path.join(reliability, 'model-output-submissions');
  const packetManifestPath = path.join(reliability, 'model-input-packets', 'model-packet-manifest.json');
  const comparison = path.join(reliability, 'model-comparison');
  const queuePath = path.join(reliability, 'model-adjudication', 'stage4m-adjudication-queue.json');
  const submissionFiles = exists(submissionDir)
    ? fs.readdirSync(submissionDir).filter(name => /\.(json|csv)$/i.test(name) && !name.startsWith('.'))
    : [];
  const readOptional = filePath => exists(filePath) ? readJSON(filePath) : null;
  const packet = readOptional(packetManifestPath);
  const validation = readOptional(path.join(comparison, 'model-run-validation-report.json'));
  const normalized = readOptional(path.join(comparison, 'normalized-model-runs.json'));
  const agreement = readOptional(path.join(comparison, 'model-agreement-results.json'));
  const disagreements = readOptional(path.join(comparison, 'model-disagreement-log.json'));
  const queue = readOptional(queuePath);
  const consensus = readOptional(path.join(comparison, 'model-consensus-report.json'));

  let summary;
  if (submissionFiles.length === 0) summary = 'Stage 4M designed but not executed';
  else if (validation?.status === 'validation_failed' || normalized?.status === 'validation_failed') {
    summary = 'Stage 4M validation failed';
  } else if (consensus?.status === 'review_ready') summary = 'Stage 4M review ready';
  else if (agreement?.status === 'complete') summary = 'Stage 4M comparison complete';
  else summary = 'Stage 4M submissions present; run npm run stage4m';

  return {
    summary,
    packet_status: packet?.status || 'not_generated',
    submission_files: submissionFiles.length,
    validation_status: validation?.status || 'not_generated',
    valid_runs: validation?.totals?.valid_runs ?? 0,
    normalized_status: normalized?.status || 'not_generated',
    agreement_status: agreement?.status || 'not_generated',
    disagreement_status: disagreements?.status || 'not_generated',
    queue_status: queue?.status || 'not_generated',
    consensus_status: consensus?.status || 'not_generated'
  };
}

function jsonOrCsvFiles(directory) {
  return exists(directory)
    ? fs.readdirSync(directory).filter(name => /\.(json|csv)$/i.test(name) && !name.startsWith('.'))
    : [];
}

function stage4hStatus(root = ROOT) {
  const reliability = path.join(root, 'data', 'reliability');
  const submissionDir = path.join(reliability, 'human-output-submissions');
  const packetManifestPath = path.join(reliability, 'human-input-packets', 'human-packet-manifest.json');
  const comparison = path.join(reliability, 'human-comparison');
  const readOptional = filePath => exists(filePath) ? readJSON(filePath) : null;
  const submissionFiles = jsonOrCsvFiles(submissionDir);
  const packet = readOptional(packetManifestPath);
  const validation = readOptional(path.join(comparison, 'human-output-validation-report.json'));
  const normalized = readOptional(path.join(comparison, 'normalized-human-runs.json'));
  const agreement = readOptional(path.join(comparison, 'human-agreement-results.json'));
  const reference = readOptional(path.join(comparison, 'human-vs-reference-results.json'));
  const disagreements = readOptional(path.join(comparison, 'human-disagreement-log.json'));
  const report = readOptional(path.join(comparison, 'human-reliability-report.json'));

  let summary;
  if (validation?.status === 'validation_failed' || normalized?.status === 'validation_failed') {
    summary = 'Stage 4H validation failed';
  } else if (report?.status === 'complete_enough_for_metrics' || agreement?.status === 'complete') {
    summary = 'Stage 4H complete enough for metrics';
  } else if (report?.status === 'partially_executed' || validation?.totals?.primary_coders === 1) {
    summary = 'Stage 4H partially executed';
  } else if (submissionFiles.length === 0) {
    summary = 'Stage 4H designed but not executed';
  } else {
    summary = 'Stage 4H submissions present; run npm run stage4h';
  }

  return {
    summary,
    packet_status: packet?.status || 'not_generated',
    submission_files: submissionFiles.length,
    validation_status: validation?.status || 'not_generated',
    valid_submissions: validation?.totals?.valid_submissions ?? 0,
    primary_coders: validation?.totals?.primary_coders ?? 0,
    normalized_status: normalized?.status || 'not_generated',
    agreement_status: agreement?.status || 'not_generated',
    reference_status: reference?.status || 'not_generated',
    disagreement_status: disagreements?.status || 'not_generated',
    reliability_report_status: report?.status || 'not_generated'
  };
}

function stage4jStatus(root = ROOT) {
  const reliability = path.join(root, 'data', 'reliability');
  const adjudication = path.join(reliability, 'human-adjudication');
  const readOptional = filePath => exists(filePath) ? readJSON(filePath) : null;
  const queue = readOptional(path.join(adjudication, 'stage4j-adjudication-queue.json'));
  const decisions = readOptional(path.join(adjudication, 'stage4j-adjudication-decisions-normalized.json'));
  const correctionCandidates = readOptional(path.join(adjudication, 'stage4j-stage4a-correction-candidates.json'));
  const decisionFiles = [
    path.join(adjudication, 'stage4j-adjudication-decisions.json'),
    path.join(adjudication, 'stage4j-adjudication-decisions.csv')
  ].filter(filePath => exists(filePath)).length;

  let summary;
  if (decisions?.status === 'validation_failed') summary = 'Stage 4J validation failed';
  else if (decisions?.status === 'valid') summary = 'Stage 4J adjudication executed';
  else if (decisions?.status === 'incomplete') summary = 'Stage 4J adjudication incomplete';
  else if (queue || decisions?.status === 'no_decisions') summary = 'Stage 4J adjudication pending';
  else summary = 'Stage 4J not generated';

  return {
    summary,
    queue_status: queue?.status || 'not_generated',
    queue_items: queue?.totals?.queue_items ?? 0,
    decision_files: decisionFiles,
    decision_status: decisions?.status || 'not_generated',
    valid_decisions: decisions?.totals?.valid_decisions ?? 0,
    missing_decisions: decisions?.totals?.missing_decisions ?? 0,
    correction_candidate_status: correctionCandidates?.status || 'not_generated',
    stage4a_correction_candidates: correctionCandidates?.candidates?.length ?? 0
  };
}

function main() {
  if (!exists(MANIFEST)) {
    console.error('ERROR: corpus/corpus_manifest.json not found.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const docs = manifest.documents;

  const header = [
    pad('ID', 10),
    pad('Short Title', 28),
    pad('Date', 12),
    pad('Priority', 10),
    'S1', 'S2', 'S3', 'S4'
  ].join('  ');

  const separator = '-'.repeat(header.length + 8);

  console.log('\n=== Lincoln Corpus Pipeline Status ===\n');
  console.log(header);
  console.log(separator);

  let s1Total = 0, s2Total = 0, s3Total = 0, s4Total = 0;

  for (const doc of docs) {
    const id = doc.id;

    const rawDir = path.join(ROOT, 'corpus', 'raw');
    const textDir = path.join(ROOT, 'corpus', 'text');
    const segDir = path.join(ROOT, 'corpus', 'segmented');
    const annDir = path.join(ROOT, 'corpus', 'annotated');

    // Stage 1: any file in raw/ matching doc_id
    const s1 = fs.readdirSync(rawDir).some(f => f.startsWith(id)) ||
               doc.pipeline_stage_completed >= 1;

    // Stage 2: text/{id}.md exists
    const s2 = exists(path.join(textDir, `${id}.md`)) ||
               exists(path.join(textDir, `${id}.txt`));

    // Stage 3: segmented/{id}.json
    const s3 = exists(path.join(segDir, `${id}.json`));

    // Stage 4: annotated/{id}_annotated.json
    const s4 = exists(path.join(annDir, `${id}_annotated.json`));

    if (s1) s1Total++;
    if (s2) s2Total++;
    if (s3) s3Total++;
    if (s4) s4Total++;

    const row = [
      pad(id, 10),
      pad(doc.short_title, 28),
      pad(doc.date, 12),
      pad(doc.analytical_priority, 10),
      tick(s1),
      tick(s2),
      tick(s3),
      tick(s4)
    ].join('  ');

    console.log(row);
  }

  console.log(separator);
  console.log(
    pad('TOTALS', 10) + '  ' +
    pad('', 28) + '  ' +
    pad('', 12) + '  ' +
    pad('', 10) + '  ' +
    `${s1Total}/${docs.length}  ${s2Total}/${docs.length}  ${s3Total}/${docs.length}  ${s4Total}/${docs.length}`
  );

  // Concordance status
  const concordancePath = path.join(ROOT, 'data', 'concordance.json');
  console.log('\n--- Concordance ---');
  if (exists(concordancePath)) {
    const conc = JSON.parse(fs.readFileSync(concordancePath, 'utf8'));
    console.log(`  Status: ${conc.status}`);
    console.log(`  Total instances: ${conc.total_instances}`);
    console.log(`  Total documents: ${conc.total_documents}`);
    console.log(`  Total sentences: ${conc.total_sentences}`);
  } else {
    console.log('  data/concordance.json not found.');
  }

  // Analysis status
  const analysisPath = path.join(ROOT, 'analysis', 'analysis.json');
  console.log('\n--- Analysis ---');
  if (exists(analysisPath)) {
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    console.log(`  Status: ${analysis.status}`);
    const clusters = (analysis.cluster_analyses || []);
    for (const ca of clusters) {
      const count = ca.instance_count === null ? 'null' : ca.instance_count;
      console.log(`  ${ca.cluster_id}: ${count} instances`);
    }
  } else {
    console.log('  analysis.json not found.');
  }

  const v4 = v4CorpusStatus();
  console.log('\n--- V4 Corpus Expansion ---');
  console.log(`  V4 corpus status: ${v4.summary}`);
  console.log(`  Validation: ${v4.validation_summary}`);
  console.log(`  Release mode: ${v4.release_mode ? 'on' : 'off'} (${v4.release_marker_status})`);
  console.log(`  Inventories: ${v4.inventory_status} (${v4.core_documents} core; ${v4.validation_documents} validation; ${v4.reference_documents} reference)`);
  console.log(`  Provenance: ${v4.provenance_status}`);
  console.log(`  Raw files: ${v4.core_raw_files} core; ${v4.validation_raw_files} validation; missing ${v4.missing_raw_files}`);
  console.log(`  Ingestion: ${v4.ingestion_status} (${v4.normalized_files} normalized)`);
  console.log(`  Segmentation: ${v4.segmentation_status} (${v4.segmented_documents} documents)`);
  console.log(`  Sentence IDs: ${v4.sentence_id_status}`);
  console.log(`  Coverage: ${v4.coverage_status}`);
  console.log(`  Impact: ${v4.impact_status}`);
  console.log(`  Reliability sample: ${v4.reliability_sample_status}`);
  console.log(`  Light annotation: ${v4.light_annotation_status}`);
  console.log(`  Findings: ${v4.errors} error(s); ${v4.warnings} warning(s)`);

  const stage4m = stage4mStatus();
  console.log('\n--- Stage 4M Multi-Model Reliability ---');
  console.log(`  Status: ${stage4m.summary}`);
  console.log(`  Packet: ${stage4m.packet_status}`);
  console.log(`  Submission files: ${stage4m.submission_files}`);
  console.log(`  Validation: ${stage4m.validation_status} (${stage4m.valid_runs} valid runs)`);
  console.log(`  Agreement: ${stage4m.agreement_status}`);
  console.log(`  Disagreements: ${stage4m.disagreement_status}`);
  console.log(`  Adjudication queue: ${stage4m.queue_status}`);
  console.log(`  Consensus report: ${stage4m.consensus_status}`);

  const stage4h = stage4hStatus();
  console.log('\n--- Stage 4H Human Inter-Annotator Reliability ---');
  console.log(`  Status: ${stage4h.summary}`);
  console.log(`  Packet: ${stage4h.packet_status}`);
  console.log(`  Submission files: ${stage4h.submission_files}`);
  console.log(`  Validation: ${stage4h.validation_status} (${stage4h.valid_submissions} valid submissions; ${stage4h.primary_coders} primary coders)`);
  console.log(`  Agreement: ${stage4h.agreement_status}`);
  console.log(`  Human-vs-reference: ${stage4h.reference_status}`);
  console.log(`  Disagreements: ${stage4h.disagreement_status}`);
  console.log(`  Reliability report: ${stage4h.reliability_report_status}`);

  const stage4j = stage4jStatus();
  console.log('\n--- Stage 4J Human Adjudication ---');
  console.log(`  Status: ${stage4j.summary}`);
  console.log(`  Adjudication queue: ${stage4j.queue_status} (${stage4j.queue_items} items)`);
  console.log(`  Decision files: ${stage4j.decision_files}`);
  console.log(`  Decisions: ${stage4j.decision_status} (${stage4j.valid_decisions} valid; ${stage4j.missing_decisions} missing)`);
  console.log(`  Stage 4A correction candidates: ${stage4j.correction_candidate_status} (${stage4j.stage4a_correction_candidates})`);

  console.log('');
}

if (require.main === module) main();

module.exports = { v4CorpusStatus, stage4mStatus, stage4hStatus, stage4jStatus };
