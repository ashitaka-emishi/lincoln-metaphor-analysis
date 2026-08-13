#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..', '..');
const CREATED_DATE = '2026-08-13';

const PATHS = {
  provenance: 'corpus/provenance/corpus-v4-provenance.json',
  sourceAuthority: 'corpus/provenance/source-authority-register.json',
  documentSchema: 'schemas/corpus-document.schema.json',
  inventorySchema: 'schemas/corpus-inventory.schema.json',
  coreInventory: 'data/corpus/corpus-v4-core-inventory.json',
  validationInventory: 'data/corpus/corpus-v4-validation-inventory.json',
  referenceInventory: 'data/corpus/corpus-v4-reference-inventory.json',
  documentMetadata: 'data/corpus/corpus-v4-document-metadata.json',
  coreMarkdown: 'docs/corpus/corpus-v4-core-inventory.md',
  validationMarkdown: 'docs/corpus/corpus-v4-validation-inventory.md',
  referenceMarkdown: 'docs/corpus/corpus-v4-reference-inventory.md'
};

const DOCUMENT_FIELDS = [
  'doc_id',
  'corpus_version',
  'corpus_tier',
  'title',
  'short_title',
  'date',
  'date_precision',
  'year',
  'period',
  'genre',
  'audience',
  'rhetorical_function',
  'research_relevance',
  'source_authority',
  'source_url',
  'source_citation',
  'edition_notes',
  'text_status',
  'authorship_status',
  'included_in_v1',
  'included_in_v4_core',
  'included_in_v4_validation',
  'included_in_v4_reference',
  'annotation_status',
  'provenance_notes',
  'selection_rationale'
];

const OUTPUT_ALLOWLIST = new Set([
  PATHS.coreInventory,
  PATHS.validationInventory,
  PATHS.referenceInventory,
  PATHS.documentMetadata,
  PATHS.coreMarkdown,
  PATHS.validationMarkdown,
  PATHS.referenceMarkdown
]);

const ISSUE_113_REQUIRED_TEXTS = [
  'First Political Announcement',
  'Temperance Address',
  'Eulogy on Henry Clay',
  'Peoria Speech',
  'Letter to George Robertson',
  'Letter to Joshua Speed',
  'Speech on the Dred Scott Decision',
  'Cooper Union Address',
  'Farewell Address at Springfield',
  'Address at Independence Hall',
  'Annual Message to Congress, December 3, 1861',
  'Annual Message to Congress, December 1, 1862',
  'Preliminary Emancipation Proclamation',
  'Final Emancipation Proclamation',
  'Letter to Horace Greeley',
  'Letter to Erastus Corning',
  'Letter to James C. Conkling',
  'Letter to Albert G. Hodges',
  'Meditation on the Divine Will',
  'Last Public Address'
];

function absolute(relativePath) {
  return path.join(ROOT, relativePath);
}

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), 'utf8'));
}

function stableJSON(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function markdownEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|');
}

function assertAllowedOutput(relativePath) {
  if (!OUTPUT_ALLOWLIST.has(relativePath)) {
    throw new Error(`Refusing to write undeclared v4 output path: ${relativePath}`);
  }
  if (!relativePath.startsWith('data/corpus/corpus-v4-') && !relativePath.startsWith('docs/corpus/corpus-v4-')) {
    throw new Error(`Refusing to write non-v4 corpus path: ${relativePath}`);
  }
}

function writeOutput(relativePath, contents, options) {
  assertAllowedOutput(relativePath);
  const filePath = absolute(relativePath);
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (options.check) {
    if (existing !== contents) {
      throw new Error(`${relativePath} is stale; rerun scripts/corpus/create-corpus-v4-inventory.js`);
    }
    return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
  return existing !== contents;
}

function validator() {
  const inventorySchema = readJSON(PATHS.inventorySchema);
  const documentSchema = readJSON(PATHS.documentSchema);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addSchema(documentSchema, 'corpus-document.schema.json');
  return ajv.compile(inventorySchema);
}

function missingValue(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function assertDocumentMetadata(record) {
  for (const field of DOCUMENT_FIELDS) {
    if (missingValue(record[field]) && field !== 'source_url') {
      throw new Error(`${record.doc_id || 'UNKNOWN'} missing metadata field '${field}'`);
    }
  }
}

function assertInventory(inventory, inventoryPath, validate) {
  if (!validate(inventory)) {
    throw new Error(`${inventoryPath} failed schema validation: ${JSON.stringify(validate.errors || [])}`);
  }
  if (inventory.document_count !== inventory.documents.length) {
    throw new Error(`${inventoryPath} document_count ${inventory.document_count} does not match ${inventory.documents.length}`);
  }

  const ids = new Set();
  for (const record of inventory.documents) {
    assertDocumentMetadata(record);
    if (ids.has(record.doc_id)) {
      throw new Error(`${inventoryPath} contains duplicate doc_id ${record.doc_id}`);
    }
    ids.add(record.doc_id);
  }
}

function duplicateReport(records) {
  const titles = new Map();
  const titleDates = new Map();
  const dates = new Map();
  for (const record of records) {
    addSeen(titles, record.title, record.doc_id);
    addSeen(titleDates, `${record.title}|${record.date}`, record.doc_id);
    addSeen(dates, record.date, record.doc_id);
  }
  return {
    duplicateTitles: repeated(titles),
    duplicateTitleDates: repeated(titleDates),
    duplicateDates: repeated(dates)
  };
}

function addSeen(map, key, id) {
  const values = map.get(key) || [];
  values.push(id);
  map.set(key, values);
}

function repeated(map) {
  return Array.from(map.entries())
    .filter(([, values]) => values.length > 1)
    .map(([value, doc_ids]) => ({ value, doc_ids }));
}

function mergedDocuments(inventories) {
  const merged = new Map();
  for (const inventory of inventories) {
    for (const record of inventory.documents) {
      const existing = merged.get(record.doc_id);
      if (!existing) {
        merged.set(record.doc_id, structuredClone(record));
        continue;
      }
      existing.included_in_v1 = existing.included_in_v1 || record.included_in_v1;
      existing.included_in_v4_core = existing.included_in_v4_core || record.included_in_v4_core;
      existing.included_in_v4_validation = existing.included_in_v4_validation || record.included_in_v4_validation;
      existing.included_in_v4_reference = existing.included_in_v4_reference || record.included_in_v4_reference;
      if (!existing.provenance_notes.includes(record.provenance_notes)) {
        existing.provenance_notes = `${existing.provenance_notes} ${record.provenance_notes}`.trim();
      }
    }
  }
  return Array.from(merged.values()).sort((a, b) => a.doc_id.localeCompare(b.doc_id, 'en'));
}

function normalizedInventory(inventory) {
  const documents = inventory.documents.map(record => ({ ...record }));
  return {
    ...inventory,
    document_count: documents.length,
    tier_counts: {
      v1: documents.filter(record => record.included_in_v1).length,
      v4_core: documents.filter(record => record.included_in_v4_core).length,
      v4_validation: documents.filter(record => record.included_in_v4_validation).length,
      v4_reference: documents.filter(record => record.included_in_v4_reference).length
    },
    documents
  };
}

function documentMetadata(inventories) {
  const documents = mergedDocuments(inventories);
  return {
    metadata_id: 'corpus_metadata_v4_documents',
    corpus_version: 'v4',
    created_date: CREATED_DATE,
    description: 'Generated aggregate metadata index for v4 core, validation, and search-only reference inventory records. Duplicate records carried from core into validation are merged by doc_id while retaining tier membership flags.',
    source_files: [
      { path: PATHS.coreInventory, role: 'inventory_source' },
      { path: PATHS.validationInventory, role: 'inventory_source' },
      { path: PATHS.referenceInventory, role: 'inventory_source' },
      { path: PATHS.provenance, role: 'source_authority', notes: 'Seed provenance file for current v1 carry-forward records.' },
      { path: PATHS.sourceAuthority, role: 'source_authority' }
    ],
    document_count: documents.length,
    tier_counts: {
      v1: documents.filter(record => record.included_in_v1).length,
      v4_core: documents.filter(record => record.included_in_v4_core).length,
      v4_validation: documents.filter(record => record.included_in_v4_validation).length,
      v4_reference: documents.filter(record => record.included_in_v4_reference).length
    },
    documents
  };
}

function inventoryTable(inventory, columns) {
  const header = `| ${columns.map(column => column.label).join(' | ')} |`;
  const separator = `| ${columns.map(column => column.alignRight ? '---:' : '---').join(' | ')} |`;
  const rows = inventory.documents.map(record => {
    return `| ${columns.map(column => markdownEscape(column.value(record))).join(' | ')} |`;
  });
  return [header, separator, ...rows].join('\n');
}

function countSummary(rows) {
  return [
    '| Measure | Count |',
    '| --- | ---: |',
    ...rows.map(([label, value]) => `| ${label} | ${value} |`)
  ].join('\n');
}

function coreMarkdown(inventory) {
  const preserved = inventory.documents.filter(record => record.included_in_v1).length;
  const additions = inventory.documents.filter(record => !record.included_in_v1).length;
  return `---\ntitle: "V4 Core Corpus Inventory"\ndescription: "${inventory.document_count}-document Tier 1 v4 core corpus inventory."\ndraft: false\n---\n\n# V4 Core Corpus Inventory\n\nThis page is generated from \`${PATHS.coreInventory}\`. It records the Tier 1 v4 core inventory: all current v1 documents plus deterministic v4 additions. Existing v1 document IDs remain unchanged.\n\n## Count Summary\n\n${countSummary([
    ['Total v4 core inventory records', inventory.document_count],
    ['Preserved v1 records', preserved],
    ['New deterministic v4 additions', additions],
    ['Records included in v4 core', inventory.tier_counts.v4_core]
  ])}\n\n## Issue #113 Required Texts\n\nThe issue #113 required list is fully represented. Texts already present in v1 retain their existing IDs; newly added texts use deterministic IDs after the current v1 range.\n\n${ISSUE_113_REQUIRED_TEXTS.map(title => `- ${title}`).join('\n')}\n\n## Inventory\n\n${inventoryTable(inventory, [
    { label: 'Doc ID', value: record => record.doc_id },
    { label: 'Short Title', value: record => record.short_title },
    { label: 'Date', value: record => record.date },
    { label: 'Tier', value: record => record.corpus_tier },
    { label: 'In v1', value: record => record.included_in_v1 ? 'yes' : 'no' },
    { label: 'Period', value: record => record.period },
    { label: 'Genre', value: record => record.genre },
    { label: 'Audience', value: record => record.audience },
    { label: 'Selection Rationale', value: record => record.selection_rationale }
  ])}\n\n## Method Notes\n\n- This inventory does not overwrite v1 source, segmented, sentence-ID, or Stage 4 annotation artifacts.\n- New v4 core records are metadata targets for later raw-text ingestion, segmentation, provenance validation, and full annotation.\n- New records with nullable \`source_url\` retain source citations and must receive item-level provenance before interpretive counting.\n`;
}

function validationMarkdown(inventory) {
  const coreCount = inventory.documents.filter(record => record.included_in_v4_core).length;
  const additions = inventory.documents.filter(record => record.corpus_tier === 'v4-validation').length;
  const strata = Array.from(new Set(
    inventory.documents
      .filter(record => record.corpus_tier === 'v4-validation')
      .flatMap(record => record.research_relevance)
  )).sort();
  return `---\ntitle: "V4 Validation Corpus Inventory"\ndescription: "${inventory.document_count}-document Tier 2 v4 validation corpus inventory."\ndraft: false\n---\n\n# V4 Validation Corpus Inventory\n\nThis page is generated from \`${PATHS.validationInventory}\`. It records the Tier 2 v4 validation inventory: all v4-core records plus stratified validation candidates. The validation corpus is designed for light annotation, coverage testing, recurrence checks, and negative-finding audits. It is not fully interpreted Stage 4 evidence.\n\n## Count Summary\n\n${countSummary([
    ['Total validation inventory records', inventory.document_count],
    ['Included v4-core records', coreCount],
    ['Additional validation candidates', additions],
    ['Records marked for validation corpus', inventory.tier_counts.v4_validation]
  ])}\n\n## Validation Strata\n\nThe added validation candidates cover these strata rather than fame alone:\n\n${strata.map(stratum => `- ${stratum}`).join('\n')}\n\n## Inventory\n\n${inventoryTable(inventory, [
    { label: 'Doc ID', value: record => record.doc_id },
    { label: 'Short Title', value: record => record.short_title },
    { label: 'Date', value: record => record.date },
    { label: 'Tier', value: record => record.corpus_tier },
    { label: 'Annotation Status', value: record => record.annotation_status },
    { label: 'Period', value: record => record.period },
    { label: 'Genre', value: record => record.genre },
    { label: 'Audience', value: record => record.audience },
    { label: 'Selection Rationale', value: record => record.selection_rationale }
  ])}\n\n## Method Notes\n\n- All v4-core records are included so the validation corpus can test the expanded core denominator.\n- Added validation records are marked \`lightly_annotated\`, not fully interpreted.\n- Provenance placeholders record a source authority and citation, but item-level source URLs, raw text ingestion, segmentation, and full provenance validation remain later gates.\n- Search-only reference corpus design remains separate from this validation inventory.\n`;
}

function referenceMarkdown(inventory) {
  return `---\ntitle: "V4 Reference Corpus Inventory"\ndescription: "${inventory.document_count}-document Tier 3 v4 search-only reference corpus inventory."\ndraft: false\n---\n\n# V4 Reference Corpus Inventory\n\nThis page is generated from \`${PATHS.referenceInventory}\`. It records the Tier 3 v4 reference inventory: a search-only layer for lexical recurrence, phrase searches, negative checks, source-context review, and candidate discovery. Reference-corpus records are not fully annotated Stage 4 evidence and must not be counted with core or validation-corpus findings unless a later issue promotes them into one of those tiers.\n\n## Count Summary\n\n${countSummary([
    ['Total reference inventory records', inventory.document_count],
    ['Included v4-core records', inventory.tier_counts.v4_core],
    ['Included validation records', inventory.tier_counts.v4_validation],
    ['Records marked search-only reference', inventory.tier_counts.v4_reference]
  ])}\n\n## Reference Role\n\nThe reference corpus is intentionally open-ended and incremental. It may contain secure texts, fragments, reported speeches, source-context companions, and boundary cases whose immediate role is discovery rather than interpretation.\n\nReference-corpus evidence may be used for:\n\n- lexical recurrence and phrase-search discovery;\n- negative checks for whether a phrase or metaphor family appears in likely neighboring contexts;\n- source-context review around a core or validation text;\n- identifying candidates for future validation or core promotion.\n\nReference-corpus evidence may not be used as:\n\n- fully annotated interpretive evidence;\n- a denominator for Stage 4 metaphor counts;\n- proof that the project analyzes all Lincoln writings;\n- a substitute for item-level provenance, segmentation, and validation.\n\n## Promotion Rule\n\nA reference item can be promoted only through a later tracked issue. The promotion issue must identify the target tier, check source authority and text status, add or confirm raw text provenance, update the relevant inventory, and rerun the validation gate for the affected corpus files. Until that happens, searches over the reference corpus can motivate follow-up work but cannot establish publication claims.\n\n## Inventory\n\n${inventoryTable(inventory, [
    { label: 'Doc ID', value: record => record.doc_id },
    { label: 'Short Title', value: record => record.short_title },
    { label: 'Date', value: record => record.date },
    { label: 'Status', value: () => 'search-only' },
    { label: 'Period', value: record => record.period },
    { label: 'Genre', value: record => record.genre },
    { label: 'Audience', value: record => record.audience },
    { label: 'Source Authority', value: record => record.source_authority },
    { label: 'Reference Use', value: record => record.selection_rationale }
  ])}\n\n## Method Notes\n\n- Reference records use deterministic IDs after the validation inventory range so future additions can append without changing existing IDs.\n- \`source_url\` is intentionally nullable at this stage; source authority and citation are recorded, while item-level URLs and checksums remain later provenance work.\n- Records with fragmentary, reconstructed, or reported text retain explicit provenance cautions.\n- Promotion into validation or core tiers must update the JSON inventory, this documentation page, provenance records, and validation outputs in the same tracked workflow.\n`;
}

function parseArgs(argv) {
  return {
    check: argv.includes('--check'),
    json: argv.includes('--json')
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const validate = validator();
  const core = normalizedInventory(readJSON(PATHS.coreInventory));
  const validation = normalizedInventory(readJSON(PATHS.validationInventory));
  const reference = normalizedInventory(readJSON(PATHS.referenceInventory));
  const inventories = [core, validation, reference];

  assertInventory(core, PATHS.coreInventory, validate);
  assertInventory(validation, PATHS.validationInventory, validate);
  assertInventory(reference, PATHS.referenceInventory, validate);

  const uniqueDocs = mergedDocuments(inventories);
  const duplicates = duplicateReport(uniqueDocs);
  if (duplicates.duplicateTitleDates.length > 0) {
    throw new Error(`Duplicate selected records found: ${JSON.stringify({
      duplicateTitleDates: duplicates.duplicateTitleDates
    })}`);
  }

  const outputs = new Map([
    [PATHS.coreInventory, stableJSON(core)],
    [PATHS.validationInventory, stableJSON(validation)],
    [PATHS.referenceInventory, stableJSON(reference)],
    [PATHS.documentMetadata, stableJSON(documentMetadata(inventories))],
    [PATHS.coreMarkdown, coreMarkdown(core)],
    [PATHS.validationMarkdown, validationMarkdown(validation)],
    [PATHS.referenceMarkdown, referenceMarkdown(reference)]
  ]);

  const changed = [];
  for (const [outputPath, contents] of outputs) {
    if (writeOutput(outputPath, contents, options)) {
      changed.push(outputPath);
    }
  }

  const summary = {
    mode: options.check ? 'check' : 'write',
    inventories: {
      core: core.document_count,
      validation: validation.document_count,
      reference: reference.document_count,
      metadata: uniqueDocs.length
    },
    duplicate_titles_flagged: duplicates.duplicateTitles.length,
    duplicate_dates_flagged: duplicates.duplicateDates.length,
    changed
  };

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`${options.check ? 'Checked' : 'Generated'} v4 corpus inventories and Markdown tables.`);
    console.log(`Core: ${core.document_count}; validation: ${validation.document_count}; reference: ${reference.document_count}; metadata: ${uniqueDocs.length}.`);
    if (duplicates.duplicateTitles.length > 0 || duplicates.duplicateDates.length > 0) {
      console.log(`Flagged ${duplicates.duplicateTitles.length} shared title(s) and ${duplicates.duplicateDates.length} shared date(s) for review; duplicate title/date pairs are errors.`);
    }
    if (changed.length > 0) {
      console.log(`Changed: ${changed.join(', ')}`);
    }
  }
}

main();
