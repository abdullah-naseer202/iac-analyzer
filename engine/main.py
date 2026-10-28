import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile

from iac_parser import parse_file

app = FastAPI(title="IaC Analyzer Engine")

ALLOWED_SUFFIXES = {".tf", ".yaml", ".yml"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/parse")
async def parse(file: UploadFile = File(...)):
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