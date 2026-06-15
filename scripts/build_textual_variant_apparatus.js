#!/usr/bin/env node
// Builds a publication-facing textual variant apparatus for high-risk corpus documents.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');
const ANNOTATED_DIR = path.join(ROOT, 'corpus', 'annotated');
const OUTPUT_PATH = path.join(ROOT, 'data', 'metadata', 'textual-variant-apparatus.json');
const PAGE_PATH = path.join(ROOT, 'docs', 'methodology', 'textual-variant-apparatus.md');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function collectAnchors(docId) {
  const filePath = path.join(ANNOTATED_DIR, `${docId}_annotated.json`);
  if (!fs.existsSync(filePath)) {
    return { sentence_ids: [], instance_ids: [] };
  }
  const data = readJSON(filePath);
  const sentenceIds = new Set();
  const instanceIds = [];

  for (const section of data.sections || []) {
    for (const paragraph of section.paragraphs || []) {
      for (const sentence of paragraph.sentences || []) {
        for (const instance of sentence.metaphor_instances || []) {
          sentenceIds.add(sentence.sentence_id);
          instanceIds.push(instance.instance_id);
        }
      }
    }
  }

  return {
    sentence_ids: [...sentenceIds],
    instance_ids: instanceIds
  };
}

const RISK_POLICIES = {
  transcription_noise: {
    risk_category: 'reported_or_extemporaneous_transcription',
    source_tradition: 'Collected Works text of a reported or extemporaneous speech where wording may preserve transcription or reporting noise.',
    relevant_variants_or_limits: [
      'Exact wording and span boundaries require caution.',
      'Cluster-level patterns are safer than claims that depend on a single disputed word.'
    ],
    default_annotation_decision: 'No current Stage 4 annotation adjustment. Treat exact lexical boundaries as cautionary where a claim depends on wording precision.'
  },
  transcription_variants: {
    risk_category: 'newspaper_transcription_variants',
    source_tradition: 'Collected Works debate text based on nineteenth-century newspaper transcriptions and adversarial campaign reporting.',
    relevant_variants_or_limits: [
      'Lincoln-authored turns are the annotation universe; Douglas turns and editorial apparatus are excluded from metaphor claims.',
      'Debate wording and interruption boundaries can affect fine lexical-unit claims.'
    ],
    default_annotation_decision: 'No current Stage 4 annotation adjustment. Use debate instances for recurring architecture and register-controlled patterns, not single-word proof.'
  },
  two_versions: {
    risk_category: 'parallel_version_tradition',
    source_tradition: 'Address has both an extemporaneous/transcribed tradition and Lincoln self-edited written reconstruction.',
    relevant_variants_or_limits: [
      'The annotated text follows the Lincoln self-edited written version used by the corpus.',
      'Version differences matter most for claims about diction, not for the broad Providence/companionship frame.'
    ],
    default_annotation_decision: 'No current Stage 4 annotation adjustment. Publication claims should name that the annotated object is the written reconstruction.'
  },
  co_authored_seward: {
    risk_category: 'collaborative_revision_tradition',
    source_tradition: 'First Inaugural text includes Seward-drafted or Seward-revised material within a Lincoln-primary address.',
    relevant_variants_or_limits: [
      'Authorship-sensitive claims require caution around revised passages.',
      'The final peroration is especially important because it contains a high-value covenant/body-memory metaphor.'
    ],
    default_annotation_decision: 'No current Stage 4 annotation adjustment. Keep authorship caveat attached to affected sentence anchors and use high-authorship-confidence controls for aggregate claims.'
  },
  date_uncertain: {
    risk_category: 'fragment_date_and_context_uncertainty',
    source_tradition: 'Private fragment with uncertain date and incomplete surrounding context.',
    relevant_variants_or_limits: [
      'The fragment opens mid-argument, so the antecedent context for the apple-picture frame is missing.',
      'The date should be treated as approximate in diachronic claims.'
    ],
    default_annotation_decision: 'No current Stage 4 annotation adjustment. Use the fragment as structural evidence, not as frequency evidence equivalent to public addresses.'
  },
  manuscript_variants: {
    risk_category: 'manuscript_variant_tradition',
    source_tradition: 'Gettysburg Address has a manuscript and delivery tradition with variant wordings across witnesses and later copies.',
    relevant_variants_or_limits: [
      'Claims should rely on stable architecture across the address rather than isolated wording where manuscript variants are material.',
      'The corpus text supports the annotated birth, dedication, proposition, and sacrificial-economy structure.'
    ],
    default_annotation_decision: 'No current Stage 4 annotation adjustment. Treat the address-level architecture as stable; flag exact diction claims as variant-sensitive.'
  }
};

const DOC_OVERRIDES = {
  doc_006d: {
    publication_caveat: 'This debate currently has no Stage 4 metaphor instances. Use it as absence/suppression evidence only with the debate-transcription caveat attached.',
    annotation_decision: 'No annotation adjustment because no metaphor instances are coded; the variant apparatus documents why absence claims should remain register- and source-risk controlled.'
  },
  doc_008: {
    publication_caveat: 'The Springfield Farewell should be cited as the corpus version of Lincoln self-editing his farewell, not as a verbatim transcript of the extemporaneous delivery.'
  },
  doc_009: {
    focal_sentence_ids: ['doc_009_s01_p40_s05'],
    focal_instance_ids: ['inst_00077'],
    publication_caveat: 'The final peroration is retained as part of the received First Inaugural text, but authorship-sensitive interpretation should flag Seward revision risk.'
  },
  doc_011: {
    publication_caveat: 'Use as evidence for Lincoln theorizing the apple-picture hierarchy, with date and missing-context limits stated in diachronic claims.'
  },
  doc_017: {
    publication_caveat: 'Use Gettysburg for address-level metaphor architecture. Avoid overclaiming from single-word diction unless the variant tradition has been checked.'
  }
};

function mergePolicy(doc) {
  const policies = doc.risk_flags.map(flag => RISK_POLICIES[flag]).filter(Boolean);
  if (policies.length === 0) {
    throw new Error(`${doc.id}: no policy for risk flags ${doc.risk_flags.join(', ')}`);
  }

  const categories = [...new Set(policies.map(policy => policy.risk_category))];
  const limits = [...new Set(policies.flatMap(policy => policy.relevant_variants_or_limits))];
  const sourceTraditions = [...new Set(policies.map(policy => policy.source_tradition))];
  const decisions = [...new Set(policies.map(policy => policy.default_annotation_decision))];

  return {
    risk_categories: categories,
    source_traditions: sourceTraditions,
    relevant_variants_or_limits: limits,
    annotation_decision: decisions.join(' ')
  };
}

function buildRecord(doc) {
  const anchors = collectAnchors(doc.id);
  const policy = mergePolicy(doc);
  const override = DOC_OVERRIDES[doc.id] || {};

  const sentenceIds = override.focal_sentence_ids || anchors.sentence_ids;
  const instanceIds = override.focal_instance_ids || anchors.instance_ids;

  return {
    apparatus_id: `txtvar_${doc.id}`,
    document: {
      id: doc.id,
      title: doc.title,
      short_title: doc.short_title,
      date: doc.date,
      date_precision: doc.date_precision,
      register: doc.register,
      authorship: doc.authorship,
      authorship_confidence: doc.authorship_confidence,
      source_text: doc.source_text,
      source_edition: doc.source_edition,
      source_url: doc.source_url,
      editorial_status: doc.editorial_status,
      risk_flags: doc.risk_flags
    },
    risk_categories: policy.risk_categories,
    source_traditions: policy.source_traditions,
    relevant_variants_or_limits: policy.relevant_variants_or_limits,
    affected_scope: sentenceIds.length > 0
      ? 'Annotated sentence anchors and document-level source-risk caveat.'
      : 'Document-level source-risk caveat; no current annotated metaphor instances.',
    sentence_ids: sentenceIds,
    instance_ids: instanceIds,
    annotation_decision: override.annotation_decision || policy.annotation_decision,
    publication_caveat: override.publication_caveat || 'Attach source-risk caveat when using this document for fine-grained wording, span-boundary, or authorship-sensitive claims.',
    follow_up_required: false,
    follow_up_note: 'No current annotation adjustment required. A future diplomatic collation could refine exact-wording claims.'
  };
}

function mdLink(label, href) {
  return `[${label}](${href})`;
}

function renderPage(apparatus) {
  const rows = apparatus.records.map(record => {
    const doc = record.document;
    return `| ${doc.id} | ${doc.short_title} | ${doc.risk_flags.join(', ')} | ${record.risk_categories.join(', ')} | ${record.annotation_decision.split('.')[0]}. |`;
  }).join('\n');

  const sections = apparatus.records.map(record => {
    const doc = record.document;
    const sentenceText = record.sentence_ids.length ? record.sentence_ids.join(', ') : 'No annotated sentence anchors';
    const instanceText = record.instance_ids.length ? record.instance_ids.join(', ') : 'No Stage 4 instances';
    return [
      `## ${doc.id} - ${doc.short_title}`,
      '',
      `Source: ${mdLink(doc.source_edition, doc.source_url)}`,
      '',
      `Risk flags: ${doc.risk_flags.join(', ')}`,
      '',
      `Source tradition: ${record.source_traditions.join(' ')}`,
      '',
      'Relevant limits:',
      '',
      ...record.relevant_variants_or_limits.map(limit => `- ${limit}`),
      '',
      `Sentence anchors: ${sentenceText}`,
      '',
      `Instance anchors: ${instanceText}`,
      '',
      `Annotation decision: ${record.annotation_decision}`,
      '',
      `Publication caveat: ${record.publication_caveat}`,
      ''
    ].join('\n');
  }).join('\n');

  return [
    '---',
    'title: "Textual Variant Apparatus"',
    'draft: false',
    '---',
    '',
    '# Textual Variant Apparatus',
    '',
    'This page records the source-risk layer for corpus documents whose transmission, transcription, manuscript, date, or collaborative-revision traditions could affect interpretation.',
    '',
    'The apparatus is generated from `corpus/corpus_manifest.json` and the Stage 4 annotated files:',
    '',
    '```bash',
    'npm run variants:apparatus',
    '```',
    '',
    `Generated: ${apparatus.generated}`,
    '',
    '## Interpretation Rule',
    '',
    'A source-risk caveat is not an annotation finding. Stage 4 annotations remain unchanged unless a variant materially changes the metaphor span, source domain, target domain, cluster assignment, or authorship attribution. Current review found no required annotation adjustments; the apparatus marks where publication claims should avoid overprecision.',
    '',
    '## High-Risk Documents',
    '',
    '| ID | Document | Risk Flags | Risk Categories | Annotation Decision |',
    '| --- | --- | --- | --- | --- |',
    rows,
    '',
    '## Apparatus Records',
    '',
    sections
  ].join('\n');
}

function main() {
  const manifest = readJSON(MANIFEST_PATH);
  const highRiskDocs = (manifest.documents || []).filter(doc => Array.isArray(doc.risk_flags) && doc.risk_flags.length > 0);

  const apparatus = {
    version: '1.0',
    generated: today(),
    status: 'complete',
    source_manifest: 'corpus/corpus_manifest.json',
    source_annotations: 'corpus/annotated',
    migration_policy: 'preserve_stage4_record_source_risk_derivative',
    interpretation_rule: 'Source-risk caveats qualify publication claims but do not change Stage 4 annotations unless a variant affects metaphor span, mapping, cluster assignment, or authorship attribution.',
    total_documents: highRiskDocs.length,
    records: highRiskDocs.map(buildRecord),
    indexes: {
      by_document: Object.fromEntries(highRiskDocs.map((doc, index) => [doc.id, `txtvar_${doc.id}`])),
      by_risk_flag: {}
    }
  };

  for (const record of apparatus.records) {
    for (const flag of record.document.risk_flags) {
      if (!apparatus.indexes.by_risk_flag[flag]) apparatus.indexes.by_risk_flag[flag] = [];
      apparatus.indexes.by_risk_flag[flag].push(record.apparatus_id);
    }
  }

  ensureDir(OUTPUT_PATH);
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(apparatus, null, 2)}\n`);

  ensureDir(PAGE_PATH);
  fs.writeFileSync(PAGE_PATH, `${renderPage(apparatus)}\n`);

  console.log(`Textual variant apparatus written to ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`Textual variant page written to ${path.relative(ROOT, PAGE_PATH)}`);
  console.log(`High-risk documents exported: ${apparatus.total_documents}`);
}

main();
