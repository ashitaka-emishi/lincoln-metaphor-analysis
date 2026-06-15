#!/usr/bin/env node
// Builds a derivative evidence-chain layer from validated Stage 4 annotations.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANNOTATED_DIR = path.join(ROOT, 'corpus', 'annotated');
const MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');
const OUTPUT_DIR = path.join(ROOT, 'data', 'evidence');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'annotation-evidence.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function clusterSourceFamily(clusterId) {
  return {
    cluster_01_body_organism: 'body_organism',
    cluster_02_covenant_oath: 'law_contract_oath',
    cluster_03_experiment_proposition: 'experiment_proof_logic',
    cluster_04_birth_creation: 'birth_generation',
    cluster_05_fathers_inheritance: 'family_inheritance',
    cluster_06_providence_theodicy: 'religion_providence_theodicy'
  }[clusterId] || null;
}

function clusterTargetFamily(clusterId) {
  return {
    cluster_01_body_organism: 'nation_union',
    cluster_02_covenant_oath: 'constitution_law',
    cluster_03_experiment_proposition: 'democracy_self_government',
    cluster_04_birth_creation: 'freedom_liberty',
    cluster_05_fathers_inheritance: 'founding_fathers',
    cluster_06_providence_theodicy: 'providence_history'
  }[clusterId] || null;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return null;
}

function makeRecord(inst, sentence, paragraph, section, docMeta) {
  const clusterId = inst.cmt && inst.cmt.cluster_id;
  const confidence = inst.meta && inst.meta.confidence;
  const absenceFlags = (inst.koenigsberg && inst.koenigsberg.absence_flags) || [];

  return {
    audit_id: inst.instance_id,
    migration_status: 'derived_from_stage4_legacy_annotation',
    source_stage: 'stage4_annotated_json',
    source_file: `corpus/annotated/${inst.document_id}_annotated.json`,
    document: {
      id: inst.document_id,
      title: docMeta.title || null,
      short_title: docMeta.short_title || null,
      date: docMeta.date || inst.document_date || null,
      period: docMeta.period || null,
      genre: docMeta.genre || null,
      register: docMeta.register || inst.document_register || null,
      authorship: docMeta.authorship || null,
      authorship_confidence: docMeta.authorship_confidence ?? inst.authorship_confidence ?? null,
      source_edition: docMeta.source_edition || docMeta.source_text || null,
      source_url: docMeta.source_url || null,
      editorial_status: docMeta.editorial_status || null,
      risk_flags: docMeta.risk_flags || []
    },
    location: {
      section_id: section.section_id || null,
      paragraph_id: paragraph.paragraph_id || null,
      sentence_id: inst.sentence_id,
      sentence_text: sentence.text || null,
      span_text: inst.span_text,
      span_char_start: inst.span_char_start ?? null,
      span_char_end: inst.span_char_end ?? null
    },
    lexical_unit: {
      text: inst.span_text,
      mipvu_decision: 'metaphor_related',
      mipvu_decision_source: 'inferred_from_existing_stage4_metaphor_instance',
      contextual_meaning: firstNonEmpty(inst.lexical_unit && inst.lexical_unit.contextual_meaning, inst.cmt && inst.cmt.target_domain),
      basic_meaning: firstNonEmpty(inst.lexical_unit && inst.lexical_unit.basic_meaning, inst.cmt && inst.cmt.source_domain),
      contrast: true,
      comparison: true,
      historical_semantics_note: firstNonEmpty(inst.lexical_unit && inst.lexical_unit.historical_semantics_note, null),
      migration_note: 'Existing Stage 4 annotations did not separate MIPVU lexical-unit fields; contextual/basic meanings are derived from CMT target/source-domain fields without overwriting Stage 4.'
    },
    cmt: {
      cluster_id: clusterId || null,
      source_domain: inst.cmt && inst.cmt.source_domain || null,
      source_domain_family: clusterSourceFamily(clusterId),
      target_domain: inst.cmt && inst.cmt.target_domain || null,
      target_domain_family: clusterTargetFamily(clusterId),
      linguistic_form: inst.cmt && inst.cmt.linguistic_form || null,
      entailments: inst.cmt && Array.isArray(inst.cmt.entailments) ? inst.cmt.entailments : [],
      is_novel_metaphor: inst.cmt && inst.cmt.is_novel_metaphor === true,
      is_extended_metaphor: inst.cmt && inst.cmt.is_extended_metaphor === true,
      extension_group_id: inst.cmt && inst.cmt.extension_group_id || null,
      co_activated_clusters: inst.cmt && Array.isArray(inst.cmt.co_activated_clusters) ? inst.cmt.co_activated_clusters : [],
      mapping: inst.cmt && inst.cmt.mapping || null,
      annotation_notes: inst.cmt && inst.cmt.annotation_notes || null
    },
    koenigsberg: {
      fantasy_type: inst.koenigsberg && inst.koenigsberg.fantasy_type || null,
      violence_logic: inst.koenigsberg && inst.koenigsberg.violence_logic || null,
      obligatory_frame: inst.koenigsberg && inst.koenigsberg.obligatory_frame === true,
      obligatory_frame_notes: inst.koenigsberg && inst.koenigsberg.obligatory_frame_notes || null,
      projected_entity: inst.koenigsberg && inst.koenigsberg.projected_entity || null,
      guilt_distribution: inst.koenigsberg && inst.koenigsberg.guilt_distribution || null,
      guilt_distribution_notes: inst.koenigsberg && inst.koenigsberg.guilt_distribution_notes || null,
      sacrificial_economy: inst.koenigsberg && inst.koenigsberg.sacrificial_economy === true,
      sacrificial_yield: inst.koenigsberg && inst.koenigsberg.sacrificial_yield || null,
      psychic_defense: inst.koenigsberg && inst.koenigsberg.psychic_defense || null,
      psychic_defense_notes: inst.koenigsberg && inst.koenigsberg.psychic_defense_notes || null
    },
    agency_absence: {
      agent_of_violence: inst.koenigsberg && inst.koenigsberg.agent_of_violence || null,
      agent_is_abstract: inst.koenigsberg && inst.koenigsberg.agent_is_abstract === true,
      object_of_violence: inst.koenigsberg && inst.koenigsberg.object_of_violence || null,
      absence_flags: absenceFlags,
      absence_notes: inst.koenigsberg && inst.koenigsberg.absence_notes || null
    },
    confidence: {
      score: typeof confidence === 'number' ? confidence : null,
      ambiguity_flag: inst.meta && inst.meta.ambiguity_flag === true,
      ambiguity_notes: inst.meta && inst.meta.ambiguity_notes || null,
      rival_reading: firstNonEmpty(inst.meta && inst.meta.rival_reading, inst.meta && inst.meta.ambiguity_notes, null),
      irony_flag: inst.meta && inst.meta.irony_flag === true,
      suppression_flag: inst.meta && inst.meta.suppression_flag === true,
      suppression_notes: inst.meta && inst.meta.suppression_notes || null
    },
    claim_anchor: {
      document_id: inst.document_id,
      sentence_id: inst.sentence_id,
      instance_id: inst.instance_id,
      cluster_id: clusterId || null,
      span_text: inst.span_text,
      source_url: docMeta.source_url || null
    }
  };
}

function addIndex(index, key, auditId) {
  if (!key) return;
  if (!index[key]) index[key] = [];
  index[key].push(auditId);
}

function main() {
  const manifest = readJSON(MANIFEST_PATH);
  const docMeta = new Map((manifest.documents || []).map(doc => [doc.id, doc]));
  const files = fs.readdirSync(ANNOTATED_DIR).filter(file => file.endsWith('_annotated.json')).sort();

  const records = [];
  const indexes = {
    by_document: {},
    by_sentence: {},
    by_cluster: {},
    by_fantasy_type: {},
    by_absence_flag: {},
    high_confidence: [],
    ambiguous: [],
    suppression: []
  };

  for (const file of files) {
    const annotated = readJSON(path.join(ANNOTATED_DIR, file));
    const meta = docMeta.get(annotated.document_id) || {};

    for (const section of annotated.sections || []) {
      for (const paragraph of section.paragraphs || []) {
        for (const sentence of paragraph.sentences || []) {
          for (const inst of sentence.metaphor_instances || []) {
            const record = makeRecord(inst, sentence, paragraph, section, meta);
            records.push(record);

            addIndex(indexes.by_document, record.document.id, record.audit_id);
            addIndex(indexes.by_sentence, record.location.sentence_id, record.audit_id);
            addIndex(indexes.by_cluster, record.cmt.cluster_id, record.audit_id);
            addIndex(indexes.by_fantasy_type, record.koenigsberg.fantasy_type, record.audit_id);
            for (const flag of record.agency_absence.absence_flags) addIndex(indexes.by_absence_flag, flag, record.audit_id);
            if (record.confidence.score >= 0.90) indexes.high_confidence.push(record.audit_id);
            if (record.confidence.ambiguity_flag) indexes.ambiguous.push(record.audit_id);
            if (record.confidence.suppression_flag) indexes.suppression.push(record.audit_id);
          }
        }
      }
    }
  }

  const output = {
    version: '1.0',
    generated: today(),
    status: 'complete',
    source_stage: 'stage4_legacy_annotations',
    migration_policy: 'preserve_stage4_generate_derivative',
    total_records: records.length,
    records,
    indexes,
    pipeline_log: [
      {
        stage: '4A',
        agent: 'build_evidence_chains.js',
        date: today(),
        total_records: records.length
      }
    ]
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Evidence chains written to ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`Records exported: ${records.length}`);
}

main();
