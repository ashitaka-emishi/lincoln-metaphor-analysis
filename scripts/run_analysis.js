#!/usr/bin/env node
// Stage 6: reads concordance.json, computes cluster stats, writes analysis.json.
// Preserves manually-written fields (analyst_notes, political_moral_work, etc.).
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONCORDANCE_PATH = path.join(ROOT, 'concordance', 'concordance.json');
const ANALYSIS_PATH = path.join(ROOT, 'analysis', 'analysis.json');

function topN(countMap, n) {
  return Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function rate(numerator, denominator) {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function dominant(countMap) {
  let max = 0, winner = null;
  for (const [k, v] of Object.entries(countMap)) {
    if (v > max) { max = v; winner = k; }
  }
  return winner;
}

function main() {
  console.log('=== Running Analysis (Stage 6) ===\n');

  if (!fs.existsSync(CONCORDANCE_PATH)) {
    console.error('ERROR: concordance/concordance.json not found. Run build_concordance.js first.');
    process.exit(1);
  }

  const concordance = JSON.parse(fs.readFileSync(CONCORDANCE_PATH, 'utf8'));
  const allInstances = concordance.instances || [];
  console.log(`Loaded ${allInstances.length} instances from concordance.`);

  // Load existing analysis to preserve manually-written fields
  let existingAnalysis = null;
  if (fs.existsSync(ANALYSIS_PATH)) {
    try {
      existingAnalysis = JSON.parse(fs.readFileSync(ANALYSIS_PATH, 'utf8'));
    } catch (_) {}
  }

  function getExistingCluster(clusterId) {
    if (!existingAnalysis || !Array.isArray(existingAnalysis.cluster_analyses)) return null;
    return existingAnalysis.cluster_analyses.find(c => c.cluster_id === clusterId) || null;
  }

  const CLUSTERS = [
    { id: 'cluster_01_body_organism', name: 'Nation as organism / body', source: 'wound, healing, birth, severance, disease', target: 'the American Union' },
    { id: 'cluster_02_covenant_oath', name: 'Union as covenant / oath', source: 'sworn oath, contract, sacred bond', target: 'the constitutional compact' },
    { id: 'cluster_03_experiment_proposition', name: 'Republic as experiment / proposition', source: 'logical proof, scientific test', target: 'democratic self-government' },
    { id: 'cluster_04_birth_creation', name: 'War as birth / new creation', source: 'labor, nativity, generative act', target: 'the refounding of the nation' },
    { id: 'cluster_05_fathers_inheritance', name: 'Founding fathers as inheritance', source: 'patrimony, lineage, ancestral debt', target: 'obligation to the founders' },
    { id: 'cluster_06_providence_theodicy', name: 'Providence / divine will', source: "God's judgment, punishment, theodicy", target: "the war's cause and meaning" }
  ];

  const ABSENCE_FLAGS = [
    'enslaved_people_non_agent',
    'black_soldiers_erased',
    'lincoln_non_agent',
    'confederates_depersonalized',
    'death_abstracted',
    'women_absent',
    'disease_purification_absent'
  ];

  const clusterAnalyses = [];

  for (const cluster of CLUSTERS) {
    const instances = allInstances.filter(i => i.cmt && i.cmt.cluster_id === cluster.id);
    const count = instances.length;

    // Diachronic by_year
    const byYear = {};
    const byDocument = {};
    for (const inst of instances) {
      const year = inst.document_date ? inst.document_date.substring(0, 4) : 'unknown';
      byYear[year] = (byYear[year] || 0) + 1;
      const docId = inst.document_id || 'unknown';
      byDocument[docId] = (byDocument[docId] || 0) + 1;
    }

    const firstAttested = instances.length > 0
      ? instances.reduce((min, i) => i.document_date < min ? i.document_date : min, instances[0].document_date)
      : null;
    const lastAttested = instances.length > 0
      ? instances.reduce((max, i) => i.document_date > max ? i.document_date : max, instances[0].document_date)
      : null;

    // CMT profile
    const linguisticForms = {};
    const entailmentCounts = {};
    const novelInstances = [];
    const extendedGroups = new Set();

    for (const inst of instances) {
      if (!inst.cmt) continue;
      const lf = inst.cmt.linguistic_form;
      if (lf) linguisticForms[lf] = (linguisticForms[lf] || 0) + 1;
      for (const e of (inst.cmt.entailments || [])) {
        entailmentCounts[e] = (entailmentCounts[e] || 0) + 1;
      }
      if (inst.cmt.is_novel_metaphor) novelInstances.push(inst.instance_id);
      if (inst.cmt.is_extended_metaphor && inst.cmt.extension_group_id) {
        extendedGroups.add(inst.cmt.extension_group_id);
      }
    }

    // Koenigsberg profile
    const fantasyTypeCounts = {};
    const violenceLogicCounts = {};
    const projectedEntityCounts = {};
    const guiltDistributionCounts = {};
    const absenceFlagCounts = {};
    for (const f of ABSENCE_FLAGS) absenceFlagCounts[f] = 0;

    let obligatoryCount = 0;
    let sacrificialCount = 0;
    let psychicDefenseCounts = {};

    for (const inst of instances) {
      const k = inst.koenigsberg;
      if (!k) continue;
      if (k.fantasy_type) fantasyTypeCounts[k.fantasy_type] = (fantasyTypeCounts[k.fantasy_type] || 0) + 1;
      if (k.violence_logic) violenceLogicCounts[k.violence_logic] = (violenceLogicCounts[k.violence_logic] || 0) + 1;
      if (k.projected_entity) projectedEntityCounts[k.projected_entity] = (projectedEntityCounts[k.projected_entity] || 0) + 1;
      if (k.guilt_distribution) guiltDistributionCounts[k.guilt_distribution] = (guiltDistributionCounts[k.guilt_distribution] || 0) + 1;
      if (k.obligatory_frame === true) obligatoryCount++;
      if (k.sacrificial_economy === true) sacrificialCount++;
      if (k.psychic_defense && k.psychic_defense !== 'null') {
        psychicDefenseCounts[k.psychic_defense] = (psychicDefenseCounts[k.psychic_defense] || 0) + 1;
      }
      for (const flag of (k.absence_flags || [])) {
        if (absenceFlagCounts[flag] !== undefined) absenceFlagCounts[flag]++;
      }
    }

    // Register distribution
    const registerDist = {
      formal_public_address: 0, campaign_speech: 0, congressional_message: 0,
      semi_public_letter: 0, legal_document: 0, fragment_private: 0
    };
    for (const inst of instances) {
      const reg = inst.document_register;
      if (reg && registerDist[reg] !== undefined) registerDist[reg]++;
    }

    // Suppression instances for this cluster
    const suppressionInstances = instances
      .filter(i => i.meta && i.meta.suppression_flag)
      .map(i => i.instance_id);

    // Preserve manually-written fields from existing analysis
    const existing = getExistingCluster(cluster.id) || {};

    clusterAnalyses.push({
      cluster_id: cluster.id,
      cluster_name: cluster.name,
      source_domain: cluster.source,
      target_domain: cluster.target,
      instance_count: count,
      instance_ids: instances.map(i => i.instance_id),
      diachronic: {
        first_attested: firstAttested,
        last_attested: lastAttested,
        by_year: byYear,
        by_document: byDocument,
        trend_notes: (existing.diachronic && existing.diachronic.trend_notes) || null
      },
      cmt_profile: {
        dominant_linguistic_forms: topN(linguisticForms, 3),
        dominant_entailments: topN(entailmentCounts, 5),
        novel_instances: novelInstances,
        extended_metaphor_groups: [...extendedGroups]
      },
      koenigsberg_profile: {
        dominant_fantasy_types: topN(fantasyTypeCounts, 3),
        dominant_violence_logic: topN(violenceLogicCounts, 3),
        obligatory_frame_rate: rate(obligatoryCount, count),
        dominant_projected_entity: dominant(projectedEntityCounts),
        dominant_guilt_distribution: dominant(guiltDistributionCounts),
        sacrificial_economy_rate: rate(sacrificialCount, count),
        dominant_psychic_defense: dominant(psychicDefenseCounts),
        absence_flags_distribution: absenceFlagCounts
      },
      political_moral_work: existing.political_moral_work || null,
      what_metaphor_conceals: existing.what_metaphor_conceals || null,
      hitler_comparison: existing.hitler_comparison || {
        hitler_parallel_cluster: null,
        structural_similarity: null,
        structural_divergence: null,
        shared_fantasy_types: [],
        shared_violence_logic: [],
        lincoln_specific_constructs: [],
        hitler_specific_constructs: [],
        analytically_significant_absences: []
      },
      register_distribution: registerDist,
      suppression_instances: suppressionInstances,
      analyst_notes: existing.analyst_notes || null
    });
  }

  // Systematic absence
  const absenceTotals = {};
  const absenceByCluster = {};
  const absenceByRegister = {};
  const absenceByYear = {};

  for (const flag of ABSENCE_FLAGS) absenceTotals[flag] = 0;

  for (const inst of allInstances) {
    const k = inst.koenigsberg;
    if (!k) continue;
    const flags = k.absence_flags || [];
    const clusterId = inst.cmt && inst.cmt.cluster_id;
    const register = inst.document_register || 'unknown';
    const year = inst.document_date ? inst.document_date.substring(0, 4) : 'unknown';

    for (const flag of flags) {
      if (absenceTotals[flag] !== undefined) {
        absenceTotals[flag]++;
        if (clusterId) {
          if (!absenceByCluster[flag]) absenceByCluster[flag] = {};
          absenceByCluster[flag][clusterId] = (absenceByCluster[flag][clusterId] || 0) + 1;
        }
        if (!absenceByRegister[flag]) absenceByRegister[flag] = {};
        absenceByRegister[flag][register] = (absenceByRegister[flag][register] || 0) + 1;
        if (!absenceByYear[flag]) absenceByYear[flag] = {};
        absenceByYear[flag][year] = (absenceByYear[flag][year] || 0) + 1;
      }
    }
  }

  // Co-activation matrix
  const coActivationMatrix = {};
  for (const c1 of CLUSTERS) {
    coActivationMatrix[c1.id] = {};
    for (const c2 of CLUSTERS) coActivationMatrix[c1.id][c2.id] = 0;
  }
  for (const inst of allInstances) {
    const primaryCluster = inst.cmt && inst.cmt.cluster_id;
    const coActivated = (inst.cmt && inst.cmt.co_activated_clusters) || [];
    if (primaryCluster && coActivationMatrix[primaryCluster]) {
      for (const co of coActivated) {
        if (coActivationMatrix[primaryCluster][co] !== undefined) {
          coActivationMatrix[primaryCluster][co]++;
        }
      }
    }
  }

  const existingSysAbsence = (existingAnalysis && existingAnalysis.systematic_absence) || {};
  const existingCrossCluster = (existingAnalysis && existingAnalysis.cross_cluster) || {};
  const existingMasterComparison = (existingAnalysis && existingAnalysis.koenigsberg_master_comparison) || {};
  const existingLog = (existingAnalysis && existingAnalysis.pipeline_log) || [];

  existingLog.push({
    stage: 6,
    agent: 'run_analysis.js',
    date: new Date().toISOString().split('T')[0],
    total_instances_analyzed: allInstances.length
  });

  const analysis = {
    version: '1.0',
    generated: new Date().toISOString().split('T')[0],
    status: allInstances.length > 0 ? 'complete' : 'stub',
    cluster_analyses: clusterAnalyses,
    systematic_absence: {
      primary_absent_entity: 'enslaved_people',
      total_absence_flag_instances: Object.values(absenceTotals).reduce((a, b) => a + b, 0),
      absence_totals_by_flag: absenceTotals,
      absence_by_cluster: absenceByCluster,
      absence_by_register: absenceByRegister,
      absence_by_year: absenceByYear,
      key_findings: existingSysAbsence.key_findings || [],
      analyst_notes: existingSysAbsence.analyst_notes || null
    },
    cross_cluster: {
      co_activation_matrix: coActivationMatrix,
      metaphor_hierarchy_evidence: existingCrossCluster.metaphor_hierarchy_evidence || [],
      cluster_shift_events: existingCrossCluster.cluster_shift_events || []
    },
    koenigsberg_master_comparison: {
      lincoln_unique_constructs: existingMasterComparison.lincoln_unique_constructs || ['experiment_and_proof', 'oath_and_obligation'],
      hitler_unique_constructs: existingMasterComparison.hitler_unique_constructs || ['disease_and_purification'],
      shared_structural_logic: existingMasterComparison.shared_structural_logic || ['sacrificial_economy', 'obligatory_frame', 'body_politic_projection'],
      primary_structural_divergence: existingMasterComparison.primary_structural_divergence || null,
      significance: existingMasterComparison.significance || null
    },
    pipeline_log: existingLog
  };

  fs.writeFileSync(ANALYSIS_PATH, JSON.stringify(analysis, null, 2));

  console.log('\n✓ Analysis written to analysis/analysis.json');
  console.log(`  Clusters analyzed: ${clusterAnalyses.length}`);
  for (const ca of clusterAnalyses) {
    console.log(`  ${ca.cluster_id}: ${ca.instance_count} instances`);
  }
  console.log(`  Total absence flag instances: ${Object.values(absenceTotals).reduce((a, b) => a + b, 0)}`);
}

main();
