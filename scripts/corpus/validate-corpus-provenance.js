#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');
const { writeFile: guardedWriteFile } = require('./write-guard');

const ROOT = path.resolve(__dirname, '..', '..');
const CREATED_DATE = '2026-08-13';

const DEFAULT_PATHS = {
  schema: 'schemas/corpus-provenance.schema.json',
  sourceAuthority: 'corpus/provenance/source-authority-register.json',
  provenance: 'corpus/provenance/corpus-v4-provenance.json',
  core: 'data/corpus/corpus-v4-core-inventory.json',
  validation: 'data/corpus/corpus-v4-validation-inventory.json',
  report: 'data/corpus/corpus-v4-provenance-validation-report.json'
};

function absolute(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(ROOT, inputPath);
}

function displayPath(inputPath) {
  return path.isAbsolute(inputPath) ? path.relative(ROOT, inputPath) : inputPath;
}

function readJSON(inputPath) {
  return JSON.parse(fs.readFileSync(absolute(inputPath), 'utf8'));
}

function stableJSON(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
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
      if (!argv[index]) throw new Error(`${arg} requires a path`);
      options.paths[key] = argv[index];
    }
  }
  return options;
}

function provenanceValidator(paths) {
  const schema = readJSON(paths.schema);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function issue(severity, code, message, context = {}) {
  return { severity, code, message, context };
}

function addIssue(collection, severity, code, message, context) {
  collection.push(issue(severity, code, message, context));
}

function recordsById(records) {
  return new Map(records.map(record => [record.doc_id, record]));
}

function sourceAuthoritiesById(register) {
  return new Map(register.source_authorities.map(source => [source.source_id, source]));
}

function recordIsPlaceholder(record) {
  return /placeholder|pending|later gate|future/i.test([
    record.text_integrity_notes,
    record.authorship_notes,
    record.license_or_rights_notes,
    record.known_variants
  ].join(' '));
}

function validateSchema(paths, register, provenance, errors) {
  const validate = provenanceValidator(paths);
  if (!validate(register)) {
    addIssue(errors, 'error', 'source_authority_schema_invalid', 'Source authority register failed schema validation', {
      errors: validate.errors || []
    });
  }
  if (!validate(provenance)) {
    addIssue(errors, 'error', 'provenance_schema_invalid', 'Corpus provenance file failed schema validation', {
      errors: validate.errors || []
    });
  }
  if (provenance.provenance_count !== provenance.records.length) {
    addIssue(errors, 'error', 'provenance_count_mismatch', 'provenance_count does not match records length', {
      expected: provenance.records.length,
      actual: provenance.provenance_count
    });
  }
}

function validateSources(register, provenance, errors) {
  const sourceIds = new Set();
  for (const source of register.source_authorities) {
    if (sourceIds.has(source.source_id)) {
      addIssue(errors, 'error', 'duplicate_source_id', 'Source authority register contains duplicate source_id', {
        source_id: source.source_id
      });
    }
    sourceIds.add(source.source_id);
    if (!source.authority_level) {
      addIssue(errors, 'error', 'missing_authority_level', 'Source authority is missing authority_level', {
        source_id: source.source_id
      });
    }
  }

  for (const record of provenance.records) {
    if (!sourceIds.has(record.source_id)) {
      addIssue(errors, 'error', 'unknown_source_id', 'Provenance record uses an unregistered source_id', {
        doc_id: record.doc_id,
        source_id: record.source_id
      });
    }
    if (record.source_url && !record.retrieval_date) {
      addIssue(errors, 'error', 'missing_retrieval_date', 'Provenance record with source_url must include retrieval_date', {
        doc_id: record.doc_id
      });
    }
  }
}

function validateCoverage(coreInventory, validationInventory, provenance, sourceAuthorities, errors, warnings) {
  const provenanceById = recordsById(provenance.records);
  const seenProvenanceIds = new Set();
  for (const record of provenance.records) {
    if (seenProvenanceIds.has(record.doc_id)) {
      addIssue(errors, 'error', 'duplicate_provenance_doc_id', 'Corpus provenance contains duplicate doc_id records', {
        doc_id: record.doc_id
      });
    }
    seenProvenanceIds.add(record.doc_id);
  }

  for (const doc of coreInventory.documents) {
    const provenanceRecord = provenanceById.get(doc.doc_id);
    if (!provenanceRecord) {
      addIssue(errors, 'error', 'core_missing_provenance', 'Every v4-core document must have a provenance entry', {
        doc_id: doc.doc_id
      });
      continue;
    }
    if (!provenanceRecord.source_url && doc.included_in_v1) {
      addIssue(errors, 'error', 'v1_missing_source_url', 'Preserved v1 core provenance must retain a source URL', {
        doc_id: doc.doc_id
      });
    }
  }

  for (const doc of validationInventory.documents) {
    const provenanceRecord = provenanceById.get(doc.doc_id);
    if (!provenanceRecord) {
      addIssue(errors, 'error', 'validation_missing_provenance', 'Every v4-validation document must have a provenance entry or placeholder', {
        doc_id: doc.doc_id
      });
      continue;
    }
    if (!provenanceRecord.source_url && !recordIsPlaceholder(provenanceRecord)) {
      addIssue(errors, 'error', 'validation_placeholder_not_marked', 'Validation provenance without source_url must be marked as a placeholder', {
        doc_id: doc.doc_id
      });
    }
  }

  const reviewDocsById = new Map();
  for (const doc of coreInventory.documents.concat(validationInventory.documents)) {
    if (!reviewDocsById.has(doc.doc_id)) {
      reviewDocsById.set(doc.doc_id, doc);
    }
  }

  for (const doc of reviewDocsById.values()) {
    const provenanceRecord = provenanceById.get(doc.doc_id);
    if (!provenanceRecord) continue;
    const source = sourceAuthorities.get(provenanceRecord.source_id);
    if (source && source.authority_level === 'avoid_unless_needed') {
      addIssue(warnings, 'warning', 'low_authority_source', 'Inventory record uses an avoid-unless-needed source authority', {
        doc_id: doc.doc_id,
        source_id: provenanceRecord.source_id
      });
    }
    if (doc.authorship_status === 'disputed' && !/disputed|authorship/i.test(provenanceRecord.authorship_notes)) {
      addIssue(errors, 'error', 'disputed_authorship_not_reflected', 'Disputed authorship must be reflected in provenance metadata', {
        doc_id: doc.doc_id
      });
    }
    if (['uncertain', 'disputed', 'fragment'].includes(doc.text_status) &&
        !/uncertain|disputed|fragment|variant|caution|placeholder|pending/i.test(provenanceRecord.text_integrity_notes)) {
      addIssue(errors, 'error', 'uncertain_text_status_not_reflected', 'Uncertain, disputed, or fragmentary text status must be reflected in provenance metadata', {
        doc_id: doc.doc_id,
        text_status: doc.text_status
      });
    }
    if (['disputed', 'uncertain', 'attributed'].includes(doc.authorship_status)) {
      addIssue(warnings, 'warning', 'authorship_review', 'Authorship status should receive reviewer attention before interpretive use', {
        doc_id: doc.doc_id,
        authorship_status: doc.authorship_status
      });
    }
    if (['uncertain', 'disputed', 'fragment'].includes(doc.text_status)) {
      addIssue(warnings, 'warning', 'text_status_review', 'Text status should receive reviewer attention before interpretive use', {
        doc_id: doc.doc_id,
        text_status: doc.text_status
      });
    }
    if (recordIsPlaceholder(provenanceRecord)) {
      addIssue(warnings, 'warning', 'provenance_placeholder', 'Provenance record is a placeholder pending item-level confirmation', {
        doc_id: doc.doc_id
      });
    }
  }
}

function validationReport(paths) {
  const register = readJSON(paths.sourceAuthority);
  const provenance = readJSON(paths.provenance);
  const core = readJSON(paths.core);
  const validation = readJSON(paths.validation);
  const errors = [];
  const warnings = [];

  validateSchema(paths, register, provenance, errors);
  validateSources(register, provenance, errors);
  if (errors.length === 0) {
    validateCoverage(core, validation, provenance, sourceAuthoritiesById(register), errors, warnings);
  }

  return {
    validation_id: 'corpus_v4_provenance_validation',
    created_date: CREATED_DATE,
    status: errors.length === 0 ? 'pass' : 'fail',
    inputs: {
      source_authority_register: displayPath(paths.sourceAuthority),
      provenance: displayPath(paths.provenance),
      core_inventory: displayPath(paths.core),
      validation_inventory: displayPath(paths.validation),
      schema: displayPath(paths.schema)
    },
    summary: {
      source_authorities: register.source_authorities.length,
      provenance_records: provenance.records.length,
      core_documents: core.document_count,
      validation_documents: validation.document_count,
      errors: errors.length,
      warnings: warnings.length
    },
    errors,
    warnings
  };
}

function writeReport(reportPath, contents, options) {
  const absoluteReport = absolute(reportPath);
  const existing = fs.existsSync(absoluteReport) ? fs.readFileSync(absoluteReport, 'utf8') : null;
  if (options.check) {
    if (existing !== contents) {
      throw new Error(`${displayPath(reportPath)} is stale; rerun scripts/corpus/validate-corpus-provenance.js`);
    }
    return false;
  }
  guardedWriteFile(absoluteReport, contents);
  return existing !== contents;
}

function printReadable(report, reportChanged, options) {
  if (options.json) {
    console.log(JSON.stringify({ ...report, report_changed: reportChanged }, null, 2));
    return;
  }
  console.log(`V4 corpus provenance validation: ${report.status}`);
  console.log(`Sources: ${report.summary.source_authorities}; provenance records: ${report.summary.provenance_records}`);
  console.log(`Core: ${report.summary.core_documents}; validation: ${report.summary.validation_documents}`);
  console.log(`Errors: ${report.summary.errors}; warnings: ${report.summary.warnings}`);
  for (const error of report.errors) {
    console.log(`ERROR ${error.code}: ${error.message} ${JSON.stringify(error.context)}`);
  }
  for (const warning of report.warnings.slice(0, 10)) {
    console.log(`WARN ${warning.code}: ${warning.message} ${JSON.stringify(warning.context)}`);
  }
  if (report.warnings.length > 10) {
    console.log(`WARN: ${report.warnings.length - 10} additional warning(s) written to report.`);
  }
  console.log(`${options.check ? 'Checked' : 'Wrote'} ${displayPath(options.paths.report)}`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = validationReport(options.paths);
  const reportChanged = writeReport(options.paths.report, stableJSON(report), options);
  printReadable(report, reportChanged, options);
  if (report.errors.length > 0) process.exitCode = 1;
}

if (require.main === module) {
  main();
}
