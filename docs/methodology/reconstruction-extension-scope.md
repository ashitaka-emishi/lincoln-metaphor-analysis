---
title: "Reconstruction Extension Scope"
draft: false
---

# Reconstruction Extension Scope

## Decision

Reconstruction-era material should be treated as a **separate comparison module**, not as a direct continuation of the Lincoln corpus.

The current corpus remains bounded to Lincoln-authored or Lincoln-primary documents from 1838-01-27 through 1865-04-11. The terminal document is Lincoln's Last Public Address. Later Reconstruction rhetoric can test how Lincoln's war-ending metaphor system was continued, rejected, narrowed, or transformed by other actors, but it cannot extend the Lincoln corpus because Lincoln is no longer the authorial center after April 1865.

## Research Question

A Reconstruction module should answer a question the current corpus cannot answer:

> How did postwar actors transform Lincoln's restorative and providential war-ending rhetoric into competing programs for reunion, citizenship, federal authority, racial justice, and white resistance?

This differs from the primary Lincoln question. The Lincoln corpus asks how Lincoln's metaphor system authorized Civil War violence while preserving exit conditions for reconciliation. A Reconstruction module would ask what happened when other speakers inherited the postwar problem without Lincoln's authorial control.

## Boundary Rule

The module should not be described as "Lincoln, 1838-1869" or as an expansion of the 28-document Lincoln corpus. It should be named separately, for example:

- `reconstruction_comparison_corpus`
- `postwar_reconstruction_rhetoric`
- `reconstruction_register_control`

Publication claims from the current project should continue to say "Lincoln's corpus, 1838-1865" unless the claim is explicitly based on the separate Reconstruction module.

## Candidate Subcorpora

| Subcorpus | Role | Inclusion rationale |
| --- | --- | --- |
| Presidential Reconstruction rhetoric | Tests whether Lincoln's executive-register healing, providence, oath, and union frames persist under Johnson and Grant | Controls for office and genre after Lincoln's death |
| Congressional Reconstruction rhetoric | Tests legislative contest over reunion, rights, punishment, and federal authority | Captures the institutional arena that overtook presidential Reconstruction |
| Black public Reconstruction rhetoric | Tests whether freedpeople and Black reformers use agency, citizenship, labor, suffrage, and protection frames absent or marginal in Lincoln | Directly addresses the project's agency and absence findings |
| Administrative and investigative reports | Tests how official fact-finding translates violence, labor, and citizenship into bureaucratic language | Adds non-oratorical government genres without treating them as popular reception |
| Southern white resistance and state-law rhetoric | Tests whether disease, purification, racial hierarchy, or order-restoration frames appear in opposition rhetoric | Provides a historically proximate contrast without making it the whole comparison |
| War/Reconstruction threshold controls | Tests non-Lincoln Black, reform, and institutional rhetoric from early 1865 against Lincoln's final documents | Permits carefully labeled transition documents without blurring the Lincoln corpus boundary |

These subcorpora should remain separable in metadata. A later pipeline should support comparisons within and across subcorpus, register, speaker, date, and source type.

## Candidate Sources

These are candidates for a future source list, not collected evidence. Each item needs rights review, stable document IDs, segmentation, provenance metadata, and inclusion notes before annotation.

| Candidate | Date | Speaker / body | Genre | Provenance | Inclusion rationale |
| --- | --- | --- | --- | --- | --- |
| [First Annual Message](https://www.presidency.ucsb.edu/documents/first-annual-message-10) | 1865-12-04 | Andrew Johnson | presidential annual message | American Presidency Project, UC Santa Barbara | Immediate executive successor to Lincoln; tests whether restorative/reunion language becomes race-neutral restoration of states |
| [Freedmen's Bureau veto message](https://www.presidency.ucsb.edu/documents/veto-message-437) | 1866-02-19 | Andrew Johnson | presidential veto message | American Presidency Project, UC Santa Barbara | Tests executive resistance to federal protection of freedpeople and the constitutional limits Johnson invoked |
| [Civil Rights Bill veto message](https://www.presidency.ucsb.edu/documents/veto-message-438) | 1866-03-27 | Andrew Johnson | presidential veto message | American Presidency Project, UC Santa Barbara | Directly targets citizenship and equality; useful contrast to Lincoln's indirect treatment of Black agency |
| [First Inaugural Address](https://www.presidency.ucsb.edu/documents/inaugural-address-36) | 1869-03-04 | Ulysses S. Grant | presidential inaugural address | American Presidency Project, UC Santa Barbara | Tests post-Johnson executive Reconstruction language after congressional Reconstruction and the Fifteenth Amendment debate |
| [Speech on Reconstruction](https://web.mit.edu/21h.102/www/Primary%20source%20collections/Reconstruction/Stevens%2C%20Speech%20on%20reconstruction.html) | 1865-12-18 | Thaddeus Stevens | congressional speech | Congressional Globe excerpt, reproduced by MIT OpenCourseWare | Radical Republican contrast to Lincoln's "malice toward none" and Johnson's restoration policy |
| [What the Black Man Wants](https://frederickdouglasspapersproject.com/s/digitaledition/item/18468) | 1865-01-26 | Frederick Douglass | reform speech | Frederick Douglass Papers Digital Edition | Tests Black suffrage and agency language at the war/Reconstruction threshold |
| ["The Appeal" from the Convention of the Colored People of Virginia](https://encyclopediavirginia.org/primary-documents/the-appeal-from-proceedings-of-the-convention-of-the-colored-people-of-va-held-in-the-city-of-alexandria-1865/) | 1865-08-02 to 1865-08-05 | Convention of the Colored People of Virginia / John M. Brown | convention proceedings / appeal | Encyclopedia Virginia transcription from the 1865 Alexandria proceedings | Adds organized freedpeople's political rhetoric from the first postwar year |
| [We Are All Bound Up Together](https://constitutioncenter.org/the-constitution/historic-document-library/detail/frances-ellen-watkins-harper-we-are-all-bound-up-together-1866) | 1866-05-10 | Frances Ellen Watkins Harper | reform convention speech | National Constitution Center historic document library | Tests gender, race, citizenship, and interdependence metaphors in Black women's Reconstruction rhetoric |
| [Report on the Condition of the South](https://www.gutenberg.org/ebooks/8872) | 1865-12-18 | Carl Schurz | presidential investigative report | Project Gutenberg text of the 1865 report | Administrative evidence for violence, labor, and rights conditions; useful genre contrast to speeches |
| [Joint Committee on Reconstruction](https://history.house.gov/Historical-Highlights/1851-1900/The-Joint-Committee-on-Reconstruction/) | 1865-1867 | U.S. Congress | committee investigation / institutional context | U.S. House History, Art & Archives | Context source for selecting testimony, reports, and congressional debates rather than treating isolated speeches as representative |

## Inclusion Rules

A Reconstruction document should be eligible only if it meets all of these conditions:

- It falls between 1865-04-15 and 1877-03-31, unless it is explicitly labeled as a war/Reconstruction threshold control from 1865.
- It has stable bibliographic provenance and a source URL or archive citation.
- It can be assigned stable document, paragraph, and sentence IDs.
- It has explicit speaker/body, date, genre, register, region, and source-risk metadata.
- It speaks directly to reunion, citizenship, federal authority, violence, labor, suffrage, punishment, reconciliation, or racial order.
- It adds a contrast the Lincoln-only corpus cannot supply.

## Exclusion Rules

The module should exclude:

- Lincoln documents already in the 28-document corpus.
- Post-1865 Lincoln remembrance, memorial, or hagiographic material unless a reception module is explicitly being built.
- Modern historical commentary as corpus evidence.
- Isolated quotations without full-document provenance.
- Generic Civil War memory texts that do not address Reconstruction political questions.

## Metadata Requirements

Any future implementation should add a manifest separate from `corpus/corpus_manifest.json`, for example `reconstruction/corpus_manifest.json`. Required fields should include:

- `doc_id`
- `title`
- `date`
- `speaker_or_body`
- `speaker_role`
- `subcorpus`
- `genre`
- `register`
- `region`
- `source_url`
- `source_citation`
- `rights_status`
- `authorship_confidence`
- `source_risk`
- `inclusion_rationale`
- `comparison_role`

The Lincoln schema can be reused only after deciding whether the same six clusters are being tested as a closed codebook or whether the Reconstruction module needs a discovery pass for new clusters.

## Recommended Pilot

Start with a small, balanced pilot rather than a large collection:

| Slot | Document |
| --- | --- |
| Presidential restoration | Johnson, First Annual Message, 1865 |
| Presidential resistance to rights enforcement | Johnson, Freedmen's Bureau veto, 1866 |
| Congressional Radical Republican program | Stevens, Speech on Reconstruction, 1865 |
| Black suffrage and agency threshold control | Douglass, What the Black Man Wants, 1865 |
| Freedpeople's organized political appeal | Convention of the Colored People of Virginia, "The Appeal," 1865 |
| Administrative fact-finding | Schurz, Report on the Condition of the South, 1865 |

This pilot is small enough to annotate manually, but broad enough to test whether the postwar field is best understood by office, race, institution, register, or stance toward federal protection.

## Claim Boundary

Until a separate Reconstruction module exists and passes validation, the current publication package may say:

- Lincoln's final corpus documents include Reconstruction-facing rhetoric in March and April 1865.
- Lincoln's Second Inaugural and Last Public Address frame postwar settlement through healing, providence, restoration, and developmental patience.
- The project identifies open questions about whether that metaphor system could survive Reconstruction politics.

It should not say:

- Lincoln's metaphor system explains Reconstruction as a whole.
- Reconstruction rhetoric continued Lincoln's system.
- Reconstruction failed because of a metaphor pattern not yet tested outside Lincoln.
- Black Reconstruction rhetoric, congressional Reconstruction rhetoric, or Johnsonian Reconstruction rhetoric shares or rejects Lincoln's clusters without a separately documented corpus.

## Implementation Status

Status: scoped follow-up, not implemented.

Next implementation step: create a separate issue for a `reconstruction_comparison_corpus` pilot, beginning with a source-list manifest and rights review before any text collection or annotation.
