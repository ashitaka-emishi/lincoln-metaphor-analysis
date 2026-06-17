#!/usr/bin/env node
// Builds register- and authorship-confidence-controlled analysis outputs.
'use strict';

const fs = require('fs');
const path = require('path');
const { generatedDateForFile } = require('./generated_metadata');
const { CLUSTERS } = require('./schema_constants');

const ROOT = path.resolve(__dirname, '..');
const EVIDENCE_PATH = path.join(ROOT, 'data', 'evidence', 'annotation-evidence.json');
const OUTPUT_JSON = path.join(ROOT, 'analysis', 'controlled-analysis.json');
const OUTPUT_MD = path.join(ROOT, 'analysis', 'controlled_outputs.md');

const CONTROLLED_CLUSTERS = CLUSTERS.map(cluster => [cluster.id, cluster.short_label]);

const ABSENCE_FLAGS = [
  'disease_purification_absent',
  'enslaved_people_non_agent',
  'lincoln_non_agent',
  'black_soldiers_erased',
  'death_abstracted',
  'confederates_depersonalized',
  'women_absent'
];

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function today() {
  return generatedDateForFile(OUTPUT_JSON);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function countRecords(records, getKey, keys) {
  const counts = Object.fromEntries(keys.map(key => [key, 0]));
  for (const record of records) {
    const key = getKey(record);
    if (counts[key] !== undefined) counts[key]++;
  }
  return counts;
}

function countFlags(records, flags) {
  const counts = Object.fromEntries(flags.map(flag => [flag, 0]));
  for (const record of records) {
    for (const flag of record.agency_absence.absence_flags || []) {
      if (counts[flag] !== undefined) counts[flag]++;
    }
  }
  return counts;
}

function countDocuments(records) {
  return new Set(records.map(record => record.document.id)).size;
}

function makeClusterRows(records, groupField) {
  const groups = unique(records.map(record => {
    if (groupField === 'register') return record.document.register;
    if (groupField === 'period') return record.document.period;
    if (groupField === 'document') return record.document.id;
    return null;
  }));

  return groups.map(group => {
    const groupRecords = records.filter(record => {
      if (groupField === 'register') return record.document.register === group;
      if (groupField === 'period') return record.document.period === group;
      if (groupField === 'document') return record.document.id === group;
      return false;
    });
    const counts = countRecords(groupRecords, record => record.cmt.cluster_id, CONTROLLED_CLUSTERS.map(([id]) => id));
    const first = groupRecords[0];
    return {
      group,
      total_instances: groupRecords.length,
      document_count: countDocuments(groupRecords),
      metadata: groupField === 'document' && first ? {
        short_title: first.document.short_title,
        date: first.document.date,
        period: first.document.period,
        register: first.document.register,
        authorship_confidence: first.document.authorship_confidence
      } : null,
      counts
    };
  });
}

function makeAbsenceRows(records, groupField) {
  const groups = unique(records.map(record => {
    if (groupField === 'register') return record.document.register;
    if (groupField === 'period') return record.document.period;
    if (groupField === 'document') return record.document.id;
    return null;
  }));

  return groups.map(group => {
    const groupRecords = records.filter(record => {
      if (groupField === 'register') return record.document.register === group;
      if (groupField === 'period') return record.document.period === group;
      if (groupField === 'document') return record.document.id === group;
      return false;
    });
    const counts = countFlags(groupRecords, ABSENCE_FLAGS);
    return {
      group,
      total_instances: groupRecords.length,
      total_absence_flags: Object.values(counts).reduce((sum, n) => sum + n, 0),
      document_count: countDocuments(groupRecords),
      counts
    };
  });
}

function makeSubset(name, description, records) {
  return {
    name,
    description,
    total_instances: records.length,
    total_documents: countDocuments(records),
    cluster_totals: countRecords(records, record => record.cmt.cluster_id, CONTROLLED_CLUSTERS.map(([id]) => id)),
    absence_totals: countFlags(records, ABSENCE_FLAGS),
    cluster_by_register: makeClusterRows(records, 'register'),
    cluster_by_period: makeClusterRows(records, 'period'),
    cluster_by_document: makeClusterRows(records, 'document'),
    absence_by_register: makeAbsenceRows(records, 'register'),
    absence_by_period: makeAbsenceRows(records, 'period'),
    absence_by_document: makeAbsenceRows(records, 'document')
  };
}

function markdownTable(headers, rows) {
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`
  ];
  for (const row of rows) {
    lines.push(`| ${row.map(value => value === null || value === undefined ? '' : String(value)).join(' | ')} |`);
  }
  return lines.join('\n');
}

function clusterTable(rows) {
  const headers = ['Group', 'Docs', 'Total', ...CONTROLLED_CLUSTERS.map(([, label]) => label)];
  const body = rows.map(row => [
    row.group,
    row.document_count,
    row.total_instances,
    ...CONTROLLED_CLUSTERS.map(([id]) => row.counts[id])
  ]);
  return markdownTable(headers, body);
}

function absenceTable(rows) {
  const headers = ['Group', 'Docs', 'Instances', 'Absence flags', ...ABSENCE_FLAGS];
  const body = rows.map(row => [
    row.group,
    row.document_count,
    row.total_instances,
    row.total_absence_flags,
    ...ABSENCE_FLAGS.map(flag => row.counts[flag])
  ]);
  return markdownTable(headers, body);
}

function subsetSummaryTable(subsets) {
  const headers = ['Subset', 'Documents', 'Instances', ...CONTROLLED_CLUSTERS.map(([, label]) => label)];
  const body = subsets.map(subset => [
    subset.name,
    subset.total_documents,
    subset.total_instances,
    ...CONTROLLED_CLUSTERS.map(([id]) => subset.cluster_totals[id])
  ]);
  return markdownTable(headers, body);
}

function documentClusterTable(rows) {
  const headers = ['Document', 'Title', 'Register', 'Period', 'Authorship conf.', 'Total', ...CONTROLLED_CLUSTERS.map(([, label]) => label)];
  const body = rows.map(row => [
    row.group,
    row.metadata.short_title,
    row.metadata.register,
    row.metadata.period,
    row.metadata.authorship_confidence,
    row.total_instances,
    ...CONTROLLED_CLUSTERS.map(([id]) => row.counts[id])
  ]);
  return markdownTable(headers, body);
}

function writeMarkdown(output) {
  const full = output.subsets.find(subset => subset.name === 'full_corpus');
  const high = output.subsets.find(subset => subset.name === 'high_authorship_confidence_0_95');

  const md = [
    '---',
    'title: "Controlled Analysis Outputs"',
    'draft: false',
    '---',
    '',
    '# Controlled Analysis Outputs',
    '',
    'These tables are generated from the Stage 4A evidence-chain file by `npm run analysis:controlled`. They are the publication-control layer for aggregate claims: raw counts remain useful, but register and authorship-confidence controls determine how strong a claim can be.',
    '',
    'The high-confidence subset is defined as documents with `authorship_confidence >= 0.95`. This is an authorship-confidence filter, not the Stage 4 annotation-confidence filter.',
    '',
    '## Subset Summary',
    '',
    subsetSummaryTable(output.subsets),
    '',
    '## Cluster Distribution By Register',
    '',
    '### Full Corpus',
    '',
    clusterTable(full.cluster_by_register),
    '',
    '### High-Authorship-Confidence Subset',
    '',
    clusterTable(high.cluster_by_register),
    '',
    '## Cluster Distribution By Period',
    '',
    '### Full Corpus',
    '',
    clusterTable(full.cluster_by_period),
    '',
    '### High-Authorship-Confidence Subset',
    '',
    clusterTable(high.cluster_by_period),
    '',
    '## Cluster Distribution By Document',
    '',
    documentClusterTable(full.cluster_by_document),
    '',
    '## Absence Flags By Register',
    '',
    '### Full Corpus',
    '',
    absenceTable(full.absence_by_register),
    '',
    '### High-Authorship-Confidence Subset',
    '',
    absenceTable(high.absence_by_register),
    '',
    '## Absence Flags By Period',
    '',
    '### Full Corpus',
    '',
    absenceTable(full.absence_by_period),
    '',
    '### High-Authorship-Confidence Subset',
    '',
    absenceTable(high.absence_by_period),
    '',
    '## Interpretation Rule',
    '',
    'Use the full-corpus count to describe what is present in the annotated corpus. Use register and high-authorship-confidence tables to decide whether a claim is stable enough for publication. If a pattern disappears under the high-confidence subset or is concentrated in one register, the prose should name that limitation.'
  ].join('\n');

  fs.writeFileSync(OUTPUT_MD, md + '\n');
}

function main() {
  const evidence = readJSON(EVIDENCE_PATH);
  const records = evidence.records || [];
  const highConfidenceRecords = records.filter(record => record.document.authorship_confidence >= 0.95);

  const output = {
    version: '1.0',
    generated: today(),
    status: 'complete',
    source: 'data/evidence/annotation-evidence.json',
    confidence_threshold: {
      field: 'document.authorship_confidence',
      operator: '>=',
      value: 0.95
    },
    subsets: [
      makeSubset('full_corpus', 'All Stage 4A evidence-chain records.', records),
      makeSubset('high_authorship_confidence_0_95', 'Records from documents with authorship_confidence >= 0.95.', highConfidenceRecords)
    ],
    interpretation_rule: 'Raw counts are descriptive; publication claims must be checked against register distribution and the high-authorship-confidence subset.',
    pipeline_log: [
      {
        stage: '6A',
        agent: 'build_controlled_analysis.js',
        date: today(),
        total_records: records.length,
        high_authorship_confidence_records: highConfidenceRecords.length
      }
    ]
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2) + '\n');
  writeMarkdown(output);

  console.log(`Controlled analysis written to ${path.relative(ROOT, OUTPUT_JSON)}`);
  console.log(`Controlled analysis page written to ${path.relative(ROOT, OUTPUT_MD)}`);
  console.log(`Full corpus records: ${records.length}`);
  console.log(`High-authorship-confidence records: ${highConfidenceRecords.length}`);
}

main();
