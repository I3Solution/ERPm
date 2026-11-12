# Context contract schemas

This directory contains machine-readable contract artifacts for the Enterprise Knowledge Platform.

## Context Packet v1

- `context-packet-v1.schema.json`: JSON Schema Draft 2020-12 for the immutable, task-scoped delivery packet.
- `context-profile-v1.schema.json`: JSON Schema Draft 2020-12 for versioned selection, budget and lifecycle policy.
- `retrieval-request-v1.schema.json`, `retrieval-result-v1.schema.json`, `retrieval-error-v1.schema.json`: machine-readable Retrieval request, successful result and failed outcome contracts.
- `knowledge-record-v1.schema.json`, `evidence-v1.schema.json`, `knowledge-relation-v1.schema.json`, `source-revision-v1.schema.json`: Canonical Knowledge envelope and provenance schemas.
- `payloads/code-*-v1.schema.json`: typed v1 payload schemas for `code.file`, `code.symbol`, `code.reference_observation` and `code.api_observation`.
- `examples/code-*-payload-valid-v1.json`: valid examples for the four typed Code payloads.
- [Code Index Adapter Contract](../architecture/code-index-adapter-contract.md): mapping and identity rules from immutable source-index v1/v2/v3 records.
- `ingestion-profile-v1.schema.json`, `ingestion-run-v1.schema.json`, `publication-manifest-v1.schema.json`: IngestionProfile, durable IngestionRun and atomic SourceRevision publication contracts; PublicationManifest carries the exact NormalizationManifest and eligible ValidationReport references/hashes.
- `ingestion-stage-invocation-v1.schema.json`, `ingestion-stage-attempt-v1.schema.json`: common stage input envelope and child attempt/checkpoint record.
- `source-capture-manifest-v1.schema.json`, `extraction-manifest-v1.schema.json`, `processing-manifest-v1.schema.json`, `normalization-manifest-v1.schema.json`, `validation-report-v1.schema.json`: stage-specific outputs for Connector, Extractor, Processor, Normalizer and Validator; Publisher reuses PublicationManifest.
- `examples/ingestion-*-valid-v1.json`, `examples/*-manifest-valid-v1.json`, `examples/validation-report-valid-v1.json`: baseline stage and manifest fixtures.
- `examples/`: valid baseline examples used by automated tests.

## Validation

Run from the repository root:

```bash
python -m pip install jsonschema==4.25.1
python -m unittest discover -s tests/context_contracts -v
```

JSON Schema checks shape and local constraints. The test suite also checks cross-field semantic invariants that JSON Schema cannot fully express, including revision/evidence membership, token budget arithmetic, completeness counters, generated-summary lineage, typed Code payload validation, per-payload logicalKey rules, stage/output discriminator matching, checkpoint integrity, retry classification, manifest lineage, count reconciliation and completeness evaluation.

Passing these checks does not prove authorization at runtime, source hash correctness, actual tokenizer accounting or safe delivery. Those require platform implementation and integration tests.
