#!/usr/bin/env node
// Builds curated claim-to-source audit trails from Stage 4A evidence records.
'use strict';

const fs = require('fs');
const path = require('path');
const { generatedDateForFile } = require('./generated_metadata');

const ROOT = path.resolve(__dirname, '..');
const EVIDENCE_PATH = path.join(ROOT, 'data', 'evidence', 'annotation-evidence.json');
const CONTROLLED_PATH = path.join(ROOT, 'analysis', 'controlled-analysis.json');
const OUTPUT_DIR = path.join(ROOT, 'data', 'audit');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'claim-audit.json');
const OUTPUT_MD = path.join(ROOT, 'synthesis', 'claim_audit.md');

const CLAIMS = [
  {
    id: 'CLAIM-001',
    title: 'Enslaved people and Black soldiers are structurally present but usually absent as agents',
    statement: 'Lincoln repeatedly makes enslaved and freed Black Americans structurally necessary to the target domain while withholding the agentive roles created by the metaphor entailments.',
    filter: record => hasFlag(record, 'enslaved_people_non_agent') || hasFlag(record, 'black_soldiers_erased'),
    selected_audit_ids: ['inst_00003', 'inst_00004', 'inst_00011', 'inst_00012', 'inst_00024', 'inst_00026', 'inst_00059'],
    controlled_note: 'The full matching universe is absence-flag based. Conkling Letter inst_00059 is included as a limiting case because it partially acknowledges Black soldiers in a semi-public register.'
  },
  {
    id: 'CLAIM-002',
    title: 'Disease-and-purification logic is structurally absent from Lincoln',
    statement: 'Lincoln uses body, wound, cancer, providence, and sacrificial language, but the corpus has no instance in which a social group becomes a pathogen requiring purifying elimination.',
    filter: record => hasFlag(record, 'disease_purification_absent'),
    selected_audit_ids: ['inst_00108', 'inst_00132', 'inst_00004', 'inst_00022', 'inst_00026'],
    controlled_note: 'The selected records show both direct disease-language tests and later high-stakes war-meaning contexts where purification logic remains absent.'
  },
  {
    id: 'CLAIM-003',
    title: 'The founding-fathers frame terminates as providence becomes the late-war warrant',
    statement: 'Cluster 05 supplies the anti-extension inheritance argument, reaches its final attestation at Gettysburg, and is replaced in the late war by providence/theodicy as the ground of meaning.',
    filter: record => record.cmt.cluster_id === 'cluster_05_fathers_inheritance' || record.cmt.cluster_id === 'cluster_06_providence_theodicy',
    selected_audit_ids: ['inst_00001', 'inst_00020', 'inst_00021', 'inst_00022', 'inst_00034', 'inst_00060'],
    controlled_note: 'The full universe combines all cluster_05 and cluster_06 records; the selected records focus on the Gettysburg hinge, Hodges Letter, Conkling Letter, and Second Inaugural.'
  },
  {
    id: 'CLAIM-004',
    title: 'The obligatory frame makes violence feel required rather than chosen',
    statement: 'Across clusters, metaphor entailments convert war from policy choice into obligation: wounds demand healing, oaths demand fulfillment, experiments demand completion, debts demand payment, and Providence demands submission.',
    filter: record => record.koenigsberg.obligatory_frame === true,
    selected_audit_ids: ['inst_00004', 'inst_00025', 'inst_00078', 'inst_00132', 'inst_00020', 'inst_00060'],
    controlled_note: 'The matching universe is every Stage 4A record with obligatory_frame true; selected rows show the mechanism across multiple clusters.'
  },
  {
    id: 'CLAIM-005',
    title: 'The Second Inaugural condenses wound, oath, and providence into reconciliation logic',
    statement: 'The Second Inaugural strips the metaphor system to national body, oath/work, and divine punishment; those frames authorize continued violence while preserving an exit through healing and completed punishment.',
    filter: record => record.document.id === 'doc_021',
    selected_audit_ids: ['inst_00016', 'inst_00020', 'inst_00021', 'inst_00022', 'inst_00025', 'inst_00026'],
    controlled_note: 'The full universe is all Second Inaugural Stage 4A records. The selected rows emphasize the address\'s core body/providence/oath chain.'
  },
  {
    id: 'CLAIM-006',
    title: 'Lincoln differs from purification-based political pathology by preserving exit conditions',
    statement: 'Lincoln shares body projection, sacrifice, obligation, and ancestral debt with dangerous political rhetoric, but his fantasy types terminate: wounds heal, oaths are fulfilled, propositions are proven, debts are paid, and divine punishment ends.',
    filter: record => record.koenigsberg.fantasy_type !== 'disease_and_purification',
    selected_audit_ids: ['inst_00026', 'inst_00011', 'inst_00025', 'inst_00001', 'inst_00021', 'inst_00012', 'inst_00132'],
    controlled_note: 'The matching universe is the full Stage 4A corpus because no record has disease_and_purification. Selected rows represent the exit condition associated with each major fantasy type.'
  }
];

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function today() {
  return generatedDateForFile(OUTPUT_JSON);
}

function hasFlag(record, flag) {
  return (record.agency_absence.absence_flags || []).includes(flag);
}

function countBy(records, getValue) {
  const counts = {};
  for (const record of records) {
    const value = getValue(record) || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function countFlags(records) {
  const counts = {};
  for (const record of records) {
    for (const flag of record.agency_absence.absence_flags || []) {
      counts[flag] = (counts[flag] || 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function compactRecord(record) {
  return {
    audit_id: record.audit_id,
    cluster_id: record.cmt.cluster_id,
    cmt_mapping: record.cmt.mapping || `${record.cmt.source_domain} -> ${record.cmt.target_domain}`,
    lexical_unit: record.lexical_unit.text,
    mipvu_decision: record.lexical_unit.mipvu_decision,
    sentence_id: record.location.sentence_id,
    sentence_text: record.location.sentence_text,
    document: {
      id: record.document.id,
      short_title: record.document.short_title,
      date: record.document.date,
      period: record.document.period,
      register: record.document.register,
      authorship_confidence: record.document.authorship_confidence,
      source_edition: record.document.source_edition,
      source_url: record.document.source_url
    },
    koenigsberg: {
      fantasy_type: record.koenigsberg.fantasy_type,
      violence_logic: record.koenigsberg.violence_logic,
      obligatory_frame: record.koenigsberg.obligatory_frame,
      absence_flags: record.agency_absence.absence_flags
    },
    confidence: record.confidence.score
  };
}

function makeAuditClaim(definition, recordsById, allRecords, controlled) {
  const matchingRecords = allRecords.filter(definition.filter);
  const selectedRecords = definition.selected_audit_ids.map(auditId => {
    const record = recordsById.get(auditId);
    if (!record) throw new Error(`${definition.id}: missing selected audit id ${auditId}`);
    return compactRecord(record);
  });

  return {
    claim_id: definition.id,
    title: definition.title,
    statement: definition.statement,
    audit_chain_format: 'claim -> cluster -> CMT mapping -> lexical unit -> MIPVU decision -> instance ID -> sentence ID -> document metadata -> source text',
    evidence_universe: {
      matching_record_count: matchingRecords.length,
      matching_audit_ids: matchingRecords.map(record => record.audit_id),
      by_cluster: countBy(matchingRecords, record => record.cmt.cluster_id),
      by_document: countBy(matchingRecords, record => record.document.id),
      by_register: countBy(matchingRecords, record => record.document.register),
      by_period: countBy(matchingRecords, record => record.document.period),
      absence_flags: countFlags(matchingRecords)
    },
    selected_records: selectedRecords,
    controlled_note: definition.controlled_note,
    controlled_reference: {
      file: 'analysis/controlled-analysis.json',
      full_corpus_records: controlled.subsets.find(subset => subset.name === 'full_corpus').total_instances,
      high_authorship_confidence_records: controlled.subsets.find(subset => subset.name === 'high_authorship_confidence_0_95').total_instances
    }
  };
}

function escapeCell(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/\n/g, ' ')
    .replace(/\|/g, '\\|');
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.map(escapeCell).join(' | ')} |`)
  ].join('\n');
}

function writeMarkdown(audit) {
  const lines = [
    '---',
    'title: "Claim-To-Source Audit"',
    'draft: false',
    '---',
    '',
    'This page is generated by `npm run audit:claims` from `data/evidence/annotation-evidence.json`. It gives reviewers compact evidence chains for the major interpretive claims in the synthesis pages.',
    '',
    'Audit-chain format:',
    '',
    '```text',
    'scholarly claim -> metaphor cluster -> CMT mapping -> metaphor-related lexical unit -> instance ID -> sentence ID -> document metadata -> source text',
    '```',
    '',
    'The public page shows selected records for readability. The complete matching audit IDs for each claim are preserved in `data/audit/claim-audit.json`.',
    ''
  ];

  for (const claim of audit.claims) {
    lines.push(`## ${claim.claim_id}: ${claim.title} {#${claim.claim_id.toLowerCase()}}`);
    lines.push('');
    lines.push(claim.statement);
    lines.push('');
    lines.push(`Matching Stage 4A records: ${claim.evidence_universe.matching_record_count}. ${claim.controlled_note}`);
    lines.push('');
    lines.push(markdownTable(
      ['Audit ID', 'Document', 'Date', 'Register', 'Cluster', 'Lexical unit', 'Sentence ID', 'Source'],
      claim.selected_records.map(record => [
        record.audit_id,
        record.document.short_title,
        record.document.date,
        record.document.register,
        record.cluster_id,
        record.lexical_unit,
        record.sentence_id,
        `[source](${record.document.source_url})`
      ])
    ));
    lines.push('');
  }

  fs.writeFileSync(OUTPUT_MD, lines.join('\n') + '\n');
}

function main() {
  const evidence = readJSON(EVIDENCE_PATH);
  const controlled = readJSON(CONTROLLED_PATH);
  const records = evidence.records || [];
  const recordsById = new Map(records.map(record => [record.audit_id, record]));

  const claims = CLAIMS.map(definition => makeAuditClaim(definition, recordsById, records, controlled));
  const audit = {
    version: '1.0',
    generated: today(),
    status: 'complete',
    source: 'data/evidence/annotation-evidence.json',
    controlled_source: 'analysis/controlled-analysis.json',
    total_claims: claims.length,
    claims,
    pipeline_log: [
      {
        stage: '8',
        agent: 'build_claim_audit.js',
        date: today(),
        total_claims: claims.length
      }
    ]
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(audit, null, 2) + '\n');
  writeMarkdown(audit);

  console.log(`Claim audit written to ${path.relative(ROOT, OUTPUT_JSON)}`);
  console.log(`Claim audit page written to ${path.relative(ROOT, OUTPUT_MD)}`);
  console.log(`Claims exported: ${claims.length}`);
}

main();
