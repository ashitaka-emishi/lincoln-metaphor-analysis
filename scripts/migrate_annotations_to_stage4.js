#!/usr/bin/env node
// One-time canonicalization for legacy Stage 4 annotation objects.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANNOTATED_DIR = path.join(ROOT, 'corpus', 'annotated');
const MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');

const FANTASY_TYPE_MAP = {
  ideological_proof: 'experiment_and_proof',
  republic_as_proposition_under_test: 'experiment_and_proof',
  proposition_under_test: 'experiment_and_proof',
  founding_authority_as_rule: 'ancestral_debt',
  patrimony_defense: 'ancestral_debt',
  national_integrity_threat: 'wound_and_healing',
  national_organism: 'wound_and_healing',
  national_body_integrity: 'wound_and_healing',
  generative_creation: 'birth_and_creation',
  covenant_integrity_obligation: 'oath_and_obligation',
  covenant_preservation: 'oath_and_obligation',
  providential_sanction: 'punishment_and_theodicy',
  divine_sanction: 'punishment_and_theodicy',
  divine_judgment_deferred: 'punishment_and_theodicy',
  divine_protection_invoked: 'punishment_and_theodicy'
};

const ABSENCE_FLAG_MAP = {
  black_soldiers_absent: 'black_soldiers_erased',
  disease_and_purification: 'disease_purification_absent'
};

const CLUSTER_VALUES = new Set([
  'cluster_01_body_organism',
  'cluster_02_covenant_oath',
  'cluster_03_experiment_proposition',
  'cluster_04_birth_creation',
  'cluster_05_fathers_inheritance',
  'cluster_06_providence_theodicy'
]);

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function sentenceCount(data) {
  let count = 0;
  for (const section of data.sections || []) {
    for (const para of section.paragraphs || []) {
      count += (para.sentences || []).length;
    }
  }
  return count;
}

function getDocMeta(manifest) {
  const byId = {};
  for (const doc of manifest.documents || []) byId[doc.id] = doc;
  return byId;
}

function appendNote(existing, note) {
  if (!note) return existing || null;
  if (!existing) return note;
  if (existing.includes(note)) return existing;
  return `${existing} ${note}`;
}

function normalizeFantasyType(value, notes) {
  if (!value) return value;
  const mapped = FANTASY_TYPE_MAP[value] || value;
  if (mapped !== value) {
    notes.push(`Migrated legacy fantasy_type '${value}' to canonical '${mapped}'.`);
  }
  return mapped;
}

function normalizeAbsenceFlags(flags, notes) {
  if (!Array.isArray(flags)) return [];
  const seen = new Set();
  const normalized = [];
  for (const flag of flags) {
    const mapped = ABSENCE_FLAG_MAP[flag] || flag;
    if (mapped !== flag) {
      notes.push(`Migrated legacy absence_flag '${flag}' to canonical '${mapped}'.`);
    }
    if (!seen.has(mapped)) {
      seen.add(mapped);
      normalized.push(mapped);
    }
  }
  return normalized;
}

function normalizeBoolean(value, defaultValue) {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false' || lower === 'none' || lower.startsWith('none ')) return false;
    if (lower.includes('not applicable')) return false;
    if (lower.includes('not yet applicable')) return false;
    if (lower.includes('latent')) return true;
    return true;
  }
  return defaultValue;
}

function normalizeSacrificialEconomy(value, existingYield, notes) {
  const isProductive = normalizeBoolean(value, false);
  if (typeof value === 'string') {
    notes.push('Moved legacy sacrificial_economy prose into sacrificial_yield.');
  }
  return {
    sacrificial_economy: isProductive,
    sacrificial_yield: isProductive ? (existingYield ?? (typeof value === 'string' ? value : null)) : null
  };
}

function normalizeLinguisticForm(value) {
  const valid = new Set(['verbal_phrase', 'nominal_phrase', 'adjectival', 'clause', 'sentence', 'multi_sentence']);
  if (valid.has(value)) return value;
  return 'clause';
}

function getCluster(inst) {
  const value = inst.cmt && inst.cmt.cluster_id ? inst.cmt.cluster_id : inst.cluster_id || inst.cluster;
  return CLUSTER_VALUES.has(value) ? value : value;
}

function normalizeInstance(inst, sent, docId, meta) {
  const notes = [];
  const existingCmt = inst.cmt || {};
  const existingKoenigsberg = inst.koenigsberg || {};
  const existingMeta = inst.meta || {};
  const sacrificial = normalizeSacrificialEconomy(
    existingKoenigsberg.sacrificial_economy,
    existingKoenigsberg.sacrificial_yield,
    notes
  );

  const cmt = {
    cluster_id: getCluster(inst),
    source_domain: existingCmt.source_domain || inst.source_domain || null,
    target_domain: existingCmt.target_domain || inst.target_domain || null,
    linguistic_form: normalizeLinguisticForm(existingCmt.linguistic_form || inst.linguistic_form),
    entailments: Array.isArray(existingCmt.entailments) ? existingCmt.entailments : [],
    is_novel_metaphor: typeof existingCmt.is_novel_metaphor === 'boolean' ? existingCmt.is_novel_metaphor : !!inst.is_novel_metaphor,
    is_extended_metaphor: typeof existingCmt.is_extended_metaphor === 'boolean'
      ? existingCmt.is_extended_metaphor
      : !!(existingCmt.extension_group_id || inst.extension_group_id || inst.extension_group),
    extension_group_id: existingCmt.extension_group_id || inst.extension_group_id || inst.extension_group || null,
    co_activated_clusters: Array.isArray(existingCmt.co_activated_clusters) ? existingCmt.co_activated_clusters : [],
    annotation_notes: existingCmt.annotation_notes || existingKoenigsberg.annotator_notes || null
  };

  if (existingCmt.mapping !== undefined) cmt.mapping = existingCmt.mapping;
  if (existingCmt.conventional_or_novel !== undefined || inst.conventional_or_novel !== undefined) {
    cmt.conventional_or_novel = existingCmt.conventional_or_novel || inst.conventional_or_novel;
  }

  const koenigsberg = {
    fantasy_type: normalizeFantasyType(existingKoenigsberg.fantasy_type, notes),
    violence_logic: existingKoenigsberg.violence_logic || null,
    obligatory_frame: normalizeBoolean(existingKoenigsberg.obligatory_frame, false),
    obligatory_frame_notes: typeof existingKoenigsberg.obligatory_frame === 'string'
      ? existingKoenigsberg.obligatory_frame
      : existingKoenigsberg.obligatory_frame_notes || null,
    agent_of_violence: existingKoenigsberg.agent_of_violence || null,
    agent_is_abstract: typeof existingKoenigsberg.agent_is_abstract === 'boolean' ? existingKoenigsberg.agent_is_abstract : false,
    object_of_violence: existingKoenigsberg.object_of_violence || null,
    projected_entity: existingKoenigsberg.projected_entity || null,
    guilt_distribution: existingKoenigsberg.guilt_distribution || null,
    guilt_distribution_notes: existingKoenigsberg.guilt_distribution_notes || null,
    sacrificial_economy: sacrificial.sacrificial_economy,
    sacrificial_yield: sacrificial.sacrificial_yield,
    psychic_defense: existingKoenigsberg.psychic_defense || null,
    psychic_defense_notes: existingKoenigsberg.psychic_defense_notes || null,
    absence_flags: normalizeAbsenceFlags(existingKoenigsberg.absence_flags, notes),
    absence_notes: existingKoenigsberg.absence_notes || null
  };

  if (koenigsberg.absence_flags.length > 0 && !koenigsberg.absence_notes) {
    koenigsberg.absence_notes = 'Legacy annotation flagged structural absence without a separate absence_notes field; see annotation_notes and migration notes.';
  }

  const migrationNote = notes.join(' ');
  cmt.annotation_notes = appendNote(cmt.annotation_notes, migrationNote);

  return {
    instance_id: inst.instance_id,
    sentence_id: inst.sentence_id || sent.sentence_id,
    document_id: inst.document_id || docId,
    document_date: inst.document_date || meta.date || null,
    document_register: inst.document_register || meta.register || null,
    authorship_confidence: inst.authorship_confidence ?? meta.authorship_confidence ?? null,
    span_text: inst.span_text || inst.linguistic_form || sent.text,
    span_char_start: inst.span_char_start ?? inst.char_span_start ?? null,
    span_char_end: inst.span_char_end ?? inst.char_span_end ?? null,
    cmt,
    koenigsberg,
    meta: {
      annotator: existingMeta.annotator || 'lincoln_corpus_reader',
      confidence: existingMeta.confidence ?? inst.confidence ?? 0.75,
      ambiguity_flag: typeof existingMeta.ambiguity_flag === 'boolean' ? existingMeta.ambiguity_flag : !!inst.ambiguity_flag,
      ambiguity_notes: existingMeta.ambiguity_notes || null,
      irony_flag: typeof existingMeta.irony_flag === 'boolean' ? existingMeta.irony_flag : false,
      suppression_flag: typeof existingMeta.suppression_flag === 'boolean' ? existingMeta.suppression_flag : !!inst.suppression_flag,
      suppression_notes: existingMeta.suppression_notes || null
    }
  };
}

function main() {
  const manifest = readJSON(MANIFEST_PATH);
  const metaById = getDocMeta(manifest);
  const files = fs.readdirSync(ANNOTATED_DIR).filter(f => f.endsWith('_annotated.json')).sort();
  let totalInstances = 0;
  let rewrittenInstances = 0;
  let totalFilesChanged = 0;

  console.log('=== Migrating Stage 4 annotations to canonical schema ===\n');

  for (const file of files) {
    const filePath = path.join(ANNOTATED_DIR, file);
    const before = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(before);
    const docId = data.document_id;
    const meta = metaById[docId] || data.meta || {};
    let fileInstances = 0;
    let fileRewritten = 0;

    for (const section of data.sections || []) {
      for (const para of section.paragraphs || []) {
        for (const sent of para.sentences || []) {
          if (!Array.isArray(sent.metaphor_instances)) continue;
          sent.metaphor_instances = sent.metaphor_instances.map(inst => {
            fileInstances++;
            totalInstances++;
            const normalized = normalizeInstance(inst, sent, docId, meta);
            if (JSON.stringify(normalized) !== JSON.stringify(inst)) {
              fileRewritten++;
              rewrittenInstances++;
            }
            return normalized;
          });
        }
      }
    }

    const logEntry = {
      stage: 4,
      agent: 'migrate_annotations_to_stage4.js',
      date: new Date().toISOString().split('T')[0],
      notes: 'Canonicalized legacy annotation instance schema; preserved interpretive content and normalized legacy taxonomy labels.'
    };
    data.pipeline_log = Array.isArray(data.pipeline_log) ? data.pipeline_log : [];
    if (!data.pipeline_log.some(entry => entry.agent === logEntry.agent)) {
      data.pipeline_log.push(logEntry);
    }

    const after = JSON.stringify(data, null, 2) + '\n';
    if (after !== before) {
      fs.writeFileSync(filePath, after);
      totalFilesChanged++;
    }
    console.log(`  ${file}: ${fileInstances} instance(s), ${fileRewritten} normalized, ${sentenceCount(data)} sentence(s)`);
  }

  console.log('\nMigration complete.');
  console.log(`  Files changed:        ${totalFilesChanged}`);
  console.log(`  Instances scanned:    ${totalInstances}`);
  console.log(`  Instances normalized: ${rewrittenInstances}`);
}

main();
