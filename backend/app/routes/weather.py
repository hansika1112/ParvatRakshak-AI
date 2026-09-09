from datetime import date, timedelta

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(
    prefix="/weather",
    tags=["Weather"]
)

NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


@router.get("")
def get_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
):
    """
    Fetch recent daily weather data from NASA POWER.

    This is a weather-data source for the prototype.
    It is not the IMD API.
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

    try:
        response = requests.get(
            NASA_POWER_URL,
            params=params,
            timeout=30
        )

        response.raise_for_status()
        data = response.json()

        weather = data.get("properties", {}).get("parameter", {})

        rainfall = weather.get("PRECTOTCORR", {})
        temperature = weather.get("T2M", {})
        humidity = weather.get("RH2M", {})
        wind_speed = weather.get("WS10M", {})

        if not rainfall:
            raise ValueError("No rainfall data returned by NASA POWER")

        valid_dates = sorted(rainfall.keys())

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
            for day in valid_dates
        }

        valid_rainfall = {
            day: value
            for day, value in valid_rainfall.items()
            if value is not None
        }

        if not valid_rainfall:
            raise ValueError("No valid rainfall values returned")

        latest_day = max(valid_rainfall.keys())

        def rainfall_sum(days):
            selected_dates = sorted(valid_rainfall.keys())[-days:]
            return sum(
                valid_rainfall[day]
                for day in selected_dates
            )

        latest_temperature = valid_value(
            temperature,
            latest_day
        )

        latest_humidity = valid_value(
            humidity,
            latest_day
        )

        latest_wind = valid_value(
            wind_speed,
            latest_day
        )

        return {
            "status": "success",
            "source": "NASA POWER",
            "latitude": latitude,
            "longitude": longitude,
            "latest_date": latest_day,
            "rainfall_1d": round(rainfall_sum(1), 2),
            "rainfall_3d": round(rainfall_sum(3), 2),
            "rainfall_7d": round(rainfall_sum(7), 2),
            "rainfall_30d": round(rainfall_sum(30), 2),
            "temperature": (
                round(latest_temperature, 2)
                if latest_temperature is not None
                else None
            ),
            "humidity": (
                round(latest_humidity, 2)
                if latest_humidity is not None
                else None
            ),
            "wind_speed": (
                round(latest_wind, 2)
                if latest_wind is not None
                else None
            ),
        }

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"NASA POWER request failed: {exc}"
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )
