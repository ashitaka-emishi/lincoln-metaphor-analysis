#!/usr/bin/env node
// Stage 5: reads all annotated JSONs, builds concordance.json with full indexes.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANNOTATED_DIR = path.join(ROOT, 'corpus', 'annotated');
const CONCORDANCE_PATH = path.join(ROOT, 'data', 'concordance.json');
const MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');

function addToIndex(index, key, instanceId) {
  if (!index[key]) index[key] = [];
  index[key].push(instanceId);
}

function main() {
  console.log('=== Building Concordance (Stage 5) ===\n');

  if (!fs.existsSync(ANNOTATED_DIR)) {
    console.error('ERROR: corpus/annotated/ directory not found.');
    process.exit(1);
  }

  const files = fs.readdirSync(ANNOTATED_DIR).filter(f => f.endsWith('_annotated.json'));
  console.log(`Found ${files.length} annotated file(s).`);

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const docMeta = {};
  for (const doc of manifest.documents) docMeta[doc.id] = doc;

  const allInstances = [];
  let totalSentences = 0;

  const indexes = {
    by_cluster: {
      cluster_01_body_organism: [],
      cluster_02_covenant_oath: [],
      cluster_03_experiment_proposition: [],
      cluster_04_birth_creation: [],
      cluster_05_fathers_inheritance: [],
      cluster_06_providence_theodicy: []
    },
    by_document: {},
    by_register: {},
    by_fantasy_type: {},
    by_violence_logic: {},
    by_absence_flag: {
      enslaved_people_non_agent: [],
      black_soldiers_erased: [],
      lincoln_non_agent: [],
      confederates_depersonalized: [],
      death_abstracted: [],
      women_absent: [],
      disease_purification_absent: []
    },
    high_confidence_only: [],
    suppression_instances: []
  };

  const processedDocIds = new Set();

  for (const file of files) {
    const filePath = path.join(ANNOTATED_DIR, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`  ERROR parsing ${file}: ${e.message}`);
      continue;
    }

    const docId = data.document_id;
    processedDocIds.add(docId);
    const meta = docMeta[docId] || {};
    const register = meta.register || 'unknown';

    let docInstanceCount = 0;

    for (const section of (data.sections || [])) {
      for (const para of (section.paragraphs || [])) {
        for (const sent of (para.sentences || [])) {
          totalSentences++;
          for (const inst of (sent.metaphor_instances || [])) {
            const iid = inst.instance_id;
            allInstances.push(inst);
            docInstanceCount++;

            // by_cluster
            const clusterId = inst.cmt && inst.cmt.cluster_id;
            if (clusterId && indexes.by_cluster[clusterId] !== undefined) {
              indexes.by_cluster[clusterId].push(iid);
            }

            // by_document
            addToIndex(indexes.by_document, docId, iid);

            // by_register
            addToIndex(indexes.by_register, register, iid);

            // by_fantasy_type
            const ft = inst.koenigsberg && inst.koenigsberg.fantasy_type;
            if (ft) addToIndex(indexes.by_fantasy_type, ft, iid);

            // by_violence_logic
            const vl = inst.koenigsberg && inst.koenigsberg.violence_logic;
            if (vl) addToIndex(indexes.by_violence_logic, vl, iid);

            // by_absence_flag
            const flags = (inst.koenigsberg && inst.koenigsberg.absence_flags) || [];
            for (const flag of flags) {
              if (indexes.by_absence_flag[flag] !== undefined) {
                indexes.by_absence_flag[flag].push(iid);
              }
            }

            // high_confidence_only
            const conf = inst.meta && inst.meta.confidence;
            if (typeof conf === 'number' && conf >= 0.90) {
              indexes.high_confidence_only.push(iid);
            }

            // suppression_instances
            if (inst.meta && inst.meta.suppression_flag === true) {
              indexes.suppression_instances.push(iid);
            }
          }
        }
      }
    }

    console.log(`  ${docId}: ${docInstanceCount} instances`);
  }

  // Load existing concordance to preserve pipeline_log
  let existingLog = [];
  if (fs.existsSync(CONCORDANCE_PATH)) {
    try {
      const existing = JSON.parse(fs.readFileSync(CONCORDANCE_PATH, 'utf8'));
      existingLog = existing.pipeline_log || [];
    } catch (_) {}
  }

  existingLog.push({
    stage: 5,
    agent: 'build_concordance.js',
    date: new Date().toISOString().split('T')[0],
    total_instances: allInstances.length,
    documents_processed: processedDocIds.size
  });

  const concordance = {
    version: '1.0',
    generated: new Date().toISOString().split('T')[0],
    corpus_version: '1.0',
    status: allInstances.length > 0 ? 'complete' : 'stub',
    total_documents: processedDocIds.size,
    total_sentences: totalSentences,
    total_instances: allInstances.length,
    instances: allInstances,
    indexes,
    pipeline_log: existingLog
  };

  fs.writeFileSync(CONCORDANCE_PATH, JSON.stringify(concordance, null, 2));

  console.log(`\n✓ Concordance written to data/concordance.json`);
  console.log(`  Total documents processed: ${processedDocIds.size}`);
  console.log(`  Total sentences scanned:   ${totalSentences}`);
  console.log(`  Total instances indexed:   ${allInstances.length}`);
  console.log(`  High-confidence (≥0.90):   ${indexes.high_confidence_only.length}`);
  console.log(`  Suppression instances:     ${indexes.suppression_instances.length}`);
}

main();
