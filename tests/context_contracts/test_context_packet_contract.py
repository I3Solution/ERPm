from __future__ import annotations

import json
import unittest
from datetime import datetime
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker, ValidationError

ROOT = Path(__file__).resolve().parents[2]
SCHEMAS = ROOT / ".ai" / "schemas"
EXAMPLES = SCHEMAS / "examples"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def validate_schema(instance: dict, schema_path: Path) -> None:
    schema = load_json(schema_path)
    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(instance)


def parse_utc(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.utcoffset() is None:
        raise ValueError("timestamp must include a UTC offset")
    return parsed


def validate_packet_semantics(packet: dict) -> list[str]:
    errors: list[str] = []
    scope = packet["scope"]
    selected = {
        (revision["sourceId"], revision["sourceRevisionId"])
        for revision in packet["retrievalProvenance"]["selectedRevisions"]
    }
    item_ids = {item["itemId"] for item in packet["items"]}
    evidence_ids: set[str] = set()

    if parse_utc(packet["lifecycle"]["expiresAtUtc"]) <= parse_utc(packet["lifecycle"]["createdAtUtc"]):
        errors.append("expiry must be later than creation")

    budget = packet["budget"]
    if budget["usedTokens"] + budget["reservedTokens"] > budget["maxTokens"]:
        errors.append("used plus reserved tokens exceed the hard budget")

    completeness = packet["completeness"]
    if completeness["includedItemCount"] != len(packet["items"]):
        errors.append("included item count does not match items")
    actual_truncated = sum(
        1 for item in packet["items"]
        if item.get("truncation", {}).get("isTruncated") is True
    )
    if completeness["truncatedItemCount"] != actual_truncated:
        errors.append("truncated item count does not match item metadata")
    if completeness["state"] == "complete" and (
        completeness["omittedItemCount"] or completeness["truncatedItemCount"] or completeness["notices"]
    ):
        errors.append("complete packet cannot contain omissions, truncation or limitation notices")

    for item in packet["items"]:
        kind = item["kind"]
        if kind in {"structured_fact", "source_excerpt", "code_excerpt"}:
            provenance = item["provenance"]
            if not provenance["evidence"]:
                errors.append(f"{item['itemId']}: factual item has no evidence")
            for evidence in provenance["evidence"]:
                evidence_ids.add(evidence["evidenceId"])
                if (evidence["sourceId"], evidence["sourceRevisionId"]) not in selected:
                    errors.append(f"{item['itemId']}: evidence revision is absent from selected revision manifest")
                if evidence["sourceId"] not in scope.get("sourceIds", [evidence["sourceId"]]):
                    errors.append(f"{item['itemId']}: evidence source is outside packet source scope")
        elif kind == "verified_relation":
            for evidence in item["evidence"]:
                evidence_ids.add(evidence["evidenceId"])
                if (evidence["sourceId"], evidence["sourceRevisionId"]) not in selected:
                    errors.append(f"{item['itemId']}: relation evidence revision is not selected")
        elif kind == "generated_summary":
            if item["trust"] != "derived_content_untrusted":
                errors.append(f"{item['itemId']}: generated summary must remain derived and untrusted")
            if not set(item["inputItemIds"]).issubset(item_ids):
                errors.append(f"{item['itemId']}: summary references an unknown input item")
            if not set(item["inputEvidenceIds"]).issubset(evidence_ids | {
                evidence["evidenceId"]
                for source_item in packet["items"]
                for evidence in (
                    source_item.get("provenance", {}).get("evidence", [])
                    + source_item.get("evidence", [])
                )
            }):
                errors.append(f"{item['itemId']}: summary references unknown evidence")

    return errors


class ContextPacketSchemaTests(unittest.TestCase):
    def test_valid_packet_fixture(self):
        packet = load_json(EXAMPLES / "context-packet-valid-v1.json")
        validate_schema(packet, SCHEMAS / "context-packet-v1.schema.json")
        self.assertEqual([], validate_packet_semantics(packet))

    def test_packet_rejects_missing_evidence(self):
        packet = load_json(EXAMPLES / "context-packet-valid-v1.json")
        packet["items"][0]["provenance"]["evidence"] = []
        with self.assertRaises(ValidationError):
            validate_schema(packet, SCHEMAS / "context-packet-v1.schema.json")

    def test_packet_rejects_unknown_item_kind(self):
        packet = load_json(EXAMPLES / "context-packet-valid-v1.json")
        packet["items"][0]["kind"] = "arbitrary_text"
        with self.assertRaises(Exception):
            validate_schema(packet, SCHEMAS / "context-packet-v1.schema.json")

    def test_packet_semantics_reject_budget_overflow(self):
        packet = load_json(EXAMPLES / "context-packet-valid-v1.json")
        packet["budget"]["usedTokens"] = 950
        self.assertIn(
            "used plus reserved tokens exceed the hard budget",
            validate_packet_semantics(packet),
        )

    def test_packet_semantics_reject_unselected_evidence_revision(self):
        packet = load_json(EXAMPLES / "context-packet-valid-v1.json")
        packet["items"][0]["provenance"]["evidence"][0]["sourceRevisionId"] = "revision-not-selected"
        self.assertTrue(any("absent from selected revision manifest" in error
                            for error in validate_packet_semantics(packet)))

    def test_packet_semantics_reject_complete_with_notices(self):
        packet = load_json(EXAMPLES / "context-packet-valid-v1.json")
        packet["completeness"]["notices"] = ["An optional source was omitted."]
        self.assertTrue(any("complete packet cannot contain" in error
                            for error in validate_packet_semantics(packet)))


class ContextProfileSchemaTests(unittest.TestCase):
    def test_valid_profile_fixture(self):
        profile = load_json(EXAMPLES / "context-profile-valid-v1.json")
        validate_schema(profile, SCHEMAS / "context-profile-v1.schema.json")

    def test_profile_requires_authorization_revalidation(self):
        profile = load_json(EXAMPLES / "context-profile-valid-v1.json")
        profile["lifecycle"]["revalidateAuthorizationBeforeDelivery"] = False
        with self.assertRaises(Exception):
            validate_schema(profile, SCHEMAS / "context-profile-v1.schema.json")


def validate_retrieval_result_semantics(result: dict) -> list[str]:
    errors: list[str] = []
    selected = {
        (revision["sourceId"], revision["sourceRevisionId"])
        for revision in result["selectedRevisions"]
    }
    if result["outcome"] == "empty" and result["results"]:
        errors.append("empty outcome cannot contain results")
    if result["outcome"] == "partial" and not result["results"]:
        errors.append("partial outcome requires at least one usable result")
    if result["outcome"] in {"complete", "partial", "empty"}:
        if any(report["required"] and not report["ran"] for report in result["methodReports"]):
            errors.append("successful outcome requires every required method to have run")
    if result.get("pagination", {}).get("hasMore") and not result["pagination"].get("nextCursor"):
        errors.append("hasMore requires a continuation cursor")
    for item in result["results"]:
        if item["scope"]["workspaceId"] != result["scope"]["workspaceId"]:
            errors.append(f"{item['recordId']}: result Workspace differs from response Workspace")
        source_key = (item["source"]["sourceId"], item["source"]["sourceRevisionId"])
        if source_key not in selected:
            errors.append(f"{item['recordId']}: record revision is absent from selected revision manifest")
        if not item["evidence"]:
            errors.append(f"{item['recordId']}: result has no Evidence")
        for evidence in item["evidence"]:
            if (evidence["sourceId"], evidence["sourceRevisionId"]) != source_key:
                errors.append(f"{item['recordId']}: Evidence does not match record SourceRevision")
    return errors


class RetrievalContractSchemaTests(unittest.TestCase):
    def test_valid_request_fixture(self):
        request = load_json(EXAMPLES / "retrieval-request-valid-v1.json")
        validate_schema(request, SCHEMAS / "retrieval-request-v1.schema.json")

    def test_pinned_request_requires_revision(self):
        request = load_json(EXAMPLES / "retrieval-request-valid-v1.json")
        request["revisionPolicy"] = {"mode": "pinned", "revisions": []}
        with self.assertRaises(ValidationError):
            validate_schema(request, SCHEMAS / "retrieval-request-v1.schema.json")

    def test_valid_result_fixture(self):
        result = load_json(EXAMPLES / "retrieval-result-valid-v1.json")
        validate_schema(result, SCHEMAS / "retrieval-result-v1.schema.json")
        self.assertEqual([], validate_retrieval_result_semantics(result))

    def test_result_rejects_evidence_from_another_revision(self):
        result = load_json(EXAMPLES / "retrieval-result-valid-v1.json")
        result["results"][0]["evidence"][0]["sourceRevisionId"] = "revision-other"
        self.assertTrue(any("Evidence does not match" in error
                            for error in validate_retrieval_result_semantics(result)))

    def test_partial_result_requires_usable_results(self):
        result = load_json(EXAMPLES / "retrieval-result-valid-v1.json")
        result["outcome"] = "partial"
        result["results"] = []
        self.assertIn("partial outcome requires at least one usable result",
                      validate_retrieval_result_semantics(result))

    def test_successful_result_rejects_unrun_required_method(self):
        result = load_json(EXAMPLES / "retrieval-result-valid-v1.json")
        result["methodReports"][0]["ran"] = False
        self.assertIn("successful outcome requires every required method to have run",
                      validate_retrieval_result_semantics(result))

    def test_valid_error_fixture(self):
        error = load_json(EXAMPLES / "retrieval-error-valid-v1.json")
        validate_schema(error, SCHEMAS / "retrieval-error-v1.schema.json")


class CanonicalKnowledgeSchemaTests(unittest.TestCase):
    def test_valid_knowledge_record_fixture(self):
        record = load_json(EXAMPLES / "knowledge-record-valid-v1.json")
        validate_schema(record, SCHEMAS / "knowledge-record-v1.schema.json")
        self.assertEqual(record["classification"]["recordType"], record["payload"]["type"])

    def test_logical_key_is_optional_for_observations_without_stable_identity(self):
        record = load_json(EXAMPLES / "knowledge-record-valid-v1.json")
        record["logicalKey"] = "source-scoped-stable-identity"
        validate_schema(record, SCHEMAS / "knowledge-record-v1.schema.json")

        record.pop("logicalKey")
        validate_schema(record, SCHEMAS / "knowledge-record-v1.schema.json")

    def test_record_rejects_missing_evidence(self):
        record = load_json(EXAMPLES / "knowledge-record-valid-v1.json")
        record["evidenceIds"] = []
        with self.assertRaises(ValidationError):
            validate_schema(record, SCHEMAS / "knowledge-record-v1.schema.json")

    def test_valid_evidence_fixture(self):
        evidence = load_json(EXAMPLES / "evidence-valid-v1.json")
        validate_schema(evidence, SCHEMAS / "evidence-v1.schema.json")

    def test_valid_relation_fixture(self):
        relation = load_json(EXAMPLES / "knowledge-relation-valid-v1.json")
        validate_schema(relation, SCHEMAS / "knowledge-relation-v1.schema.json")

    def test_relation_rejects_unverified_edge(self):
        relation = load_json(EXAMPLES / "knowledge-relation-valid-v1.json")
        relation["assertion"]["verification"] = "partial"
        with self.assertRaises(ValidationError):
            validate_schema(relation, SCHEMAS / "knowledge-relation-v1.schema.json")

    def test_valid_source_revision_fixture(self):
        revision = load_json(EXAMPLES / "source-revision-valid-v1.json")
        validate_schema(revision, SCHEMAS / "source-revision-v1.schema.json")

    def test_source_revision_requires_exact_revision_key(self):
        revision = load_json(EXAMPLES / "source-revision-valid-v1.json")
        revision.pop("revisionKey")
        with self.assertRaises(ValidationError):
            validate_schema(revision, SCHEMAS / "source-revision-v1.schema.json")


def validate_canonical_record_semantics(record: dict, evidence_items: list[dict]) -> list[str]:
    errors: list[str] = []
    if record["classification"]["recordType"] != record["payload"]["type"]:
        errors.append("classification recordType must equal payload type")
    by_id = {item["evidenceId"]: item for item in evidence_items}
    for evidence_id in record["evidenceIds"]:
        evidence = by_id.get(evidence_id)
        if evidence is None:
            errors.append(f"missing Evidence {evidence_id}")
            continue
        if evidence["scope"]["tenantId"] != record["scope"]["tenantId"] or evidence["scope"]["workspaceId"] != record["scope"]["workspaceId"]:
            errors.append(f"Evidence {evidence_id} is outside the record Workspace")
        if evidence["sourceRevisionId"] not in record["provenance"].get("inputSourceRevisionIds", []):
            errors.append(f"Evidence {evidence_id} revision is absent from record provenance")
    return errors


class CanonicalCrossRecordInvariantTests(unittest.TestCase):
    def test_record_evidence_workspace_and_revision_lineage(self):
        record = load_json(EXAMPLES / "knowledge-record-valid-v1.json")
        evidence = load_json(EXAMPLES / "evidence-valid-v1.json")
        self.assertEqual([], validate_canonical_record_semantics(record, [evidence]))

    def test_record_rejects_evidence_from_another_workspace(self):
        record = load_json(EXAMPLES / "knowledge-record-valid-v1.json")
        evidence = load_json(EXAMPLES / "evidence-valid-v1.json")
        evidence["scope"]["workspaceId"] = "workspace-b"
        self.assertTrue(any("outside the record Workspace" in error
                            for error in validate_canonical_record_semantics(record, [evidence])))

    def test_record_rejects_evidence_from_unlisted_revision(self):
        record = load_json(EXAMPLES / "knowledge-record-valid-v1.json")
        evidence = load_json(EXAMPLES / "evidence-valid-v1.json")
        evidence["sourceRevisionId"] = "revision-other"
        self.assertTrue(any("absent from record provenance" in error
                            for error in validate_canonical_record_semantics(record, [evidence])))

    def test_record_rejects_payload_discriminator_mismatch(self):
        record = load_json(EXAMPLES / "knowledge-record-valid-v1.json")
        record["payload"]["type"] = "code.symbol"
        self.assertIn("classification recordType must equal payload type",
                      validate_canonical_record_semantics(record, []))


class IngestionContractSchemaTests(unittest.TestCase):
    def test_valid_ingestion_profile_fixture(self):
        profile = load_json(EXAMPLES / "ingestion-profile-valid-v1.json")
        validate_schema(profile, SCHEMAS / "ingestion-profile-v1.schema.json")

    def test_scheduled_trigger_is_not_supported_in_v1(self):
        profile = load_json(EXAMPLES / "ingestion-profile-valid-v1.json")
        profile["triggers"].append("schedule")
        with self.assertRaises(ValidationError):
            validate_schema(profile, SCHEMAS / "ingestion-profile-v1.schema.json")

    def test_valid_ingestion_run_fixture(self):
        run = load_json(EXAMPLES / "ingestion-run-valid-v1.json")
        validate_schema(run, SCHEMAS / "ingestion-run-v1.schema.json")

    def test_ingestion_run_uses_one_durable_run_identity(self):
        run = load_json(EXAMPLES / "ingestion-run-valid-v1.json")
        self.assertTrue(run["runId"])
        self.assertTrue(run["logicalRunKey"])
        self.assertNotIn("ingestionRequestId", run)

    def test_valid_publication_manifest_fixture(self):
        manifest = load_json(EXAMPLES / "publication-manifest-valid-v1.json")
        validate_schema(manifest, SCHEMAS / "publication-manifest-v1.schema.json")

    def test_publication_manifest_rejects_non_published_state(self):
        manifest = load_json(EXAMPLES / "publication-manifest-valid-v1.json")
        manifest["status"] = "staging"
        with self.assertRaises(ValidationError):
            validate_schema(manifest, SCHEMAS / "publication-manifest-v1.schema.json")



def validate_code_logical_identity(
    payload: dict,
    logical_key: str | None,
) -> list[str]:
    errors: list[str] = []
    payload_type = payload["type"]
    identity = payload.get("data", {}).get("identity", {})

    if payload_type == "code.file":
        if not logical_key:
            errors.append("code.file requires a source-scoped logicalKey")
    elif payload_type == "code.symbol":
        stability = identity.get("stability")
        if stability == "stable" and not logical_key:
            errors.append("stable code.symbol identity requires logicalKey")
        elif stability == "revision_local" and logical_key:
            errors.append("revision-local code.symbol must omit logicalKey")
    elif payload_type in {"code.reference_observation", "code.api_observation"}:
        if logical_key:
            errors.append(f"{payload_type} must omit logicalKey")
    return errors


class CanonicalCodePayloadSchemaTests(unittest.TestCase):
    PAYLOAD_CASES = (
        ("code.file", "code-file-payload-valid-v1.json", "code-file-v1.schema.json"),
        ("code.symbol", "code-symbol-payload-valid-v1.json", "code-symbol-v1.schema.json"),
        (
            "code.reference_observation",
            "code-reference-observation-payload-valid-v1.json",
            "code-reference-observation-v1.schema.json",
        ),
        (
            "code.api_observation",
            "code-api-observation-payload-valid-v1.json",
            "code-api-observation-v1.schema.json",
        ),
    )

    def test_valid_payload_fixtures(self):
        for expected_type, fixture_name, schema_name in self.PAYLOAD_CASES:
            with self.subTest(payload_type=expected_type):
                payload = load_json(EXAMPLES / fixture_name)
                validate_schema(payload, SCHEMAS / "payloads" / schema_name)
                self.assertEqual(expected_type, payload["type"])
                self.assertEqual("1.0", payload["version"])

    def test_code_file_requires_logical_key(self):
        payload = load_json(EXAMPLES / "code-file-payload-valid-v1.json")
        self.assertEqual([], validate_code_logical_identity(payload, "code.file:[source,path]"))
        self.assertIn(
            "code.file requires a source-scoped logicalKey",
            validate_code_logical_identity(payload, None),
        )

    def test_code_symbol_identity_is_conditional(self):
        payload = load_json(EXAMPLES / "code-symbol-payload-valid-v1.json")
        self.assertEqual([], validate_code_logical_identity(payload, None))

        payload["data"]["identity"] = {
            "stability": "stable",
            "strategy": "compiler_semantic_key",
        }
        self.assertIn(
            "stable code.symbol identity requires logicalKey",
            validate_code_logical_identity(payload, None),
        )
        self.assertEqual(
            [],
            validate_code_logical_identity(payload, "code.symbol:[source,semantic-key]"),
        )

        payload["data"]["identity"] = {
            "stability": "revision_local",
            "strategy": "source_locator",
        }
        self.assertIn(
            "revision-local code.symbol must omit logicalKey",
            validate_code_logical_identity(payload, "code.symbol:[source,offset]"),
        )

    def test_observation_payloads_must_omit_logical_key(self):
        for fixture_name, _schema_name in (
            ("code-reference-observation-payload-valid-v1.json", "code-reference-observation-v1.schema.json"),
            ("code-api-observation-payload-valid-v1.json", "code-api-observation-v1.schema.json"),
        ):
            with self.subTest(fixture=fixture_name):
                payload = load_json(EXAMPLES / fixture_name)
                self.assertEqual([], validate_code_logical_identity(payload, None))
                self.assertTrue(validate_code_logical_identity(payload, "not-a-stable-identity"))

    def test_reference_observation_rejects_inconsistent_target_resolution(self):
        payload = load_json(EXAMPLES / "code-reference-observation-payload-valid-v1.json")
        payload["data"]["targetResolution"] = "resolved"
        with self.assertRaises(ValidationError):
            validate_schema(
                payload,
                SCHEMAS / "payloads" / "code-reference-observation-v1.schema.json",
            )

    def test_api_payload_requires_literal_path_only_for_literal_urls(self):
        payload = load_json(EXAMPLES / "code-api-observation-payload-valid-v1.json")
        payload["data"]["urlKind"] = "literal"
        with self.assertRaises(ValidationError):
            validate_schema(payload, SCHEMAS / "payloads" / "code-api-observation-v1.schema.json")



def validate_stage_attempt_semantics(attempt: dict) -> list[str]:
    errors: list[str] = []
    state = attempt["state"]
    diagnostics = attempt.get("diagnostics", [])

    if state in {"succeeded", "succeeded_with_warnings"}:
        output = attempt["outputManifest"]
        checkpoint = attempt["checkpoint"]
        if checkpoint["inputFingerprint"] != attempt["inputFingerprint"]:
            errors.append("checkpoint input fingerprint differs from stage attempt input")
        if checkpoint["outputManifestId"] != output["manifestId"]:
            errors.append("checkpoint references a different output manifest")
        if checkpoint["outputContentHash"] != output["contentHash"]:
            errors.append("checkpoint output hash differs from output manifest")

    severities = {item["severity"] for item in diagnostics}
    if state == "succeeded" and severities.intersection({"warning", "error", "fatal"}):
        errors.append("succeeded stage attempt cannot contain warning/error/fatal diagnostics")
    if state == "succeeded_with_warnings" and "warning" not in severities:
        errors.append("succeeded_with_warnings requires at least one warning diagnostic")

    if state == "retry_wait" and not any(
        item["retryable"] and item["classification"] == "transient"
        for item in diagnostics
    ):
        errors.append("retry_wait requires at least one transient retryable diagnostic")

    for diagnostic in diagnostics:
        if diagnostic["classification"] == "permanent" and diagnostic["retryable"]:
            errors.append("permanent diagnostics cannot be retryable")

    return errors


def validate_extraction_manifest_semantics(manifest: dict) -> list[str]:
    errors: list[str] = []
    artifact_count = sum(item["observationCount"] for item in manifest["observationArtifacts"])
    if artifact_count != manifest["observationCount"]:
        errors.append("observation count differs from extraction artifact counts")

    for coverage in manifest["coverage"]:
        expected = coverage["numerator"] / coverage["denominator"]
        if abs(expected - coverage["ratio"]) > 0.000001:
            errors.append(f"{coverage['metric']}: coverage ratio does not match numerator/denominator")
        if coverage["numerator"] > coverage["denominator"]:
            errors.append(f"{coverage['metric']}: numerator exceeds denominator")

    return errors


def validate_normalization_manifest_semantics(manifest: dict) -> list[str]:
    errors: list[str] = []
    record_count = sum(item["recordCount"] for item in manifest["knowledgeRecordArtifacts"])
    evidence_count = sum(item["evidenceCount"] for item in manifest["evidenceArtifacts"])
    relation_count = sum(item["relationCount"] for item in manifest["relationArtifacts"])
    if record_count != manifest["counts"]["knowledgeRecords"]:
        errors.append("KnowledgeRecord count differs from normalization artifact counts")
    if evidence_count != manifest["counts"]["evidence"]:
        errors.append("Evidence count differs from normalization artifact counts")
    if relation_count != manifest["counts"]["relations"]:
        errors.append("Relation count differs from normalization artifact counts")
    payload_count = sum(item["count"] for item in manifest["payloadCounts"])
    if payload_count != manifest["counts"]["knowledgeRecords"]:
        errors.append("payload counts do not add up to total KnowledgeRecords")
    return errors


def validate_validation_report_semantics(report: dict, normalization: dict) -> list[str]:
    errors: list[str] = []
    counts = report["counts"]
    expected = normalization["counts"]

    pairs = (
        ("acceptedRecords", "rejectedRecords", "knowledgeRecords"),
        ("acceptedEvidence", "rejectedEvidence", "evidence"),
        ("acceptedRelations", "rejectedRelations", "relations"),
    )
    for accepted_key, rejected_key, expected_key in pairs:
        if counts[accepted_key] + counts[rejected_key] != expected[expected_key]:
            errors.append(f"{accepted_key}/{rejected_key} do not reconcile to normalized {expected_key}")

    severities = {item["severity"] for item in report["violations"]}
    failed_metrics = [item for item in report["completenessEvaluations"] if not item["passed"]]
    for metric in report["completenessEvaluations"]:
        if abs(metric["actualRatio"] - metric["numerator"] / metric["denominator"]) > 0.000001:
            errors.append(f"{metric['metric']}: validation ratio does not match numerator/denominator")
        if metric["passed"] != (metric["actualRatio"] >= metric["minimumRatio"]):
            errors.append(f"{metric['metric']}: pass state differs from configured minimum ratio")

    if report["outcome"] == "passed":
        if severities.intersection({"warning", "error", "fatal"}) or failed_metrics:
            errors.append("passed validation cannot contain warnings, errors or failed completeness metrics")
    elif report["outcome"] == "passed_with_warnings":
        if "warning" not in severities or severities.intersection({"error", "fatal"}) or failed_metrics:
            errors.append("passed_with_warnings requires warnings only and passing completeness metrics")
    elif report["outcome"] == "blocked":
        if not severities.intersection({"error", "fatal"}) and not failed_metrics:
            errors.append("blocked validation requires an error, fatal violation or failed completeness metric")
        if report["publicationEligible"]:
            errors.append("blocked validation cannot be publication eligible")

    return errors


def validate_ingestion_manifest_lineage(
    capture: dict,
    extraction: dict,
    processing: dict,
    normalization: dict,
    validation: dict,
) -> list[str]:
    errors: list[str] = []
    manifests = [capture, extraction, processing, normalization, validation]
    for manifest in manifests:
        if manifest["runId"] != capture["runId"]:
            errors.append(f"{manifest['manifestId']}: runId differs across stage manifests")
        if manifest["scope"] != capture["scope"]:
            errors.append(f"{manifest['manifestId']}: Workspace scope differs across stage manifests")
        if manifest["sourceId"] != capture["sourceId"]:
            errors.append(f"{manifest['manifestId']}: sourceId differs across stage manifests")
        revision_id = (
            manifest["sourceRevision"]["sourceRevisionId"]
            if "sourceRevision" in manifest
            else manifest["sourceRevisionId"]
        )
        if revision_id != capture["sourceRevision"]["sourceRevisionId"]:
            errors.append(f"{manifest['manifestId']}: SourceRevision differs across stage manifests")

    if extraction["inputCaptureManifest"]["manifestId"] != capture["manifestId"]:
        errors.append("Extractor input does not reference the Connector capture manifest")
    if processing["inputManifest"]["manifestId"] != extraction["manifestId"]:
        errors.append("Processor input does not reference the Extraction manifest")
    if normalization["inputExtractionManifest"]["manifestId"] != extraction["manifestId"]:
        errors.append("Normalizer input does not reference the Extraction manifest")
    if not any(
        item["manifestId"] == processing["manifestId"]
        for item in normalization["inputProcessingManifests"]
    ):
        errors.append("Normalizer input does not include the configured Processor output")
    if validation["inputNormalizationManifest"]["manifestId"] != normalization["manifestId"]:
        errors.append("Validator input does not reference the Normalization manifest")

    return errors


class IngestionStageContractSchemaTests(unittest.TestCase):
    def test_valid_stage_invocation_fixture(self):
        invocation = load_json(EXAMPLES / "ingestion-stage-invocation-valid-v1.json")
        validate_schema(invocation, SCHEMAS / "ingestion-stage-invocation-v1.schema.json")

    def test_stage_invocation_rejects_wrong_output_contract(self):
        invocation = load_json(EXAMPLES / "ingestion-stage-invocation-valid-v1.json")
        invocation["stage"] = "publisher.publish"
        with self.assertRaises(ValidationError):
            validate_schema(invocation, SCHEMAS / "ingestion-stage-invocation-v1.schema.json")

    def test_valid_stage_attempt_fixture(self):
        attempt = load_json(EXAMPLES / "ingestion-stage-attempt-valid-v1.json")
        validate_schema(attempt, SCHEMAS / "ingestion-stage-attempt-v1.schema.json")
        self.assertEqual([], validate_stage_attempt_semantics(attempt))

    def test_successful_stage_attempt_requires_durable_output_checkpoint(self):
        attempt = load_json(EXAMPLES / "ingestion-stage-attempt-valid-v1.json")
        attempt.pop("checkpoint")
        with self.assertRaises(ValidationError):
            validate_schema(attempt, SCHEMAS / "ingestion-stage-attempt-v1.schema.json")

    def test_stage_attempt_rejects_output_manifest_for_wrong_stage(self):
        attempt = load_json(EXAMPLES / "ingestion-stage-attempt-valid-v1.json")
        attempt["stage"] = "normalizer.normalize"
        with self.assertRaises(ValidationError):
            validate_schema(attempt, SCHEMAS / "ingestion-stage-attempt-v1.schema.json")

    def test_optional_processor_skip_requires_diagnostic(self):
        attempt = load_json(EXAMPLES / "ingestion-stage-attempt-valid-v1.json")
        attempt["state"] = "skipped"
        attempt["skipReason"] = "optional_stage_failure"
        attempt["completedAtUtc"] = "2026-11-12T04:04:00Z"
        attempt.pop("outputManifest")
        attempt.pop("checkpoint")
        with self.assertRaises(ValidationError):
            validate_schema(attempt, SCHEMAS / "ingestion-stage-attempt-v1.schema.json")

    def test_checkpoint_must_match_stage_input_and_output_hash(self):
        attempt = load_json(EXAMPLES / "ingestion-stage-attempt-valid-v1.json")
        attempt["checkpoint"]["outputContentHash"] = "sha256:other"
        self.assertIn(
            "checkpoint output hash differs from output manifest",
            validate_stage_attempt_semantics(attempt),
        )

    def test_retry_wait_requires_transient_retryable_diagnostic(self):
        attempt = load_json(EXAMPLES / "ingestion-stage-attempt-valid-v1.json")
        attempt["state"] = "retry_wait"
        attempt["diagnostics"] = [{
            "code": "SCHEMA_INVALID",
            "severity": "error",
            "category": "schema",
            "classification": "permanent",
            "retryable": True,
            "summary": "The source record failed schema validation."
        }]
        attempt["nextRetryAtUtc"] = "2026-11-12T04:05:00Z"
        self.assertIn(
            "retry_wait requires at least one transient retryable diagnostic",
            validate_stage_attempt_semantics(attempt),
        )
        self.assertIn(
            "permanent diagnostics cannot be retryable",
            validate_stage_attempt_semantics(attempt),
        )

    def test_valid_source_capture_manifest(self):
        manifest = load_json(EXAMPLES / "source-capture-manifest-valid-v1.json")
        validate_schema(manifest, SCHEMAS / "source-capture-manifest-v1.schema.json")

    def test_capture_manifest_rejects_unverified_snapshot(self):
        manifest = load_json(EXAMPLES / "source-capture-manifest-valid-v1.json")
        manifest["snapshotConsistency"]["state"] = "inconsistent"
        with self.assertRaises(ValidationError):
            validate_schema(manifest, SCHEMAS / "source-capture-manifest-v1.schema.json")

    def test_valid_extraction_manifest_and_coverage(self):
        manifest = load_json(EXAMPLES / "extraction-manifest-valid-v1.json")
        validate_schema(manifest, SCHEMAS / "extraction-manifest-v1.schema.json")
        self.assertEqual([], validate_extraction_manifest_semantics(manifest))

    def test_extraction_manifest_rejects_aggregate_count_mismatch(self):
        manifest = load_json(EXAMPLES / "extraction-manifest-valid-v1.json")
        manifest["observationCount"] += 1
        self.assertIn(
            "observation count differs from extraction artifact counts",
            validate_extraction_manifest_semantics(manifest),
        )

    def test_valid_processing_manifest(self):
        manifest = load_json(EXAMPLES / "processing-manifest-valid-v1.json")
        validate_schema(manifest, SCHEMAS / "processing-manifest-v1.schema.json")

    def test_processing_outputs_require_parent_artifact_lineage(self):
        manifest = load_json(EXAMPLES / "processing-manifest-valid-v1.json")
        manifest["outputArtifacts"][0].pop("parentArtifactIds")
        with self.assertRaises(ValidationError):
            validate_schema(manifest, SCHEMAS / "processing-manifest-v1.schema.json")

    def test_valid_normalization_manifest_and_counts(self):
        manifest = load_json(EXAMPLES / "normalization-manifest-valid-v1.json")
        validate_schema(manifest, SCHEMAS / "normalization-manifest-v1.schema.json")
        self.assertEqual([], validate_normalization_manifest_semantics(manifest))

    def test_normalization_rejects_payload_count_mismatch(self):
        manifest = load_json(EXAMPLES / "normalization-manifest-valid-v1.json")
        manifest["payloadCounts"][0]["count"] += 1
        self.assertIn(
            "payload counts do not add up to total KnowledgeRecords",
            validate_normalization_manifest_semantics(manifest),
        )

    def test_valid_validation_report_and_reconciliation(self):
        report = load_json(EXAMPLES / "validation-report-valid-v1.json")
        normalization = load_json(EXAMPLES / "normalization-manifest-valid-v1.json")
        validate_schema(report, SCHEMAS / "validation-report-v1.schema.json")
        self.assertEqual([], validate_validation_report_semantics(report, normalization))

    def test_blocked_validation_cannot_be_publication_eligible(self):
        report = load_json(EXAMPLES / "validation-report-valid-v1.json")
        report["outcome"] = "blocked"
        report["publicationEligible"] = True
        with self.assertRaises(ValidationError):
            validate_schema(report, SCHEMAS / "validation-report-v1.schema.json")

    def test_stage_manifests_preserve_run_workspace_source_and_revision_lineage(self):
        capture = load_json(EXAMPLES / "source-capture-manifest-valid-v1.json")
        extraction = load_json(EXAMPLES / "extraction-manifest-valid-v1.json")
        processing = load_json(EXAMPLES / "processing-manifest-valid-v1.json")
        normalization = load_json(EXAMPLES / "normalization-manifest-valid-v1.json")
        validation = load_json(EXAMPLES / "validation-report-valid-v1.json")
        self.assertEqual(
            [],
            validate_ingestion_manifest_lineage(capture, extraction, processing, normalization, validation),
        )

    def test_ingestion_run_stage_event_can_reference_durable_attempt(self):
        run = load_json(EXAMPLES / "ingestion-run-valid-v1.json")
        validate_schema(run, SCHEMAS / "ingestion-run-v1.schema.json")
        attempt = load_json(EXAMPLES / "ingestion-stage-attempt-valid-v1.json")
        self.assertEqual(run["runId"], attempt["runId"])
        self.assertEqual(run["stageEvents"][0]["stageAttemptId"], attempt["attemptId"])


if __name__ == "__main__":
    unittest.main()
