#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CREATED_DATE = '2026-08-13';

const DEFAULT_PATHS = {
  legacySample: 'data/reliability/reliability-sample.json',
  coreInventory: 'data/corpus/corpus-v4-core-inventory.json',
  validationInventory: 'data/corpus/corpus-v4-validation-inventory.json',
  coverageSummary: 'data/corpus/corpus-v4-coverage-summary.json',
  impactReport: 'data/corpus/corpus-v4-expansion-impact-report.json',
  segmentedCoreDir: 'corpus/segmented/v4-core',
  sampleFrame: 'data/corpus/corpus-v4-reliability-sample-frame.json',
  reportMarkdown: 'docs/corpus/corpus-v4-reliability-sampling-update.md'
};

const SAMPLE_SELECTION = [
  {
    doc_id: 'doc_001',
    tier: 'v4-core',
    role: 'legacy_positive_anchor',
    required_criteria: ['documents_from_original_v1_corpus', 'positive_metaphor_cases', 'disease_purification_negative_check_cases'],
    rationale: 'Carries current Stage 4A positive metaphor anchors and disease/purification absence flags from the v1 reliability frame.'
  },
  {
    doc_id: 'doc_004',
    tier: 'v4-core',
    role: 'legacy_antebellum_slavery_anchor',
    required_criteria: ['documents_from_original_v1_corpus', 'antebellum_slavery_text', 'positive_metaphor_cases', 'ambiguous_cases'],
    rationale: 'Preserves a high-priority antebellum slavery argument with known transcription and boundary-risk cautions.'
  },
  {
    doc_id: 'doc_023',
    tier: 'v4-core',
    role: 'new_early_political_formation',
    required_criteria: ['documents_from_new_v4_core_additions', 'early_political_formation_text', 'negative_controls'],
    rationale: 'Adds pre-Lyceum political self-definition as an early formation check absent from the old reliability sample.'
  },
  {
    doc_id: 'doc_027',
    tier: 'v4-core',
    role: 'new_secession_crisis',
    required_criteria: ['documents_from_new_v4_core_additions', 'secession_crisis_text', 'positive_metaphor_cases'],
    rationale: 'Adds a secession-crisis public address to test founding-proposition and Union legitimation language.'
  },
  {
    doc_id: 'doc_028',
    tier: 'v4-core',
    role: 'new_early_war_policy',
    required_criteria: ['documents_from_new_v4_core_additions', 'early_war_text', 'negative_controls'],
    rationale: 'Adds an early-war congressional-policy text and a longer denominator for sentence-level identification controls.'
  },
  {
    doc_id: 'doc_035',
    tier: 'v4-core',
    role: 'new_race_agency_boundary',
    required_criteria: ['documents_from_new_v4_core_additions', 'emancipation_text', 'agency_absence_cases', 'ambiguous_cases'],
    rationale: 'Adds the African American delegation address as a race, agency, audience, and emancipation boundary case.'
  },
  {
    doc_id: 'doc_041',
    tier: 'v4-core',
    role: 'new_late_war_sacrifice',
    required_criteria: ['documents_from_new_v4_core_additions', 'late_war_providence_sacrifice_text', 'ambiguous_cases'],
    rationale: 'Adds a late-war condolence text for sacrifice/mourning and authorship-boundary review.'
  },
  {
    doc_id: 'doc_022',
    tier: 'v4-core',
    role: 'legacy_reconstruction_transition',
    required_criteria: ['documents_from_original_v1_corpus', 'reconstruction_transition_text', 'positive_metaphor_cases'],
    rationale: 'Keeps the v1 Last Address as the reconstruction-transition anchor for continuity with existing coded evidence.'
  },
  {
    doc_id: 'doc_070',
    tier: 'v4-validation',
    role: 'validation_negative_check',
    required_criteria: ['disease_purification_negative_check_cases', 'negative_controls'],
    rationale: 'Adds the validation-corpus negative-finding candidate identified by the v4 coverage summary; it requires light annotation before coding use.'
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
  if (!pathIsInside(ROOT, target)) {
    return;
  }

  const relative = path.relative(ROOT, target);
  const allowed = new Set([
    DEFAULT_PATHS.sampleFrame,
    DEFAULT_PATHS.reportMarkdown
  ]);
  if (!allowed.has(relative)) {
    throw new Error(`Refusing to write undeclared v4 reliability sampling output path: ${relative}`);
  }
  if (relative.startsWith('corpus/raw/') || relative.startsWith('corpus/segmented/') || relative.startsWith('corpus/annotated/')) {
    throw new Error(`Refusing to write corpus source or annotation path: ${relative}`);
  }
}

function flattenSentences(segmented) {
  const sentences = [];
  for (const section of segmented.sections || []) {
    for (const paragraph of section.paragraphs || []) {
      for (const sentence of paragraph.sentences || []) {
        sentences.push({
          sentence_id: sentence.sentence_id,
          text: sentence.text || ''
        });
      }
    }
  }
  return sentences;
}

function selectEvenlySpaced(items, count) {
  if (items.length <= count) return items;
  if (count <= 1) return [items[Math.floor(items.length / 2)]];
  const selected = [];
  const last = items.length - 1;
  for (let index = 0; index < count; index += 1) {
    selected.push(items[Math.round((index * last) / (count - 1))]);
  }
  return selected;
}

function inventoryById(...inventories) {
  const byId = new Map();
  for (const inventory of inventories) {
    for (const document of inventory.documents || []) {
      if (!byId.has(document.doc_id)) {
        byId.set(document.doc_id, document);
      }
    }
  }
  return byId;
}

function readSegmentedSentences(paths, docId) {
  const segmentedPath = path.join(paths.segmentedCoreDir, `${docId}.json`);
  if (!fs.existsSync(absolute(segmentedPath))) {
    return [];
  }
  return flattenSentences(readJSON(segmentedPath));
}

function legacySampleStats(legacySample) {
  const byDoc = new Map((legacySample.documents || []).map(document => [document.id, document]));
  return byDoc;
}

function buildTarget(selection, document, legacyDoc, paths) {
  const segmentedSentences = selection.tier === 'v4-core'
    ? readSegmentedSentences(paths, selection.doc_id)
    : [];
  const negativeControls = selectEvenlySpaced(segmentedSentences, 3).map(sentence => ({
    sentence_id: sentence.sentence_id,
    sentence_text: sentence.text,
    status: document.included_in_v1 ? 'existing_negative_control_candidate' : 'pending_v4_annotation_negative_control_candidate'
  }));

  return {
    doc_id: document.doc_id,
    short_title: document.short_title,
    date: document.date,
    corpus_tier: selection.tier,
    period: document.period,
    genre: document.genre,
    audience: document.audience,
    included_in_v1: document.included_in_v1,
    annotation_status: document.annotation_status,
    role: selection.role,
    rationale: selection.rationale,
    required_criteria: selection.required_criteria,
    readiness: document.annotation_status === 'fully_annotated'
      ? 'ready_as_legacy_stage4a_anchor'
      : 'requires_v4_annotation_before_metric_use',
    legacy_reliability_context: legacyDoc ? {
      included_in_v3_sample: true,
      evidence_records_total: legacyDoc.evidence_records_total,
      identification_units_total: legacyDoc.identification_units_total
    } : {
      included_in_v3_sample: false
    },
    sentence_denominator: segmentedSentences.length || null,
    negative_control_candidates: negativeControls
  };
}

function summarizeCriteria(targets) {
  const criteria = [
    'documents_from_original_v1_corpus',
    'documents_from_new_v4_core_additions',
    'early_political_formation_text',
    'antebellum_slavery_text',
    'secession_crisis_text',
    'early_war_text',
    'emancipation_text',
    'late_war_providence_sacrifice_text',
    'reconstruction_transition_text',
    'positive_metaphor_cases',
    'negative_controls',
    'agency_absence_cases',
    'disease_purification_negative_check_cases',
    'ambiguous_cases'
  ];
  return criteria.map(criterion => ({
    criterion,
    status: targets.some(target => target.required_criteria.includes(criterion)) ? 'covered' : 'missing',
    doc_ids: targets
      .filter(target => target.required_criteria.includes(criterion))
      .map(target => target.doc_id)
  }));
}

function alignClaimsToTargets(claimCoverage, targets) {
  const claimCriteria = {
    slavery_emancipation: ['antebellum_slavery_text', 'emancipation_text'],
    war_powers: ['early_war_text'],
    sacrifice_mourning: ['late_war_providence_sacrifice_text'],
    providence: ['late_war_providence_sacrifice_text'],
    race_black_military_agency: ['agency_absence_cases'],
    disease_purification_negative_check: ['disease_purification_negative_check_cases']
  };

  return claimCoverage.map(area => {
    const criteria = claimCriteria[area.key] || [];
    return {
      key: area.key,
      title: area.title,
      assessment: area.assessment,
      selected_doc_ids: targets
        .filter(target => target.required_criteria.some(criterion => criteria.includes(criterion)))
        .map(target => target.doc_id)
    };
  });
}

function buildSampleFrame(paths) {
  const legacySample = readJSON(paths.legacySample);
  const coreInventory = readJSON(paths.coreInventory);
  const validationInventory = readJSON(paths.validationInventory);
  const coverageSummary = readJSON(paths.coverageSummary);
  const impactReport = readJSON(paths.impactReport);
  const byId = inventoryById(coreInventory, validationInventory);
  const legacyByDoc = legacySampleStats(legacySample);

  const targets = SAMPLE_SELECTION.map(selection => {
    const document = byId.get(selection.doc_id);
    if (!document) {
      throw new Error(`Reliability sample target missing from v4 inventories: ${selection.doc_id}`);
    }
    return buildTarget(selection, document, legacyByDoc.get(selection.doc_id), paths);
  });

  const criteriaCoverage = summarizeCriteria(targets);
  const missingCriteria = criteriaCoverage.filter(row => row.status !== 'covered');
  if (missingCriteria.length > 0) {
    throw new Error(`V4 reliability sample frame misses required criteria: ${missingCriteria.map(row => row.criterion).join(', ')}`);
  }

  const coreTargets = targets.filter(target => target.corpus_tier === 'v4-core');
  const v1Targets = targets.filter(target => target.included_in_v1);
  const newCoreTargets = targets.filter(target => target.corpus_tier === 'v4-core' && !target.included_in_v1);

  return {
    frame_id: 'corpus_v4_reliability_sample_frame',
    corpus_version: 'v4',
    created_date: CREATED_DATE,
    status: 'pass',
    inputs: {
      legacy_sample: displayPath(paths.legacySample),
      core_inventory: displayPath(paths.coreInventory),
      validation_inventory: displayPath(paths.validationInventory),
      coverage_summary: displayPath(paths.coverageSummary),
      impact_report: displayPath(paths.impactReport),
      segmented_core_dir: displayPath(paths.segmentedCoreDir)
    },
    outputs: {
      sample_frame: displayPath(paths.sampleFrame),
      report_markdown: displayPath(paths.reportMarkdown)
    },
    summary: {
      legacy_corpus_version: 'v1',
      legacy_sample_documents: legacySample.totals.documents,
      legacy_sample_scope: 'v3/v1 human reliability remains valid as a prior study tied to the 28-document annotated corpus.',
      v4_core_documents: coreInventory.document_count,
      v4_validation_documents: validationInventory.document_count,
      selected_documents_total: targets.length,
      selected_core_documents: coreTargets.length,
      selected_validation_documents: targets.length - coreTargets.length,
      selected_v1_documents: v1Targets.length,
      selected_new_v4_core_documents: newCoreTargets.length,
      selected_core_percentage: Number(((coreTargets.length / coreInventory.document_count) * 100).toFixed(2)),
      future_use: 'Use this frame to generate future v4 human coding packets after v4 additions and selected validation candidates receive the appropriate annotation layer.'
    },
    criteria_coverage: criteriaCoverage,
    selected_documents: targets,
    claim_alignment: alignClaimsToTargets(coverageSummary.claim_coverage, targets),
    methodological_boundaries: [
      impactReport.summary.annotation_boundary,
      'Corpus v1/v3 reliability results remain valid for their original corpus version and should not be restated as v4 reliability results.',
      'New v4 reliability sampling can be used for future human coding only after packet generation, coder assignment, submission ingestion, and adjudication gates run.',
      'Validation-corpus targets are lightly annotated candidates; they are included to force denominator and negative-check review, not to inflate the fully annotated core.'
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

function renderMarkdown(frame) {
  return [
    '# V4 Reliability Sampling Update',
    '',
    'Generated from the current Stage 4 reliability sample, v4 corpus inventories, the v4 coverage summary, and the v4 expansion impact report.',
    '',
    '## Summary',
    '',
    table(['Measure', 'Value'], [
      ['V3/v1 prior sample documents', frame.summary.legacy_sample_documents],
      ['V4 core documents', frame.summary.v4_core_documents],
      ['V4 validation documents', frame.summary.v4_validation_documents],
      ['Selected v4 sample-frame documents', frame.summary.selected_documents_total],
      ['Selected v4-core documents', frame.summary.selected_core_documents],
      ['Selected validation documents', frame.summary.selected_validation_documents],
      ['Selected original-v1 documents', frame.summary.selected_v1_documents],
      ['Selected new v4-core documents', frame.summary.selected_new_v4_core_documents],
      ['Selected core percentage', `${frame.summary.selected_core_percentage}%`]
    ]),
    '',
    '## Corpus-Version Boundary',
    '',
    frame.summary.legacy_sample_scope,
    '',
    'The existing Stage 4H and Stage 4M reliability artifacts remain tied to the 28-document v1 annotated corpus. They should be cited as prior reliability evidence, not as completed v4 reliability.',
    '',
    '## V4 Sample Frame',
    '',
    table(
      ['Doc ID', 'Tier', 'Short Title', 'Period', 'Genre', 'Role', 'Readiness'],
      frame.selected_documents.map(target => [
        target.doc_id,
        target.corpus_tier,
        target.short_title,
        target.period,
        target.genre,
        target.role,
        target.readiness
      ])
    ),
    '',
    '## Sampling Criteria Coverage',
    '',
    table(
      ['Criterion', 'Status', 'Doc IDs'],
      frame.criteria_coverage.map(row => [row.criterion, row.status, row.doc_ids.join(', ')])
    ),
    '',
    '## Human-Coding Use',
    '',
    'New v4 reliability sampling can be used for future v4 human coding after the v4 packet generator converts this frame into blind coding units. The frame intentionally includes original v1 documents, new v4 core additions, and one validation-corpus negative-check candidate.',
    '',
    '## Negative Controls and Ambiguity',
    '',
    'Negative controls are represented as deterministic sentence candidates for v4-core documents. Ambiguous cases are represented by provenance, authorship, audience, and policy-boundary targets that should receive coder attention during packet generation.',
    '',
    '## Methodological Boundaries',
    '',
    bulletList(frame.methodological_boundaries)
  ].join('\n').trimEnd() + '\n';
}

function writeOutput(outputPath, contents, options) {
  assertAllowedOutput(outputPath);
  const target = absolute(outputPath);
  const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (options.check) {
    if (existing !== contents) {
      throw new Error(`${displayPath(outputPath)} is stale; rerun scripts/corpus/generate-reliability-sample-update.js`);
    }
    return false;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
  return existing !== contents;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const frame = buildSampleFrame(options.paths);
  const markdown = renderMarkdown(frame);
  const changed = [
    writeOutput(options.paths.sampleFrame, stableJSON(frame), options),
    writeOutput(options.paths.reportMarkdown, markdown, options)
  ].some(Boolean);

  if (options.json) {
    console.log(JSON.stringify({
      status: frame.status,
      changed,
      summary: frame.summary
    }, null, 2));
  } else {
    console.log(`V4 reliability sampling update: ${frame.status}`);
    console.log(`Selected documents: ${frame.summary.selected_documents_total}; v4 core: ${frame.summary.selected_core_documents}; validation: ${frame.summary.selected_validation_documents}`);
    console.log(`${options.check ? 'Checked' : 'Wrote'} ${displayPath(options.paths.sampleFrame)} and ${displayPath(options.paths.reportMarkdown)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSampleFrame,
  renderMarkdown,
  alignClaimsToTargets,
  parseArgs
};
