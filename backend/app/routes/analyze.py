from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from backend.app.routes.weather import get_weather
from backend.app.services.alert_engine import generate_alert
from ml_model.risk_engine import predict_risk


router = APIRouter(
    prefix="/risk",
    tags=["Risk Analysis"]
)


DATA_FILE = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "processed"
    / "gsi_ner_positive_terrain_with_id.csv"
)


@router.get("/analyze-location")
def analyze_location(
    sl_no: int = Query(..., ge=1),
    language: str = Query(default="English")
):
    """
    Analyze a historical GSI location using:

    - GSI terrain features
    - NASA POWER recent weather
    - XGBoost landslide risk model
    - Multilingual alert engine

    Historical GSI records are used as locations.
    The returned risk is a current/prototype model prediction,
    not a statement that the historical location is currently
    experiencing a landslide.
    """

    if not DATA_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"GSI dataset not found: {DATA_FILE}"
        )

    try:
        df = pd.read_csv(DATA_FILE)

        matches = df[df["sl_no"] == sl_no]

        if matches.empty:
            raise HTTPException(
                status_code=404,
                detail=f"GSI location not found for sl_no={sl_no}"
            )

        location = matches.iloc[0]

        latitude = float(location["latitude"])
        longitude = float(location["longitude"])

        elevation = float(location["elevation"])
        slope = float(location["slope"])

        weather = get_weather(
            latitude=latitude,
            longitude=longitude
        )

        if weather.get("status") != "success":
            raise ValueError("Weather data could not be retrieved")

        features = {
            "elevation": elevation,
            "slope": slope,
            "rainfall_1d": weather["rainfall_1d"],
            "rainfall_3d": weather["rainfall_3d"],
            "rainfall_7d": weather["rainfall_7d"],
            "rainfall_30d": weather["rainfall_30d"],
            "temperature": weather["temperature"],
            "humidity": weather["humidity"],
            "wind_speed": weather["wind_speed"],
        }

        missing_weather = [
            key for key, value in features.items()
            if value is None
        ]

        if missing_weather:
            raise ValueError(
                f"Missing weather features: {missing_weather}"
            )

        prediction = predict_risk(features)

        alert = generate_alert(
            risk_level=prediction["risk_level"],
            language=language
        )

        return {
            "status": "success",
            "location": {
                "sl_no": int(location["sl_no"]),
                "slide_no": str(location["slide_no"]),
                "state": str(location["state"]),
                "district": str(location["district"]),
                "latitude": latitude,
                "longitude": longitude,
                "elevation": elevation,
                "slope": slope,
            },
            "weather": weather,
            "features_used": features,
            "prediction": prediction,
            "alert": alert,
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc)
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )
