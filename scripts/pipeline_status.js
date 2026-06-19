#!/usr/bin/env node
// Pipeline status: shows S1-S4, aggregate analysis, and Stage 4M status.
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

  console.log('');
}

if (require.main === module) main();

module.exports = { stage4mStatus };
