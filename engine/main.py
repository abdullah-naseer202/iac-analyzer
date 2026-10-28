import tempfile
from collections import Counter
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile

from iac_parser import parse_file
from risk import calculate_risk
from remediation import add_remediation
from scanner import scan

app = FastAPI(title="IaC Analyzer Engine")

ALLOWED_SUFFIXES = {".tf", ".yaml", ".yml"}


async def _parse_upload(file: UploadFile):
    name = Path(file.filename).name
    if Path(name).suffix.lower() not in ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail="Only .tf, .yaml and .yml files are supported",
        )

    content = await file.read()
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / name
        path.write_bytes(content)
        try:
            return parse_file(path)
        except Exception as exc:
            raise HTTPException(
                status_code=422, detail=f"Could not parse file: {exc}"
            )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/parse")
async def parse(file: UploadFile = File(...)):
    return await _parse_upload(file)


@app.post("/scan")
async def scan_file(file: UploadFile = File(...)):
    parsed = await _parse_upload(file)
    findings = add_remediation(scan(parsed))
    counts = Counter(f["severity"] for f in findings)
    return {
        "file": parsed["file"],
        "type": parsed["type"],
        "risk": calculate_risk(findings),
        "summary": {
            "total": len(findings),
            "high": counts.get("HIGH", 0),
            "medium": counts.get("MEDIUM", 0),
            "low": counts.get("LOW", 0),
        },
        "findings": findings,
    }