from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(
    prefix="/locations",
    tags=["GIS Locations"]
)

DATA_FILE = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "processed"
    / "gsi_ner_positive_terrain_with_id.csv"
)


@router.get("")
def get_locations(
    state: str | None = Query(default=None),
    limit: int = Query(default=1000, ge=1, le=5000),
    offset: int = Query(default=0, ge=0)
):
    """
    Return historical GSI landslide locations with terrain features.

    These are historical inventory locations, not current risk predictions.
    """

    if not DATA_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"GSI dataset not found: {DATA_FILE}"
        )

    try:
        df = pd.read_csv(DATA_FILE)

        if state:
            df = df[
                df["state"].astype(str).str.lower()
                == state.strip().lower()
            ]

        total = len(df)

        df = df.iloc[offset: offset + limit]

        records = []

        for _, row in df.iterrows():
            records.append(
                {
                    "sl_no": int(row["sl_no"]),
                    "slide_no": str(row["slide_no"]),
                    "state": str(row["state"]),
                    "district": str(row["district"]),
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "elevation": float(row["elevation"]),
                    "slope": float(row["slope"]),
                    "landslide_observed": int(row["landslide_observed"])
                }
            )

        return {
            "status": "success",
            "total": total,
            "offset": offset,
            "limit": limit,
            "count": len(records),
            "locations": records
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
