from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/roads",
    tags=["Road Monitoring"],
)

DATA_FILE = Path(
    "data/processed/roads/road_weather_ml_screening.parquet"
)


@router.get("/monitor")
def get_road_monitoring(
    limit: int = 50,
    state: str = "All States",
    highway: str = "All Types",
    risk_level: str = "All Levels",
):
    """
    Return road-level weather-aware ML screening results.

    This endpoint exposes the locally generated road screening
    dataset. It is a prototype screening system and is not
    an official highway closure or disaster-warning service.
    """

    if not DATA_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="Road screening dataset not found.",
        )

    limit = max(1, min(limit, 100))

    try:
        df = pd.read_parquet(DATA_FILE)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to read road screening dataset: {exc}",
        )

    if df.empty:
        return {
            "status": "success",
            "summary": {
                "total_segments": 0,
                "screened_segments": 0,
                "weather_unavailable": 0,
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
            },
            "filters": {
                "state": state,
                "highway": highway,
                "risk_level": risk_level,
            },
            "roads": [],
            "data_note": (
                "No road screening records are currently available."
            ),
        }

    df["osm_id"] = df["osm_id"].astype(str)

    # Normalize risk/weather fields.
    if "risk_score" in df.columns:
        df["risk_score"] = pd.to_numeric(
            df["risk_score"],
            errors="coerce",
        )

    if "risk_probability" in df.columns:
        df["risk_probability"] = pd.to_numeric(
            df["risk_probability"],
            errors="coerce",
        )

    # Base summary is calculated on the complete road dataset.
    total_segments = len(df)

    screened_mask = (
        df["screening_status"].astype(str).eq("screened")
    )

    screened = df[screened_mask].copy()
    weather_unavailable = df[~screened_mask].copy()

    risk_counts = (
        screened["risk_level"]
        .value_counts()
        .to_dict()
    )

    # Apply requested filters to displayed roads.
    filtered = df.copy()

    if state != "All States":
        filtered = filtered[
            filtered["state"]
            .astype(str)
            .str.strip()
            .str.lower()
            == state.strip().lower()
        ]

    if highway != "All Types":
        filtered = filtered[
            filtered["highway"]
            .astype(str)
            .str.strip()
            .str.lower()
            == highway.strip().lower()
        ]

    if risk_level != "All Levels":
        filtered = filtered[
            filtered["risk_level"]
            .astype(str)
            .str.strip()
            .str.lower()
            == risk_level.strip().lower()
        ]

    # Highest risk first.
    filtered = filtered.sort_values(
        by="risk_score",
        ascending=False,
        na_position="last",
    ).head(limit)

    roads = []

    for _, row in filtered.iterrows():

        road_name = row.get("road_name")
        if pd.isna(road_name) or not str(road_name).strip():
            road_name = None

        risk_score = row.get("risk_score")
        if pd.isna(risk_score):
            risk_score = None
        else:
            risk_score = round(float(risk_score), 2)

        risk_probability = row.get(
            "risk_probability"
        )
        if pd.isna(risk_probability):
            risk_probability = None
        else:
            risk_probability = round(
                float(risk_probability),
                4,
            )

        roads.append(
            {
                "osm_id": str(row["osm_id"]),
                "road_name": road_name,
                "highway": str(row["highway"]),
                "state": str(row["state"]),
                "district": str(row["district"]),
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "slope": round(float(row["slope"]), 2),
                "max_slope": round(
                    float(row["max_slope"]),
                    2,
                ),
                "elevation": round(
                    float(row["elevation"]),
                    2,
                ),
                "representative_distance_m": round(
                    float(row["representative_distance_m"]),
                    2,
                ),
                "risk_score": risk_score,
                "risk_probability": risk_probability,
                "risk_level": (
                    None
                    if pd.isna(row.get("risk_level"))
                    else str(row["risk_level"])
                ),
                "screening_status": str(
                    row["screening_status"]
                ),
                "latest_date": (
                    None
                    if pd.isna(row.get("latest_date"))
                    else str(row["latest_date"])
                ),
                "rainfall_1d": (
                    None
                    if pd.isna(row.get("rainfall_1d"))
                    else round(
                        float(row["rainfall_1d"]),
                        2,
                    )
                ),
                "rainfall_7d": (
                    None
                    if pd.isna(row.get("rainfall_7d"))
                    else round(
                        float(row["rainfall_7d"]),
                        2,
                    )
                ),
                "rainfall_30d": (
                    None
                    if pd.isna(row.get("rainfall_30d"))
                    else round(
                        float(row["rainfall_30d"]),
                        2,
                    )
                ),
                "temperature": (
                    None
                    if pd.isna(row.get("temperature"))
                    else round(
                        float(row["temperature"]),
                        2,
                    )
                ),
                "humidity": (
                    None
                    if pd.isna(row.get("humidity"))
                    else round(
                        float(row["humidity"]),
                        2,
                    )
                ),
            }
        )

    return {
        "status": "success",
        "summary": {
            "total_segments": total_segments,
            "screened_segments": len(screened),
            "weather_unavailable": len(weather_unavailable),
            "critical": int(risk_counts.get("Critical", 0)),
            "high": int(risk_counts.get("High", 0)),
            "medium": int(risk_counts.get("Medium", 0)),
            "low": int(risk_counts.get("Low", 0)),
        },
        "filtered_count": len(filtered),
        "filters": {
            "state": state,
            "highway": highway,
            "risk_level": risk_level,
        },
        "roads": roads,
        "data_note": (
            "Prototype weather-aware road screening using "
            "OSM road geometry, GSI terrain features, NASA POWER "
            "recent weather data and the XGBoost risk engine."
        ),
        "warning": (
            "Road screening results are not official road-closure "
            "decisions or disaster warnings."
        ),
    }
