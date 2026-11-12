from __future__ import annotations

import json
import unittest
from datetime import datetime
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

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
        with self.assertRaises(Exception):
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


if __name__ == "__main__":
    unittest.main()
