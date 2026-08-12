const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-provenance.schema.json');
const REGISTER_PATH = path.join(ROOT, 'corpus', 'provenance', 'source-authority-register.json');
const PROVENANCE_PATH = path.join(ROOT, 'corpus', 'provenance', 'corpus-v4-provenance.json');
const MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validator() {
  const schema = readJSON(SCHEMA_PATH);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function validRegister(overrides = {}) {
  return {
    register_id: 'source_authority_register_fixture',
    created_date: '2026-08-12',
    description: 'Fixture source authority register.',
    source_authorities: [
      {
        source_id: 'collected_works_michigan',
        name: 'Collected Works of Abraham Lincoln, University of Michigan Digital Edition',
        type: 'scholarly_edition',
        authority_level: 'preferred',
        base_url: 'https://quod.lib.umich.edu/l/lincoln/',
        citation_format: 'Collected Works of Abraham Lincoln, volume and page range.',
        notes: 'Preferred source for current baseline corpus records.'
      }
    ],
    ...overrides
  };
}

function validProvenance(overrides = {}) {
  return {
    provenance_id: 'corpus_provenance_v4_fixture',
    corpus_version: 'v4',
    created_date: '2026-08-12',
    description: 'Fixture corpus provenance file.',
    source_authority_register: 'corpus/provenance/source-authority-register.json',
    provenance_count: 2,
    records: [
      {
        doc_id: 'doc_001',
        source_id: 'collected_works_michigan',
        source_url: 'https://quod.lib.umich.edu/l/lincoln/lincoln1/1:144',
        retrieval_date: '2026-08-12',
        edition_or_collection: 'Collected Works of Abraham Lincoln, University of Michigan digital edition',
        volume_or_identifier: 'Collected Works vol.1 pp.108-115',
        text_integrity_notes: 'Standard collected-works text; no special provenance caution recorded.',
        known_variants: '',
        authorship_notes: 'lincoln_sole; confidence 0.98.',
        license_or_rights_notes: 'Scholarly digital edition used for research citation; verify rights before republication.'
      },
      {
        doc_id: 'doc_006a',
        source_id: 'collected_works_michigan',
        source_url: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:1',
        retrieval_date: '2026-08-12',
        edition_or_collection: 'Collected Works of Abraham Lincoln, University of Michigan digital edition',
        volume_or_identifier: 'Collected Works vol.3 pp.1-37',
        text_integrity_notes: 'Debate text depends on nineteenth-century newspaper transcriptions; exact wording and span boundaries require caution.',
        known_variants: 'transcription_variants',
        authorship_notes: 'lincoln_primary; confidence 0.83. Transcribed from newspaper accounts; annotate Lincoln turns only.',
        license_or_rights_notes: 'Scholarly digital edition used for research citation; verify rights before republication.'
      }
    ],
    ...overrides
  };
}

function errorText(validate) {
  return JSON.stringify(validate.errors || []);
}

test('corpus provenance schema validates the checked-in source authority register', () => {
  const validate = validator();
  const register = readJSON(REGISTER_PATH);
  assert.equal(validate(register), true, errorText(validate));
  assert.ok(register.source_authorities.some(source => source.authority_level === 'preferred'));
});

test('corpus provenance schema validates the checked-in v4 provenance seed', () => {
  const validate = validator();
  const provenance = readJSON(PROVENANCE_PATH);
  assert.equal(validate(provenance), true, errorText(validate));
  assert.equal(provenance.provenance_count, provenance.records.length);
});

test('corpus provenance schema validates fixture registers and provenance records', () => {
  const validate = validator();
  assert.equal(validate(validRegister()), true, errorText(validate));
  assert.equal(validate(validProvenance()), true, errorText(validate));
});

test('corpus provenance schema supports lighter reference records that still identify a source', () => {
  const validate = validator();
  const provenance = validProvenance({
    provenance_id: 'corpus_provenance_reference_fixture',
    provenance_count: 1,
    records: [
      {
        doc_id: 'doc_150',
        source_id: 'uncurated_public_domain_site',
        source_url: null,
        retrieval_date: '2026-08-12',
        edition_or_collection: 'Reference-corpus discovery source pending authority review',
        volume_or_identifier: null,
        text_integrity_notes: 'Search-only reference record; source must be upgraded before interpretive counting.',
        known_variants: 'authority_unconfirmed',
        authorship_notes: 'Authorship not yet reviewed for core or validation use.',
        license_or_rights_notes: 'Rights and reuse status not yet confirmed.'
      }
    ]
  });
  assert.equal(validate(provenance), true, errorText(validate));
});

test('corpus provenance schema rejects malformed authorities and records', () => {
  const validate = validator();

  assert.equal(validate(validRegister({
    source_authorities: [
      {
        source_id: 'bad-id',
        name: 'Bad ID',
        type: 'website',
        authority_level: 'preferred',
        base_url: null,
        citation_format: 'Bad citation.',
        notes: ''
      }
    ]
  })), false);
  assert.match(errorText(validate), /source_id|type/);

  const missingSource = validProvenance();
  delete missingSource.records[0].source_id;
  assert.equal(validate(missingSource), false);
  assert.match(errorText(validate), /source_id/);

  assert.equal(validate(validProvenance({
    records: [
      {
        doc_id: 'document_1',
        source_id: 'collected_works_michigan',
        source_url: 'https://example.com',
        retrieval_date: '2026-08-12',
        edition_or_collection: 'Collected Works',
        volume_or_identifier: null,
        text_integrity_notes: 'Invalid fixture.',
        known_variants: '',
        authorship_notes: '',
        license_or_rights_notes: 'Unknown.'
      }
    ]
  })), false);
  assert.match(errorText(validate), /doc_id/);
});

test('checked-in provenance covers every current manifest document and uses registered sources', () => {
  const register = readJSON(REGISTER_PATH);
  const provenance = readJSON(PROVENANCE_PATH);
  const manifest = readJSON(MANIFEST_PATH);
  const sourceIds = register.source_authorities.map(source => source.source_id);
  const registeredSources = new Set(sourceIds);
  assert.equal(sourceIds.length, registeredSources.size, 'source authority IDs must be unique');

  const provenanceDocIds = provenance.records.map(record => record.doc_id);
  const provenanceByDoc = new Map(provenance.records.map(record => [record.doc_id, record]));
  assert.equal(provenanceDocIds.length, provenanceByDoc.size, 'provenance doc IDs must be unique');

  assert.deepEqual(
    [...provenanceByDoc.keys()].sort(),
    manifest.documents.map(document => document.id).sort()
  );

  for (const record of provenance.records) {
    assert.ok(registeredSources.has(record.source_id), `${record.doc_id} uses unregistered source ${record.source_id}`);
  }
});
