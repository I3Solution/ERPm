# Context contract schemas

This directory contains machine-readable contract artifacts for the Enterprise Knowledge Platform.

## Context Packet v1

- `context-packet-v1.schema.json`: JSON Schema Draft 2020-12 for the immutable, task-scoped delivery packet.
- `context-profile-v1.schema.json`: JSON Schema Draft 2020-12 for versioned selection, budget and lifecycle policy.
- `examples/`: valid baseline examples used by automated tests.

## Validation

Run from the repository root:

```bash
python -m pip install jsonschema==4.25.1
python -m unittest discover -s tests/context_contracts -v
```

JSON Schema checks shape and local constraints. The test suite also checks cross-field semantic invariants that JSON Schema cannot fully express, including revision/evidence membership, token budget arithmetic, completeness counters and generated-summary lineage.

Passing these checks does not prove authorization at runtime, source hash correctness, actual tokenizer accounting or safe delivery. Those require platform implementation and integration tests.
