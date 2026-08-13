#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { assertCorpusV4WritePath, writeFile: guardedWriteFile } = require('./write-guard');

const ROOT = path.resolve(__dirname, '..', '..');
const CREATED_DATE = '2026-08-13';

const DEFAULT_PATHS = {
  coreInventory: 'data/corpus/corpus-v4-core-inventory.json',
  validationInventory: 'data/corpus/corpus-v4-validation-inventory.json',
  metadata: 'data/corpus/corpus-v4-document-metadata.json',
  summary: 'data/corpus/corpus-v4-coverage-summary.json',
  report: 'docs/corpus/corpus-v4-coverage-report.md'
};

const CLAIM_AREAS = [
  {
    key: 'slavery_emancipation',
    title: 'Slavery and Emancipation Coverage',
    terms: ['slavery', 'emancipation', 'free_soil', 'colonization', 'dred_scott', 'labor_and_slavery'],
    minimumCore: 8,
    supportLabel: 'race, agency, and emancipation claims'
  },
  {
    key: 'war_powers',
    title: 'War Powers Coverage',
    terms: ['war_powers', 'civil_liberties', 'military_authority', 'military_command', 'wartime_governance', 'executive_policy'],
    minimumCore: 5,
    supportLabel: 'war-powers claims'
  },
  {
    key: 'sacrifice_mourning',
    title: 'Sacrifice and Mourning Coverage',
    terms: ['sacrifice', 'mourning', 'condolence', 'providential_grief'],
    minimumCore: 3,
    supportLabel: 'sacrifice and mourning claims'
  },
  {
    key: 'providence',
    title: 'Providence Coverage',
    terms: ['providence', 'providential', 'theodicy', 'religious'],
    minimumCore: 3,
    supportLabel: 'providence claims'
  },
  {
    key: 'race_black_military_agency',
    title: 'Race and Black Military Agency Coverage',
    terms: ['black_soldier', 'black_suffrage', 'african_american', 'racial', 'race'],
    minimumCore: 2,
    supportLabel: 'race and Black military agency claims'
  },
  {
    key: 'disease_purification_negative_check',
    title: 'Disease/Purification Negative-Check Coverage',
    terms: ['negative_findings', 'disease', 'purification'],
    minimumCore: 1,
    supportLabel: 'disease/purification negative-check claims'
  }
];

function absolute(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(ROOT, inputPath);
}

function displayPath(inputPath) {
  if (path.isAbsolute(inputPath)) {
    const relative = path.relative(ROOT, inputPath);
    return relative.startsWith('..') ? inputPath : relative;
  }
  return inputPath;
}

function pathIsInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function stableJSON(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readJSON(inputPath) {
  return JSON.parse(fs.readFileSync(absolute(inputPath), 'utf8'));
}

function parseArgs(argv) {
  const options = {
    check: false,
    json: false,
    paths: { ...DEFAULT_PATHS }
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (!Object.prototype.hasOwnProperty.call(options.paths, key)) {
        throw new Error(`Unknown option ${arg}`);
      }
      index += 1;
      if (!argv[index]) {
        throw new Error(`${arg} requires a path`);
      }
      options.paths[key] = argv[index];
    }
  }

  return options;
}

function assertAllowedOutput(outputPath) {
  const target = absolute(outputPath);
  assertCorpusV4WritePath(target);
  if (!pathIsInside(ROOT, target)) {
    return;
  }

  const relative = path.relative(ROOT, target);
  const allowed = relative === DEFAULT_PATHS.summary || relative === DEFAULT_PATHS.report;
  if (!allowed) {
    throw new Error(`Refusing to write undeclared v4 coverage output path: ${relative}`);
  }
  if (relative.startsWith('corpus/raw/') || relative.startsWith('corpus/segmented/') || relative.startsWith('corpus/annotated/')) {
    throw new Error(`Refusing to write corpus source or annotation path: ${relative}`);
  }
}

function uniqueByDocId(records) {
  const byId = new Map();
  for (const record of records) {
    byId.set(record.doc_id, record);
  }
  return Array.from(byId.values()).sort((a, b) => a.doc_id.localeCompare(b.doc_id, 'en'));
}

function tierRecords(metadata) {
  return {
    core: uniqueByDocId(metadata.documents.filter(record => record.included_in_v4_core)),
    validation: uniqueByDocId(metadata.documents.filter(record => record.included_in_v4_validation)),
    reference: uniqueByDocId(metadata.documents.filter(record => record.included_in_v4_reference))
  };
}

function valueList(record, field) {
  const value = record[field];
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value] : [];
}

function countValues(records, field) {
  const counts = new Map();
  for (const record of records) {
    for (const value of valueList(record, field)) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'en'));
}

function coverageByTier(tiers, field) {
  const allValues = new Set();
  for (const records of Object.values(tiers)) {
    for (const item of countValues(records, field)) {
      allValues.add(item.value);
    }
  }

  return Array.from(allValues)
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map(value => {
      const row = { value };
      for (const [tier, records] of Object.entries(tiers)) {
        row[tier] = records.filter(record => valueList(record, field).includes(value)).length;
      }
      row.total = row.core + row.validation + row.reference;
      return row;
    })
    .sort((a, b) => b.total - a.total || a.value.localeCompare(b.value, 'en'));
}

function distributionSummary(rows) {
  if (rows.length === 0) {
    return { overrepresented: [], underrepresented: [] };
  }
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const average = total / rows.length;
  return {
    overrepresented: rows
      .filter(row => row.total >= Math.max(3, average * 1.5))
      .map(row => row.value),
    underrepresented: rows
      .filter(row => row.total <= Math.max(1, average * 0.5))
      .map(row => row.value)
  };
}

function recordMatchesClaim(record, area) {
  const haystack = [
    record.period,
    record.genre,
    record.audience,
    ...(record.rhetorical_function || []),
    ...(record.research_relevance || []),
    record.selection_rationale || '',
    record.provenance_notes || ''
  ].join(' ').toLowerCase();
  return area.terms.some(term => haystack.includes(term.toLowerCase()));
}

function claimCoverage(tiers) {
  return CLAIM_AREAS.map(area => {
    const tierCounts = {};
    const examples = {};
    for (const [tier, records] of Object.entries(tiers)) {
      const matches = records.filter(record => recordMatchesClaim(record, area));
      tierCounts[tier] = matches.length;
      examples[tier] = matches.slice(0, 6).map(record => ({
        doc_id: record.doc_id,
        short_title: record.short_title,
        date: record.date
      }));
    }

    const coreSupport = tierCounts.core >= area.minimumCore ? 'supported_for_core_claims' : 'limited_for_core_claims';
    const validationSupport = tierCounts.validation >= area.minimumCore ? 'supported_for_validation_checks' : 'limited_for_validation_checks';
    return {
      key: area.key,
      title: area.title,
      support_label: area.supportLabel,
      tier_counts: tierCounts,
      assessment: coreSupport === 'supported_for_core_claims' && validationSupport === 'supported_for_validation_checks'
        ? 'supports_claims_with_tier_limits'
        : 'requires_caution_or_follow_up',
      core_support: coreSupport,
      validation_support: validationSupport,
      examples
    };
  });
}

function buildSummary(paths) {
  const coreInventory = readJSON(paths.coreInventory);
  const validationInventory = readJSON(paths.validationInventory);
  const metadata = readJSON(paths.metadata);
  const tiers = tierRecords(metadata);
  const distributions = {};
  for (const field of ['period', 'genre', 'audience', 'rhetorical_function', 'research_relevance']) {
    const rows = coverageByTier(tiers, field);
    distributions[field] = {
      rows,
      ...distributionSummary(rows)
    };
  }

  return {
    coverage_id: 'corpus_v4_coverage_summary',
    corpus_version: 'v4',
    created_date: CREATED_DATE,
    status: 'pass',
    inputs: {
      core_inventory: displayPath(paths.coreInventory),
      validation_inventory: displayPath(paths.validationInventory),
      document_metadata: displayPath(paths.metadata)
    },
    outputs: {
      summary: displayPath(paths.summary),
      report: displayPath(paths.report)
    },
    source_counts: {
      core_inventory_documents: coreInventory.document_count,
      validation_inventory_documents: validationInventory.document_count,
      metadata_documents: metadata.document_count
    },
    tier_counts: {
      core: tiers.core.length,
      validation: tiers.validation.length,
      reference: tiers.reference.length,
      v1_preserved_in_core: tiers.core.filter(record => record.included_in_v1).length,
      new_core_additions: tiers.core.filter(record => !record.included_in_v1).length
    },
    distributions,
    claim_coverage: claimCoverage(tiers),
    limitations: [
      'The v4 core is the interpretive corpus; validation records widen denominator checks but are not fully Stage 4A annotated.',
      'Reference records are search-only leads and cannot by themselves support coded interpretive claims.',
      'The validation raw-text directory is not fully populated yet, so validation coverage is metadata-level until later ingestion work expands it.'
    ]
  };
}

function markdownEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|');
}

function table(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.map(markdownEscape).join(' | ')} |`)
  ].join('\n');
}

function sentenceForSupport(area) {
  const counts = area.tier_counts;
  if (area.assessment === 'supports_claims_with_tier_limits') {
    return `The corpus supports ${area.support_label} with tier limits: ${counts.core} core records and ${counts.validation} validation records match this category, while ${counts.reference} reference records provide search leads only.`;
  }
  return `The corpus supports only cautious ${area.support_label}: ${counts.core} core records, ${counts.validation} validation records, and ${counts.reference} reference records match this category.`;
}

function renderDistributionSection(title, distribution) {
  const rows = distribution.rows.map(row => [row.value, row.core, row.validation, row.reference, row.total]);
  return [
    `## ${title}`,
    '',
    table(['Stratum', 'Core', 'Validation', 'Reference', 'Total'], rows),
    '',
    `Overrepresented strata: ${distribution.overrepresented.length ? distribution.overrepresented.join(', ') : 'none flagged by threshold'}.`,
    '',
    `Underrepresented strata: ${distribution.underrepresented.length ? distribution.underrepresented.join(', ') : 'none flagged by threshold'}.`
  ].join('\n');
}

function renderClaimSection(area) {
  const exampleRows = Object.entries(area.examples).flatMap(([tier, records]) => (
    records.map(record => [tier, record.doc_id, record.short_title, record.date])
  ));
  return [
    `## ${area.title}`,
    '',
    sentenceForSupport(area),
    '',
    table(['Tier', 'Doc ID', 'Short Title', 'Date'], exampleRows.length ? exampleRows : [['none', '', '', '']])
  ].join('\n');
}

function renderMarkdown(summary) {
  const tierRows = [
    ['Core interpretive corpus', summary.tier_counts.core, 'Fully selected v4 core; preserves v1 and adds 20 priority texts.'],
    ['Validation corpus', summary.tier_counts.validation, 'Wider denominator for validation checks; not a second fully annotated core.'],
    ['Reference corpus', summary.tier_counts.reference, 'Search-only leads; not coded interpretive evidence.']
  ];

  return [
    '# V4 Corpus Coverage Report',
    '',
    'Generated from v4 corpus inventory and metadata JSON. The report distinguishes the fully selected core, the extended validation denominator, and the search-only reference tier.',
    '',
    '## Summary',
    '',
    table(['Measure', 'Count'], [
      ['Core documents', summary.tier_counts.core],
      ['Preserved v1 documents in core', summary.tier_counts.v1_preserved_in_core],
      ['New v4 core additions', summary.tier_counts.new_core_additions],
      ['Validation documents', summary.tier_counts.validation],
      ['Reference documents', summary.tier_counts.reference]
    ]),
    '',
    'The core tier supports interpretive claims. The validation tier supports coverage and denominator checks. The reference tier supports discovery only.',
    '',
    '## Corpus Tiers',
    '',
    table(['Tier', 'Documents', 'Evidentiary Role'], tierRows),
    '',
    renderDistributionSection('Coverage by Period', summary.distributions.period),
    '',
    renderDistributionSection('Coverage by Genre', summary.distributions.genre),
    '',
    renderDistributionSection('Coverage by Audience', summary.distributions.audience),
    '',
    renderDistributionSection('Coverage by Rhetorical Function', summary.distributions.rhetorical_function),
    '',
    renderDistributionSection('Coverage by Research Relevance', summary.distributions.research_relevance),
    '',
    ...summary.claim_coverage.flatMap(area => [renderClaimSection(area), '']),
    '## Gaps and Limitations',
    '',
    ...summary.limitations.map(item => `- ${item}`)
  ].join('\n').trimEnd() + '\n';
}

function writeOutput(outputPath, contents, options) {
  assertAllowedOutput(outputPath);
  const target = absolute(outputPath);
  const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (options.check) {
    if (existing !== contents) {
      throw new Error(`${displayPath(outputPath)} is stale; rerun scripts/corpus/generate-corpus-coverage-report.js`);
    }
    return false;
  }
  guardedWriteFile(target, contents);
  return existing !== contents;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = buildSummary(options.paths);
  const markdown = renderMarkdown(summary);
  const changed = [
    writeOutput(options.paths.summary, stableJSON(summary), options),
    writeOutput(options.paths.report, markdown, options)
  ].some(Boolean);

  if (options.json) {
    console.log(JSON.stringify({ status: summary.status, changed, summary: summary.tier_counts }, null, 2));
  } else {
    console.log(`V4 corpus coverage report: ${summary.status}`);
    console.log(`Core: ${summary.tier_counts.core}; validation: ${summary.tier_counts.validation}; reference: ${summary.tier_counts.reference}`);
    console.log(`${options.check ? 'Checked' : 'Wrote'} ${displayPath(options.paths.summary)} and ${displayPath(options.paths.report)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSummary,
  renderMarkdown,
  parseArgs
};
