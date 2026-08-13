#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { assertCorpusV4WritePath, writeFile: guardedWriteFile } = require('./write-guard');

const ROOT = path.resolve(__dirname, '..', '..');
const CREATED_DATE = '2026-08-13';

const DEFAULT_PATHS = {
  manifest: 'corpus/corpus_manifest.json',
  v1Inventory: 'data/corpus/corpus-v1-inventory.json',
  coreInventory: 'data/corpus/corpus-v4-core-inventory.json',
  validationInventory: 'data/corpus/corpus-v4-validation-inventory.json',
  coverageSummary: 'data/corpus/corpus-v4-coverage-summary.json',
  reportJson: 'data/corpus/corpus-v4-expansion-impact-report.json',
  reportMarkdown: 'docs/corpus/corpus-v4-expansion-impact-report.md'
};

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
  const allowed = new Set([
    DEFAULT_PATHS.v1Inventory,
    DEFAULT_PATHS.reportJson,
    DEFAULT_PATHS.reportMarkdown
  ]);
  if (!allowed.has(relative)) {
    throw new Error(`Refusing to write undeclared v4 impact output path: ${relative}`);
  }
  if (relative.startsWith('corpus/raw/') || relative.startsWith('corpus/segmented/') || relative.startsWith('corpus/annotated/')) {
    throw new Error(`Refusing to write corpus source or annotation path: ${relative}`);
  }
}

function yearFromDate(value) {
  const match = String(value || '').match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function normalizePeriod(record) {
  const year = yearFromDate(record.date);
  if (!year) {
    return record.period || 'unknown';
  }
  if (record.date >= '1865-04-11') {
    return 'reconstruction_transition';
  }
  if (year >= 1864) {
    return 'late_war';
  }
  if (record.date >= '1862-08-01') {
    return 'emancipation';
  }
  if (record.date >= '1861-04-12') {
    return 'early_war';
  }
  if (record.date >= '1860-11-06') {
    return 'secession_crisis';
  }
  if (year >= 1854) {
    return 'antebellum';
  }
  return 'early';
}

function normalizeGenre(value) {
  const genreMap = {
    lyceum_address: 'speech',
    house_divided_speech: 'speech',
    public_address: 'speech',
    debate_speech: 'speech',
    debate: 'speech',
    campaign_speech: 'speech',
    inaugural_address: 'speech',
    dedication_address: 'speech',
    commemorative_address: 'speech',
    convention_address: 'speech',
    election_serenade_response: 'speech',
    eulogy: 'speech',
    farewell_address: 'speech',
    lecture_address: 'speech',
    reconstruction_address: 'speech',
    reform_address: 'speech',
    state_paper: 'proclamation',
    annual_message: 'annual_message',
    message_to_congress: 'legal_message',
    public_letter: 'public_letter',
    letter: 'private_letter',
    fragment: 'fragment',
    private_fragment: 'fragment',
    private_memorandum: 'fragment'
  };
  return genreMap[value] || value || 'unknown';
}

function normalizeAudience(record) {
  if (record.audience) {
    return record.audience;
  }
  if (record.genre === 'annual_message') {
    return 'congress';
  }
  if (record.genre === 'letter') {
    return 'private_correspondent';
  }
  return 'public';
}

function buildV1Inventory(manifest, paths) {
  const documents = manifest.documents.map(record => ({
    doc_id: record.id,
    corpus_version: 'v1',
    corpus_tier: 'v1',
    title: record.title,
    short_title: record.short_title,
    date: record.date,
    date_precision: record.date_precision,
    year: yearFromDate(record.date),
    period: normalizePeriod(record),
    original_period: record.period,
    genre: normalizeGenre(record.genre),
    original_genre: record.genre,
    audience: normalizeAudience(record),
    rhetorical_function: [record.register, `v1_priority_${record.analytical_priority}`].filter(Boolean),
    research_relevance: ['v1_preserved_baseline', record.analytical_priority ? `${record.analytical_priority}_priority` : null].filter(Boolean),
    source_authority: 'collected_works_michigan',
    source_url: record.source_url,
    source_citation: record.source_edition || record.source_text,
    edition_notes: record.editorial_status,
    text_status: 'complete',
    authorship_status: record.authorship,
    included_in_v1: true,
    included_in_v4_core: true,
    included_in_v4_validation: true,
    included_in_v4_reference: false,
    annotation_status: record.pipeline_stage_completed >= 4 ? 'fully_annotated' : 'not_annotated',
    provenance_notes: (record.known_limitations || []).join(' ') || record.notes || '',
    selection_rationale: record.inclusion_rationale || record.notes || ''
  })).sort((a, b) => a.doc_id.localeCompare(b.doc_id, 'en'));

  return {
    inventory_id: 'corpus_v1_inventory',
    corpus_version: 'v1',
    created_date: CREATED_DATE,
    description: 'Generated v1 inventory derived from corpus/corpus_manifest.json for v4 expansion impact comparison.',
    source_files: [
      {
        path: displayPath(paths.manifest),
        role: 'canonical_v1_manifest'
      }
    ],
    document_count: documents.length,
    tier_counts: {
      v1: documents.length,
      v4_core: 0,
      v4_validation: 0,
      v4_reference: 0
    },
    documents
  };
}

function countBy(records, field) {
  const counts = new Map();
  for (const record of records) {
    const values = Array.isArray(record[field]) ? record[field] : [record[field]];
    for (const value of values.filter(Boolean)) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return Object.fromEntries(Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], 'en')));
}

function compareField(v1Records, additionRecords, field) {
  const v1Counts = countBy(v1Records, field);
  const additionCounts = countBy(additionRecords, field);
  return Array.from(new Set([...Object.keys(v1Counts), ...Object.keys(additionCounts)]))
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map(value => ({
      value,
      v1: v1Counts[value] || 0,
      v4_core_additions: additionCounts[value] || 0,
      v4_core_total: (v1Counts[value] || 0) + (additionCounts[value] || 0)
    }))
    .sort((a, b) => b.v4_core_additions - a.v4_core_additions || a.value.localeCompare(b.value, 'en'));
}

function rowCount(rows, value) {
  return rows.find(row => row.value === value)?.v4_core_additions || 0;
}

function classifyClaims(coverageSummary) {
  const byKey = new Map(coverageSummary.claim_coverage.map(area => [area.key, area]));

  return {
    strengthened: [
      {
        claim_area: 'Slavery and emancipation',
        basis: `${byKey.get('slavery_emancipation').tier_counts.core} core records and ${byKey.get('slavery_emancipation').tier_counts.validation} validation records now match this area.`
      },
      {
        claim_area: 'Race and Black military agency',
        basis: `${byKey.get('race_black_military_agency').tier_counts.core} core records and ${byKey.get('race_black_military_agency').tier_counts.validation} validation records now match this area.`
      },
      {
        claim_area: 'Register and genre breadth',
        basis: 'The core expansion adds private letters, public letters, annual messages, proclamations, fragments, condolences, and campaign/public speeches.'
      }
    ],
    still_limited: [
      {
        claim_area: 'Currently coded interpretive findings',
        basis: 'Until the v4 additions are fully re-annotated, interpretive claims remain limited to the currently annotated core evidence.'
      },
      {
        claim_area: 'Disease/purification negative finding',
        basis: `${byKey.get('disease_purification_negative_check').tier_counts.core} core records match the metadata-level negative-check proxy, so this absence remains a re-testing target rather than a settled corpus-expansion result.`
      }
    ],
    requiring_retesting: [
      {
        claim_area: 'Metaphor frequency and distribution claims',
        basis: 'The denominator changes from 28 v1 documents to a 48-document v4 core, so counts and proportions must be regenerated before publication claims are updated.'
      },
      {
        claim_area: 'War powers',
        basis: `${byKey.get('war_powers').tier_counts.core} core records and ${byKey.get('war_powers').tier_counts.validation} validation records indicate useful coverage, but the coverage summary still marks this area as caution/follow-up.`
      },
      {
        claim_area: 'Providence and sacrifice',
        basis: 'The added condolence, fragment, and late-war materials broaden the evidence base, but Stage 4A coding is needed before interpretive language changes.'
      }
    ],
    not_supported_by_expansion_alone: [
      {
        claim_area: 'Claims based only on validation or reference records',
        basis: 'The extended validation corpus is lightly annotated, and reference records are search-only leads.'
      },
      {
        claim_area: 'Claims about all Lincoln writings',
        basis: 'V4 improves coverage but remains a curated research corpus, not a complete population of Lincoln texts.'
      },
      {
        claim_area: 'Revised absence claims',
        basis: 'Selection expansion can expose risk, but absence findings require full annotation and concordance-backed re-analysis.'
      }
    ]
  };
}

function buildImpactReport(paths) {
  const manifest = readJSON(paths.manifest);
  const v1Inventory = buildV1Inventory(manifest, paths);
  const coreInventory = readJSON(paths.coreInventory);
  const validationInventory = readJSON(paths.validationInventory);
  const coverageSummary = readJSON(paths.coverageSummary);

  const v1Ids = new Set(v1Inventory.documents.map(record => record.doc_id));
  const coreAdditions = coreInventory.documents.filter(record => !v1Ids.has(record.doc_id));
  const periodExpansion = compareField(v1Inventory.documents, coreAdditions, 'period');
  const genreExpansion = compareField(v1Inventory.documents, coreAdditions, 'genre');
  const audienceExpansion = compareField(v1Inventory.documents, coreAdditions, 'audience');
  const claimImpacts = classifyClaims(coverageSummary);

  return {
    report_id: 'corpus_v4_expansion_impact_report',
    corpus_version: 'v4',
    created_date: CREATED_DATE,
    status: 'pass',
    inputs: {
      v1_inventory: displayPath(paths.v1Inventory),
      core_inventory: displayPath(paths.coreInventory),
      validation_inventory: displayPath(paths.validationInventory),
      coverage_summary: displayPath(paths.coverageSummary)
    },
    generated_from: {
      v1_manifest: displayPath(paths.manifest)
    },
    outputs: {
      report_json: displayPath(paths.reportJson),
      report_markdown: displayPath(paths.reportMarkdown)
    },
    summary: {
      v1_documents: v1Inventory.document_count,
      v4_core_documents: coreInventory.document_count,
      v4_core_additions: coreAdditions.length,
      v4_validation_documents: validationInventory.document_count,
      expansion_statement: `The v4 core expands the baseline from ${v1Inventory.document_count} to ${coreInventory.document_count} core documents and adds a ${validationInventory.document_count}-document validation corpus.`,
      selection_bias_effect: 'reduced_not_eliminated',
      annotation_boundary: 'Claims remain limited to the currently annotated core until v4 additions receive full Stage 4A re-analysis.'
    },
    core_additions: coreAdditions.map(record => ({
      doc_id: record.doc_id,
      short_title: record.short_title,
      date: record.date,
      period: record.period,
      genre: record.genre,
      audience: record.audience,
      research_relevance: record.research_relevance
    })),
    expansion_coverage: {
      period: periodExpansion,
      genre: genreExpansion,
      audience: audienceExpansion,
      added_periods: periodExpansion.filter(row => row.v1 === 0 && row.v4_core_additions > 0).map(row => row.value),
      added_genres: genreExpansion.filter(row => row.v1 === 0 && row.v4_core_additions > 0).map(row => row.value),
      key_added_counts: {
        emancipation_core_additions: rowCount(periodExpansion, 'emancipation'),
        late_war_core_additions: rowCount(periodExpansion, 'late_war'),
        annual_message_core_additions: rowCount(genreExpansion, 'annual_message'),
        condolence_core_additions: rowCount(genreExpansion, 'condolence'),
        private_letter_core_additions: rowCount(genreExpansion, 'private_letter')
      }
    },
    claim_impacts: claimImpacts,
    limitations: [
      'V4 reduces but does not eliminate selection-bias risk.',
      'The v4 core is the full-annotation target; new v4 core additions still require Stage 4A re-analysis before they can revise coded interpretive claims.',
      'The validation corpus is lightly annotated and supports coverage checks, denominator checks, and source-discovery review rather than direct metaphor-count claims.',
      'Reference records remain search-only leads and cannot support claims without later ingestion, segmentation, annotation, and validation.'
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

function bulletList(items) {
  return items.map(item => `- ${item}`).join('\n');
}

function claimBulletList(items) {
  return items.map(item => `- ${item.claim_area}: ${item.basis}`).join('\n');
}

function renderCoverageRows(rows) {
  return table(
    ['Stratum', 'V1', 'V4 Core Additions', 'V4 Core Total'],
    rows.filter(row => row.v4_core_additions > 0 || row.v1 > 0)
      .map(row => [row.value, row.v1, row.v4_core_additions, row.v4_core_total])
  );
}

function renderMarkdown(report) {
  const coreAdditionRows = report.core_additions.map(record => [
    record.doc_id,
    record.short_title,
    record.date,
    record.period,
    record.genre,
    record.audience
  ]);

  return [
    '# V4 Corpus Expansion Impact Report',
    '',
    'Generated from the v1 manifest-derived inventory, v4 core inventory, v4 validation inventory, and v4 coverage summary.',
    '',
    '## What Changed',
    '',
    report.summary.expansion_statement,
    '',
    'The v4 core preserves the 28-document v1 baseline and adds 20 core documents. The project also now tracks an extended validation corpus for denominator and coverage checks.',
    '',
    '## What Did Not Change',
    '',
    'V4 reduces but does not eliminate selection-bias risk. Existing interpretive claims remain limited to the currently annotated core until the v4 additions are fully re-analyzed.',
    '',
    'The validation corpus is lightly annotated and does not replace the fully annotated core as evidence for coded metaphor findings.',
    '',
    '## Expansion from 28 to 48 Core Documents',
    '',
    table(['Measure', 'Count'], [
      ['V1 core documents', report.summary.v1_documents],
      ['V4 core documents', report.summary.v4_core_documents],
      ['New v4 core additions', report.summary.v4_core_additions],
      ['Extended validation documents', report.summary.v4_validation_documents]
    ]),
    '',
    table(['Doc ID', 'Short Title', 'Date', 'Period', 'Genre', 'Audience'], coreAdditionRows),
    '',
    '## Addition of Extended Validation Corpus',
    '',
    'The validation corpus adds breadth for coverage review, denominator checks, and stress-testing selection choices. It is lightly annotated, so it can identify where claims may need re-testing but cannot independently support final coded interpretive claims.',
    '',
    '## Added Period Coverage',
    '',
    renderCoverageRows(report.expansion_coverage.period),
    '',
    '## Added Genre Coverage',
    '',
    renderCoverageRows(report.expansion_coverage.genre),
    '',
    '## Added Race and Agency Coverage',
    '',
    bulletList([
      'The core expansion adds Black audience and Black military agency boundary cases, including the Colonization Address and late-war agency materials.',
      'Race and Black military agency claims are stronger as coverage claims, but interpretive claims still require re-analysis across the fully annotated core.'
    ]),
    '',
    '## Added Emancipation Coverage',
    '',
    bulletList([
      `${report.expansion_coverage.key_added_counts.emancipation_core_additions} added core documents are tagged to the emancipation period.`,
      'The added records strengthen claims about emancipation-era rhetorical development while preserving the need to regenerate coded counts.'
    ]),
    '',
    '## Added War Powers Coverage',
    '',
    bulletList([
      'War-powers coverage improves through public letters, annual messages, and legal-policy materials.',
      'The coverage summary still classifies war-powers claims as requiring caution or follow-up, so this area remains a re-testing priority.'
    ]),
    '',
    '## Added Providence and Sacrifice Coverage',
    '',
    bulletList([
      'The expansion adds fragments, condolence writing, and late-war texts relevant to providence, mourning, and sacrifice.',
      'These additions broaden the denominator but do not by themselves revise coded providence or sacrifice findings.'
    ]),
    '',
    '## Claims Strengthened',
    '',
    claimBulletList(report.claim_impacts.strengthened),
    '',
    '## Claims Still Limited',
    '',
    claimBulletList(report.claim_impacts.still_limited),
    '',
    '## Claims Requiring Re-Testing',
    '',
    claimBulletList(report.claim_impacts.requiring_retesting),
    '',
    '## Claims Not Supported by Corpus Expansion Alone',
    '',
    claimBulletList(report.claim_impacts.not_supported_by_expansion_alone),
    '',
    '## Limitations',
    '',
    bulletList(report.limitations)
  ].join('\n').trimEnd() + '\n';
}

function writeOutput(outputPath, contents, options) {
  assertAllowedOutput(outputPath);
  const target = absolute(outputPath);
  const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (options.check) {
    if (existing !== contents) {
      throw new Error(`${displayPath(outputPath)} is stale; rerun scripts/corpus/generate-corpus-expansion-impact-report.js`);
    }
    return false;
  }
  guardedWriteFile(target, contents);
  return existing !== contents;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = readJSON(options.paths.manifest);
  const v1Inventory = buildV1Inventory(manifest, options.paths);
  const report = buildImpactReport(options.paths);
  const markdown = renderMarkdown(report);
  const changed = [
    writeOutput(options.paths.v1Inventory, stableJSON(v1Inventory), options),
    writeOutput(options.paths.reportJson, stableJSON(report), options),
    writeOutput(options.paths.reportMarkdown, markdown, options)
  ].some(Boolean);

  if (options.json) {
    console.log(JSON.stringify({
      status: report.status,
      changed,
      summary: report.summary
    }, null, 2));
  } else {
    console.log(`V4 corpus expansion impact report: ${report.status}`);
    console.log(`V1: ${report.summary.v1_documents}; v4 core: ${report.summary.v4_core_documents}; validation: ${report.summary.v4_validation_documents}`);
    console.log(`${options.check ? 'Checked' : 'Wrote'} ${displayPath(options.paths.v1Inventory)}, ${displayPath(options.paths.reportJson)}, and ${displayPath(options.paths.reportMarkdown)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildV1Inventory,
  buildImpactReport,
  renderMarkdown,
  parseArgs
};
