from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import requests
from fastapi import APIRouter, HTTPException

from ml_model.risk_engine import predict_risk

router = APIRouter(
    prefix="/risk",
    tags=["Risk Alerts"]
)

DATA_FILE = Path(
    "data/processed/gsi_ner_positive_terrain_with_id.csv"
)

NASA_POWER_URL = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
)


def fetch_weather(latitude: float, longitude: float):
    """
    Fetch recent weather data from NASA POWER
    for one risk-alert candidate location.
    """

    today = date.today()
    start_date = today - timedelta(days=30)

    params = {
        "start": start_date.strftime("%Y%m%d"),
        "end": today.strftime("%Y%m%d"),
        "latitude": latitude,
        "longitude": longitude,
        "community": "AG",
        "parameters": "PRECTOTCORR,T2M,RH2M,WS10M",
        "format": "JSON",
    }

    response = requests.get(
        NASA_POWER_URL,
        params=params,
        timeout=20
    )

    response.raise_for_status()

    data = response.json()

    weather = (
        data
        .get("properties", {})
        .get("parameter", {})
    )

    rainfall = weather.get("PRECTOTCORR", {})
    temperature = weather.get("T2M", {})
    humidity = weather.get("RH2M", {})
    wind_speed = weather.get("WS10M", {})

    if not rainfall:
        raise ValueError(
            "No rainfall data returned by NASA POWER"
        )

    def valid_value(source, day):
        value = source.get(day)

        if value is None:
            return None

        try:
            value = float(value)
        except (TypeError, ValueError):
            return None

        if value < -900:
            return None

        return value

    valid_rainfall = {
        day: valid_value(rainfall, day)
        for day in rainfall.keys()
    }

    valid_rainfall = {
        day: value
        for day, value in valid_rainfall.items()
        if value is not None
    }

    if not valid_rainfall:
        raise ValueError(
            "No valid rainfall values returned"
        )

    latest_day = max(valid_rainfall.keys())

    def rainfall_sum(days):
        selected_dates = sorted(
            valid_rainfall.keys()
        )[-days:]

        return sum(
            valid_rainfall[day]
            for day in selected_dates
        )

    return {
        "latest_date": latest_day,
        "rainfall_1d": round(rainfall_sum(1), 2),
        "rainfall_3d": round(rainfall_sum(3), 2),
        "rainfall_7d": round(rainfall_sum(7), 2),
        "rainfall_30d": round(rainfall_sum(30), 2),
        "temperature": valid_value(
            temperature,
            latest_day
        ),
        "humidity": valid_value(
            humidity,
            latest_day
        ),
        "wind_speed": valid_value(
            wind_speed,
            latest_day
        ),
    }


@router.get("/alerts")
def get_risk_alerts(
    limit: int = 5,
    state: str = "All States"
):
    """
    Generate ranked weather-aware risk alerts.

    GSI terrain features are combined with recent
    NASA POWER weather data and the XGBoost risk engine.

    This is a prototype screening system and is not
    an official disaster warning.
    """

    if not DATA_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="GSI terrain dataset not found."
        )

    limit = max(1, min(limit, 20))

    try:
        df = pd.read_csv(DATA_FILE)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to read GSI dataset: {exc}"
        )

    # Optional state filtering
    if state != "All States":

        state_columns = [
            column
            for column in df.columns
            if column.lower() == "state"
        ]

        if state_columns:
            df = df[
                df[state_columns[0]]
                .astype(str)
                .str.strip()
                .str.lower()
                == state.strip().lower()
            ]

    if df.empty:
        return {
            "status": "success",
            "total_locations": 0,
            "screened_locations": 0,
            "alerts": [],
            "message": (
                "No locations found for "
                "the selected state."
            )
        }

    # First identify terrain candidates.
    # This keeps external weather requests manageable.
    candidates = df.head(20)

    alerts = []
    weather_success = 0

    for _, row in candidates.iterrows():

        try:
            elevation = float(row["elevation"])
            slope = float(row["slope"])
            latitude = float(row["latitude"])
            longitude = float(row["longitude"])
        except (
            KeyError,
            TypeError,
            ValueError
        ):
            continue

        try:
            weather = fetch_weather(
                latitude,
                longitude
            )

            weather_success += 1

        except requests.RequestException:
            continue

        except Exception:
            continue

        features = {
            "elevation": elevation,
            "slope": slope,
            "rainfall_1d": weather["rainfall_1d"],
            "rainfall_3d": weather["rainfall_3d"],
            "rainfall_7d": weather["rainfall_7d"],
            "rainfall_30d": weather["rainfall_30d"],
            "temperature": (
                weather["temperature"]
                if weather["temperature"] is not None
                else 20.0
            ),
            "humidity": (
                weather["humidity"]
                if weather["humidity"] is not None
                else 70.0
            ),
            "wind_speed": (
                weather["wind_speed"]
                if weather["wind_speed"] is not None
                else 2.0
            ),
        }

        try:
            prediction = predict_risk(features)
        except Exception:
            continue

        alerts.append({
            "sl_no": (
                int(row["sl_no"])
                if "sl_no" in row
                and pd.notna(row["sl_no"])
                else None
            ),

            "latitude": latitude,
            "longitude": longitude,

            "elevation": round(elevation, 2),
            "slope": round(slope, 2),

            "risk_score": prediction["risk_score"],
            "risk_probability": (
                prediction["risk_probability"]
            ),
            "risk_level": prediction["risk_level"],

            "weather": {
                "source": "NASA POWER",
                "latest_date": weather["latest_date"],
                "rainfall_1d": weather["rainfall_1d"],
                "rainfall_3d": weather["rainfall_3d"],
                "rainfall_7d": weather["rainfall_7d"],
                "rainfall_30d": weather["rainfall_30d"],
                "temperature": weather["temperature"],
                "humidity": weather["humidity"],
                "wind_speed": weather["wind_speed"],
            },

            "data_note": (
                "Prototype weather-aware screening "
                "using GSI terrain and NASA POWER "
                "recent weather data."
            )
        })

    alerts.sort(
        key=lambda item: item["risk_probability"],
        reverse=True
    )

    return {
        "status": "success",
        "total_locations": len(df),
        "screened_locations": len(candidates),
        "weather_success": weather_success,
        "alerts": alerts[:limit],
        "data_note": (
            "This is a prototype screening system, "
            "not an official disaster warning."
        )
    }
