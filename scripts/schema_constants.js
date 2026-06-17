// Canonical script-level schema constants shared by validators and pipeline scripts.
'use strict';

const CLUSTERS = Object.freeze([
  Object.freeze({
    id: 'cluster_01_body_organism',
    name: 'Nation as organism / body',
    short_label: 'C01 body/organism',
    source: 'wound, healing, birth, severance, disease',
    target: 'the American Union',
    source_domain_family: 'body_organism',
    target_domain_family: 'nation_union'
  }),
  Object.freeze({
    id: 'cluster_02_covenant_oath',
    name: 'Union as covenant / oath',
    short_label: 'C02 covenant/oath',
    source: 'sworn oath, contract, sacred bond',
    target: 'the constitutional compact',
    source_domain_family: 'law_contract_oath',
    target_domain_family: 'constitution_law'
  }),
  Object.freeze({
    id: 'cluster_03_experiment_proposition',
    name: 'Republic as experiment / proposition',
    short_label: 'C03 experiment/proposition',
    source: 'logical proof, scientific test',
    target: 'democratic self-government',
    source_domain_family: 'experiment_proof_logic',
    target_domain_family: 'democracy_self_government'
  }),
  Object.freeze({
    id: 'cluster_04_birth_creation',
    name: 'War as birth / new creation',
    short_label: 'C04 birth/creation',
    source: 'labor, nativity, generative act',
    target: 'the refounding of the nation',
    source_domain_family: 'birth_generation',
    target_domain_family: 'freedom_liberty'
  }),
  Object.freeze({
    id: 'cluster_05_fathers_inheritance',
    name: 'Founding fathers as inheritance',
    short_label: 'C05 fathers/inheritance',
    source: 'patrimony, lineage, ancestral debt',
    target: 'obligation to the founders',
    source_domain_family: 'family_inheritance',
    target_domain_family: 'founding_fathers'
  }),
  Object.freeze({
    id: 'cluster_06_providence_theodicy',
    name: 'Providence / divine will',
    short_label: 'C06 providence/theodicy',
    source: "God's judgment, punishment, theodicy",
    target: "the war's cause and meaning",
    source_domain_family: 'religion_providence_theodicy',
    target_domain_family: 'providence_history'
  })
]);

const CLUSTER_IDS = Object.freeze(CLUSTERS.map(cluster => cluster.id));

const FANTASY_TYPES = Object.freeze([
  'wound_and_healing',
  'birth_and_creation',
  'sacrifice_and_redemption',
  'oath_and_obligation',
  'punishment_and_theodicy',
  'ancestral_debt',
  'experiment_and_proof',
  'disease_and_purification'
]);

const ABSENCE_FLAGS = Object.freeze([
  'enslaved_people_non_agent',
  'black_soldiers_erased',
  'lincoln_non_agent',
  'confederates_depersonalized',
  'death_abstracted',
  'women_absent',
  'disease_purification_absent'
]);

const LEGACY_FANTASY_TYPE_MAP = Object.freeze({
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
});

const LEGACY_ABSENCE_FLAG_MAP = Object.freeze({
  black_soldiers_absent: 'black_soldiers_erased',
  disease_and_purification: 'disease_purification_absent'
});

function emptyArrayIndex(keys) {
  return Object.fromEntries(keys.map(key => [key, []]));
}

module.exports = {
  ABSENCE_FLAGS,
  CLUSTERS,
  CLUSTER_IDS,
  FANTASY_TYPES,
  LEGACY_ABSENCE_FLAG_MAP,
  LEGACY_FANTASY_TYPE_MAP,
  emptyArrayIndex
};
