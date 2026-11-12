#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
source_root="$repo_root/ERPm-BE"
commit_sha="$(git -C "$source_root" rev-parse HEAD)"
tree_id="$(git -C "$source_root" rev-parse "$commit_sha^{tree}")"

temp_root="$(mktemp -d)"
cleanup() {
  chmod -R u+w "$temp_root" 2>/dev/null || true
  rm -rf "$temp_root"
}
trap cleanup EXIT

snapshot="$temp_root/immutable-snapshot"
execution="$temp_root/execution-workspace"
output="$temp_root/output"
request_file="$temp_root/request.json"
capture_manifest="$temp_root/git-tree-manifest.bin"
mkdir -p "$snapshot" "$execution" "$output"

# Materialize the pinned commit, not the developer/runner working directory.
git -C "$source_root" archive --format=tar "$commit_sha" | tar -xf - -C "$snapshot"
git -C "$source_root" ls-tree -r -z "$commit_sha" > "$capture_manifest"
capture_sha256="$(sha256sum "$capture_manifest" | awk '{print $1}')"

snapshot_digest() {
  python3 - "$snapshot" <<'PY'
import hashlib
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
entries = []
for path in sorted(root.rglob("*"), key=lambda item: item.as_posix()):
    if path.is_file() and not path.is_symlink():
        entries.append((path.relative_to(root).as_posix(),
                        hashlib.sha256(path.read_bytes()).hexdigest()))
encoded = json.dumps(entries, separators=(",", ":"), ensure_ascii=False).encode()
print(hashlib.sha256(encoded).hexdigest())
PY
}

snapshot_before="$(snapshot_digest)"
chmod -R a-w "$snapshot"
cp -a "$snapshot/." "$execution/"
chmod -R u+w "$execution"

python3 - "$request_file" "$execution" "$output" "$commit_sha" "$tree_id" "$capture_sha256" <<'PY'
import json
import sys

request_path, execution, output, commit_sha, tree_id, capture_sha256 = sys.argv[1:]
request = {
    "protocolVersion": 1,
    "invocationId": "ci-erpm-be-extractor-smoke",
    "sourceId": "ci-source-erpm-be",
    "sourceRevisionId": "ci-revision-" + commit_sha,
    "repositoryId": "erpm-be",
    "commitSha": commit_sha,
    "treeId": tree_id,
    "captureManifestId": "ci-git-tree-" + commit_sha,
    "captureManifestSha256": capture_sha256,
    "executionWorkspaceRoot": execution,
    "outputDirectory": output,
    "extractorId": "roslyn-backend",
    "extractorVersion": "0.1.0",
    "sourceSchemaVersion": 2,
}
with open(request_path, "w", encoding="utf-8") as stream:
    json.dump(request, stream)
PY

pushd "$execution" >/dev/null
DOTNET_CLI_TELEMETRY_OPTOUT=1 dotnet run --no-build \
  --project "$repo_root/tools/ERPm.CodeIndex" -- extractor-host < "$request_file"
popd >/dev/null

snapshot_after="$(snapshot_digest)"
if [[ "$snapshot_before" != "$snapshot_after" ]]; then
  echo "Immutable snapshot content changed during extraction." >&2
  exit 1
fi

python3 - "$output" "$commit_sha" "$tree_id" "$capture_sha256" <<'PY'
import hashlib
import json
import pathlib
import sys

output, commit_sha, tree_id, capture_sha256 = sys.argv[1:]
output_path = pathlib.Path(output)
manifest = json.loads((output_path / "result-manifest.json").read_text(encoding="utf-8"))
artifact_path = output_path / manifest["artifactFile"]
artifact = artifact_path.read_bytes()
records = [json.loads(line) for line in artifact.splitlines() if line]

assert manifest["completed"] is True
assert manifest["protocolVersion"] == 1
assert manifest["sourceId"] == "ci-source-erpm-be"
assert manifest["sourceRevisionId"] == "ci-revision-" + commit_sha
assert manifest["repositoryId"] == "erpm-be"
assert manifest["commitSha"] == commit_sha
assert manifest["treeId"] == tree_id
assert manifest["captureManifestId"] == "ci-git-tree-" + commit_sha
assert manifest["captureManifestSha256"] == capture_sha256
assert manifest["extractorId"] == "roslyn-backend"
assert manifest["extractorVersion"] == "0.1.0"
assert manifest["sourceSchemaVersion"] == 2
assert manifest["artifactFile"] == "records.jsonl"
assert manifest["recordCount"] == len(records) > 0
assert manifest["artifactBytes"] == len(artifact)
assert manifest["artifactSha256"] == hashlib.sha256(artifact).hexdigest()
assert all(record["repositoryId"] == "erpm-be" for record in records)
assert all(record["commitSha"] == commit_sha for record in records)
assert all(record["schemaVersion"] == 2 for record in records)
assert all(not pathlib.PurePosixPath(record["path"]).is_absolute()
           and ".." not in pathlib.PurePosixPath(record["path"]).parts
           for record in records)


print(f"Extractor host smoke passed: {len(records)} records, sha256={manifest['artifactSha256']}")
PY
