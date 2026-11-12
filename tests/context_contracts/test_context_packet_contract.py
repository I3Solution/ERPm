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


if __name__ == "__main__":
    unittest.main()
