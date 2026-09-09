from datetime import datetime, timezone
from pathlib import Path
import json
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

router = APIRouter(
    prefix="/reports",
    tags=["Citizen Reports"]
)

REPORT_DIR = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "raw"
    / "citizen_reports"
)

METADATA_FILE = REPORT_DIR / "reports.json"

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
}

MAX_FILE_SIZE = 20 * 1024 * 1024


def load_reports():
    if not METADATA_FILE.exists():
        return []

    try:
        return json.loads(
            METADATA_FILE.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError:
        return []


@router.post("")
async def create_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: str = Form(...),
    severity: str = Form(...),
    language: str = Form("English"),
    media: UploadFile | None = File(default=None),
):
    if not -90 <= latitude <= 90:
        raise HTTPException(
            status_code=422,
            detail="Invalid latitude"
        )

    if not -180 <= longitude <= 180:
        raise HTTPException(
            status_code=422,
            detail="Invalid longitude"
        )

    allowed_severity = {
        "Low",
        "Medium",
        "High",
        "Critical"
    }

    if severity not in allowed_severity:
        raise HTTPException(
            status_code=422,
            detail="Severity must be Low, Medium, High, or Critical"
        )

    allowed_languages = {
        "English",
        "Hindi",
        "Assamese"
    }

    if language not in allowed_languages:
        raise HTTPException(
            status_code=422,
            detail="Unsupported language"
        )

    if not description.strip():
        raise HTTPException(
            status_code=422,
            detail="Description cannot be empty"
        )

    REPORT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    report_id = f"PR-{uuid.uuid4().hex[:10].upper()}"

    media_filename = None

    if media:
        if media.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=415,
                detail=(
                    "Unsupported media type. "
                    "Use JPG, PNG, WEBP, MP4, or WEBM."
                )
            )

        content = await media.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Media file must be 20 MB or smaller"
            )

        extension = ALLOWED_TYPES[media.content_type]

        media_filename = f"{report_id}{extension}"

        media_path = REPORT_DIR / media_filename

        media_path.write_bytes(content)

    report = {
        "report_id": report_id,
        "latitude": latitude,
        "longitude": longitude,
        "description": description.strip(),
        "severity": severity,
        "language": language,
        "media_filename": media_filename,
        "created_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "status": "received",
    }

    reports = load_reports()
    reports.append(report)

    METADATA_FILE.write_text(
        json.dumps(
            reports,
            indent=2,
            ensure_ascii=False
        ),
        encoding="utf-8"
    )

    return {
        "status": "success",
        "message": "Citizen landslide report received",
        "report": report
    }


@router.get("")
def get_reports():
    reports = load_reports()

    return {
        "status": "success",
        "count": len(reports),
        "reports": reports
    }
