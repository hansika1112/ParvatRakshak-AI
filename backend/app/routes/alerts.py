from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.alert_engine import generate_alert


router = APIRouter(
    prefix="/alerts",
    tags=["Multilingual Alerts"]
)


class AlertRequest(BaseModel):
    risk_level: str
    language: str = "English"


@router.post("")
def create_alert(request: AlertRequest):
    try:
        alert = generate_alert(
            risk_level=request.risk_level,
            language=request.language
        )

        return {
            "status": "success",
            "alert": alert
        }

    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
