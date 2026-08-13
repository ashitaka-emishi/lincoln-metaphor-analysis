#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..', '..');
const CREATED_DATE = '2026-08-13';

const DEFAULT_PATHS = {
  manifest: 'corpus/corpus_manifest.json',
  provenance: 'corpus/provenance/corpus-v4-provenance.json',
  documentSchema: 'schemas/corpus-document.schema.json',
  inventorySchema: 'schemas/corpus-inventory.schema.json',
  core: 'data/corpus/corpus-v4-core-inventory.json',
  validation: 'data/corpus/corpus-v4-validation-inventory.json',
  reference: 'data/corpus/corpus-v4-reference-inventory.json',
  report: 'data/corpus/corpus-v4-inventory-validation-report.json'
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
      if (!argv[index]) {
        throw new Error(`${arg} requires a path`);
      }
      options.paths[key] = argv[index];
    }
  }
  return options;
}

function validator(paths) {
  const inventorySchema = readJSON(paths.inventorySchema);
  const documentSchema = readJSON(paths.documentSchema);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addSchema(documentSchema, 'corpus-document.schema.json');
  return ajv.compile(inventorySchema);
}

function issue(severity, code, message, context = {}) {
  return { severity, code, message, context };
}

function addIssue(collection, severity, code, message, context) {
  collection.push(issue(severity, code, message, context));
}

function computedCounts(inventory) {
  return {
    document_count: inventory.documents.length,
    tier_counts: {
      v1: inventory.documents.filter(record => record.included_in_v1).length,
      v4_core: inventory.documents.filter(record => record.included_in_v4_core).length,
      v4_validation: inventory.documents.filter(record => record.included_in_v4_validation).length,
      v4_reference: inventory.documents.filter(record => record.included_in_v4_reference).length
    }
  };
}

function repeatedValues(records, valueForRecord) {
  const seen = new Map();
  for (const record of records) {
    const value = valueForRecord(record);
    const ids = seen.get(value) || [];
    ids.push(record.doc_id);
    seen.set(value, ids);
  }
  return Array.from(seen.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([value, doc_ids]) => ({ value, doc_ids }));
}

function validateInventoryShape(name, inventory, validate, errors, warnings) {
  if (!validate(inventory)) {
    addIssue(errors, 'error', 'schema_invalid', `${name} inventory failed schema validation`, {
      errors: validate.errors || []
    });
    return;
  }

  const counts = computedCounts(inventory);
  if (inventory.document_count !== counts.document_count) {
    addIssue(errors, 'error', 'document_count_mismatch', `${name} inventory document_count does not match document array length`, {
      expected: counts.document_count,
      actual: inventory.document_count
    });
  }
  for (const [tier, expected] of Object.entries(counts.tier_counts)) {
    if (inventory.tier_counts[tier] !== expected) {
      addIssue(errors, 'error', 'tier_count_mismatch', `${name} inventory tier count mismatch for ${tier}`, {
        expected,
        actual: inventory.tier_counts[tier]
      });
    }
  }

  for (const duplicate of repeatedValues(inventory.documents, record => record.doc_id)) {
    addIssue(errors, 'error', 'duplicate_doc_id', `${name} inventory contains duplicate doc_id ${duplicate.value}`, duplicate);
  }
  for (const duplicate of repeatedValues(inventory.documents, record => `${record.title}|${record.date}`)) {
    addIssue(errors, 'error', 'duplicate_title_date', `${name} inventory contains duplicate title/date pair`, duplicate);
  }
  for (const duplicate of repeatedValues(inventory.documents, record => record.title)) {
    addIssue(warnings, 'warning', 'duplicate_title', `${name} inventory contains a repeated title`, duplicate);
  }
  for (const duplicate of repeatedValues(inventory.documents, record => record.date)) {
    addIssue(warnings, 'warning', 'duplicate_date', `${name} inventory contains a repeated date`, duplicate);
  }
}

function validateCrossInventory(inventories, manifest, provenance, errors, warnings) {
  const coreRecords = inventories.core.documents;
  const validationById = new Map(inventories.validation.documents.map(record => [record.doc_id, record]));
  const manifestIds = new Set(manifest.documents.map(record => record.id));
  const coreIds = new Set(coreRecords.map(record => record.doc_id));
  const provenanceIds = new Set(provenance.records.map(record => record.doc_id));

  if (inventories.core.document_count !== 48) {
    addIssue(errors, 'error', 'core_target_count', 'v4 core inventory must contain exactly 48 documents', {
      actual: inventories.core.document_count
    });
  }
  if (inventories.validation.document_count < 75 || inventories.validation.document_count > 100) {
    addIssue(errors, 'error', 'validation_target_count', 'v4 validation inventory must contain 75 to 100 documents', {
      actual: inventories.validation.document_count
    });
  }

  for (const record of coreRecords) {
    if (!validationById.has(record.doc_id)) {
      addIssue(errors, 'error', 'core_missing_from_validation', 'Every v4-core document must also be present in v4 validation', {
        doc_id: record.doc_id
      });
    }
    if (!record.source_authority || !record.source_citation || !record.provenance_notes) {
      addIssue(errors, 'error', 'core_missing_provenance_metadata', 'Every v4-core document must carry provenance metadata fields', {
        doc_id: record.doc_id
      });
    }
    if (!provenanceIds.has(record.doc_id)) {
      addIssue(warnings, 'warning', 'core_missing_item_provenance', 'v4-core document lacks an item-level provenance record in corpus-v4-provenance.json', {
        doc_id: record.doc_id
      });
    }
    if (!record.included_in_v1 && !record.selection_rationale) {
      addIssue(errors, 'error', 'core_addition_missing_selection_rationale', 'New v4-core document must have a selection rationale', {
        doc_id: record.doc_id
      });
    }
  }

  for (const manifestId of manifestIds) {
    if (!coreIds.has(manifestId)) {
      addIssue(errors, 'error', 'v1_id_not_preserved', 'v1 document ID is missing from v4 core inventory', {
        doc_id: manifestId
      });
    }
  }

  for (const record of coreRecords.filter(document => document.included_in_v1)) {
    if (!manifestIds.has(record.doc_id)) {
      addIssue(errors, 'error', 'unknown_v1_id', 'Document marked included_in_v1 is not present in the v1 manifest', {
        doc_id: record.doc_id
      });
    }
  }
}

function validationReport(paths) {
  const validate = validator(paths);
  const manifest = readJSON(paths.manifest);
  const provenance = readJSON(paths.provenance);
  const inventories = {
    core: readJSON(paths.core),
    validation: readJSON(paths.validation),
    reference: readJSON(paths.reference)
  };
  const errors = [];
  const warnings = [];

  validateInventoryShape('core', inventories.core, validate, errors, warnings);
  validateInventoryShape('validation', inventories.validation, validate, errors, warnings);
  validateInventoryShape('reference', inventories.reference, validate, errors, warnings);
  if (errors.length === 0) {
    validateCrossInventory(inventories, manifest, provenance, errors, warnings);
  }

  return {
    validation_id: 'corpus_v4_inventory_validation',
    created_date: CREATED_DATE,
    status: errors.length === 0 ? 'pass' : 'fail',
    inputs: {
      manifest: displayPath(paths.manifest),
      provenance: displayPath(paths.provenance),
      document_schema: displayPath(paths.documentSchema),
      inventory_schema: displayPath(paths.inventorySchema),
      core_inventory: displayPath(paths.core),
      validation_inventory: displayPath(paths.validation),
      reference_inventory: displayPath(paths.reference)
    },
    summary: {
      core_documents: inventories.core.document_count,
      validation_documents: inventories.validation.document_count,
      reference_documents: inventories.reference.document_count,
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
      throw new Error(`${displayPath(reportPath)} is stale; rerun scripts/corpus/validate-corpus-inventory.js`);
    }
    return false;
  }
  fs.mkdirSync(path.dirname(absoluteReport), { recursive: true });
  fs.writeFileSync(absoluteReport, contents);
  return existing !== contents;
}

function printReadable(report, reportChanged, options) {
  if (options.json) {
    console.log(JSON.stringify({ ...report, report_changed: reportChanged }, null, 2));
    return;
  }
  console.log(`V4 corpus inventory validation: ${report.status}`);
  console.log(`Core: ${report.summary.core_documents}; validation: ${report.summary.validation_documents}; reference: ${report.summary.reference_documents}`);
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
  const contents = stableJSON(report);
  const reportChanged = writeReport(options.paths.report, contents, options);
  printReadable(report, reportChanged, options);
  if (report.errors.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
