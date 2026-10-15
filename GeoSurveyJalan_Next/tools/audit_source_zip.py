#!/usr/bin/env python3
"""Safely inventory and extract the baseline ZIP for local/CI review.

This script does not modify or delete the original archive. It rejects path
traversal and symlink entries, then writes an inventory and basic static checks.
"""
from __future__ import annotations

import ast
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import sys
import zipfile

REPO_ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = REPO_ROOT / "pkrms-geosurvey-pro.zip"
OUTPUT = REPO_ROOT / "GeoSurveyJalan_Next" / "source_snapshot"
REPORT_DIR = REPO_ROOT / "GeoSurveyJalan_Next" / "audit"
MAX_FILES = 100_000
MAX_TOTAL_UNCOMPRESSED = 2 * 1024 * 1024 * 1024  # 2 GiB safety cap


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_member_name(name: str) -> PurePosixPath:
    normalized = name.replace("\\", "/")
    member = PurePosixPath(normalized)
    if member.is_absolute() or any(part in ("..", "") for part in member.parts):
        raise ValueError(f"Unsafe archive path: {name!r}")
    if member.parts and ":" in member.parts[0]:
        raise ValueError(f"Drive-qualified archive path: {name!r}")
    return member


def main() -> int:
    if not ARCHIVE.is_file():
        print(f"ERROR: source archive not found: {ARCHIVE}", file=sys.stderr)
        return 2

    archive_hash = sha256_file(ARCHIVE)
    inventory: list[dict] = []
    python_checks: list[dict] = []
    total_size = 0

    try:
        with zipfile.ZipFile(ARCHIVE) as zf:
            infos = zf.infolist()
            if len(infos) > MAX_FILES:
                raise ValueError(f"Archive contains too many entries: {len(infos)}")
            for info in infos:
                member = safe_member_name(info.filename)
                total_size += info.file_size
                if total_size > MAX_TOTAL_UNCOMPRESSED:
                    raise ValueError("Archive exceeds 2 GiB uncompressed safety limit")
                # Reject Unix symbolic links. Do not follow or materialize them.
                mode = (info.external_attr >> 16) & 0xFFFF
                if (mode & 0o170000) == 0o120000:
                    raise ValueError(f"Symlink entry rejected: {info.filename!r}")
                inventory.append({
                    "path": str(member),
                    "compressed_size": info.compress_size,
                    "size": info.file_size,
                    "is_dir": info.is_dir(),
                })

            OUTPUT.mkdir(parents=True, exist_ok=True)
            for info in infos:
                member = safe_member_name(info.filename)
                destination = OUTPUT.joinpath(*member.parts)
                if info.is_dir():
                    destination.mkdir(parents=True, exist_ok=True)
                    continue
                destination.parent.mkdir(parents=True, exist_ok=True)
                # Read through ZipFile rather than using extractall, after path checks.
                with zf.open(info, "r") as src, destination.open("wb") as dst:
                    while True:
                        chunk = src.read(1024 * 1024)
                        if not chunk:
                            break
                        dst.write(chunk)

    except (zipfile.BadZipFile, OSError, RuntimeError, ValueError) as exc:
        print(f"ERROR: archive extraction/audit failed: {exc}", file=sys.stderr)
        return 3

    for path in sorted(OUTPUT.rglob("*.py")):
        try:
            source = path.read_text(encoding="utf-8-sig")
            ast.parse(source, filename=str(path))
            result = {"path": path.relative_to(OUTPUT).as_posix(), "syntax": "ok"}
        except UnicodeDecodeError as exc:
            result = {"path": path.relative_to(OUTPUT).as_posix(), "syntax": "not-utf8", "error": str(exc)}
        except SyntaxError as exc:
            result = {
                "path": path.relative_to(OUTPUT).as_posix(),
                "syntax": "error",
                "line": exc.lineno,
                "message": exc.msg,
            }
        python_checks.append(result)

    candidates = [
        item for item in inventory
        if Path(item["path"]).name.lower() in {
            "requirements.txt", "pyproject.toml", "setup.py", "setup.cfg",
            "readme.md", "main.py", "app.py", "__main__.py"
        }
    ]
    report = {
        "archive": ARCHIVE.name,
        "archive_size": ARCHIVE.stat().st_size,
        "archive_sha256": archive_hash,
        "entry_count": len(inventory),
        "uncompressed_bytes": total_size,
        "extracted_to": OUTPUT.relative_to(REPO_ROOT).as_posix(),
        "files": inventory,
        "candidate_entrypoints_and_manifests": candidates,
        "python_syntax_checks": python_checks,
        "limitations": [
            "Static syntax checks do not prove application correctness.",
            "Dependencies and runtime behavior have not been tested by this script.",
            "Binary assets and application semantics require manual review."
        ],
    }
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORT_DIR / "source_inventory.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    summary = [
        "# Source ZIP Inventory",
        "",
        f"- Archive: `{ARCHIVE.name}`",
        f"- SHA-256: `{archive_hash}`",
        f"- Entries: {len(inventory)}",
        f"- Uncompressed bytes: {total_size}",
        f"- Extracted to: `{OUTPUT.relative_to(REPO_ROOT).as_posix()}/`",
        f"- Python files: {len(python_checks)}",
        f"- Python syntax errors: {sum(1 for item in python_checks if item['syntax'] == 'error')}",
        "",
        "## Candidate entrypoints and manifests",
        "",
    ]
    summary.extend(f"- `{item['path']}` ({item['size']} bytes)" for item in candidates)
    if not candidates:
        summary.append("- No common entrypoint or dependency manifest names were found.")
    summary.extend(["", "## Python syntax findings", ""])
    errors = [item for item in python_checks if item["syntax"] != "ok"]
    if errors:
        summary.extend(
            f"- `{item['path']}`: {item['syntax']}"
            + (f" at line {item.get('line')}: {item.get('message')}" if item.get("message") else "")
            for item in errors
        )
    else:
        summary.append("No Python syntax errors detected by AST parsing (if Python files exist).")
    summary.extend(["", "## Limits", ""])
    summary.extend(f"- {item}" for item in report["limitations"])
    (REPORT_DIR / "source_inventory.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
    print("\n".join(summary))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
