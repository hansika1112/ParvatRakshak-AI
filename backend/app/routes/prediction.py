from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ml_model.risk_engine import predict_risk


router = APIRouter(
    prefix="/predict",
    tags=["Risk Prediction"]
)


class PredictionRequest(BaseModel):

    elevation: float = Field(..., ge=0)
    slope: float = Field(..., ge=0, le=90)

    rainfall_1d: float = Field(..., ge=0)
    rainfall_3d: float = Field(..., ge=0)
    rainfall_7d: float = Field(..., ge=0)
    rainfall_30d: float = Field(..., ge=0)

    temperature: float
    humidity: float = Field(..., ge=0, le=100)
    wind_speed: float = Field(..., ge=0)


@router.post("")
def predict(request: PredictionRequest):

    try:

        features = request.model_dump()

        result = predict_risk(features)

        return {
            "status": "success",
            "prediction": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
