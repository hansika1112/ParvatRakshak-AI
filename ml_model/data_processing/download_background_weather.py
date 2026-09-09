import pandas as pd
import requests
import time
from pathlib import Path

BACKGROUND_FILE = Path(
    "data/processed/gsi_matched_background_features.csv"
)

CACHE_FILE = Path(
    "data/processed/nasa_power_weather_cache.csv"
)

OUTPUT_FILE = Path(
    "data/processed/gsi_background_weather_features.csv"
)

BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

PARAMETERS = "PRECTOTCORR,T2M,RH2M,WS10M"

LOOKBACK_DAYS = 30


def fetch_weather(latitude, longitude, event_date):

    event_date = pd.Timestamp(event_date)

    start_date = event_date - pd.Timedelta(
        days=LOOKBACK_DAYS - 1
    )

    params = {
        "parameters": PARAMETERS,
        "community": "AG",
        "longitude": round(float(longitude), 2),
        "latitude": round(float(latitude), 2),
        "start": int(start_date.strftime("%Y%m%d")),
        "end": int(event_date.strftime("%Y%m%d")),
        "format": "JSON"
    }

    for attempt in range(3):

        try:

            response = requests.get(
                BASE_URL,
                params=params,
                timeout=60
            )

            response.raise_for_status()

            data = response.json()

            parameter_data = data["properties"]["parameter"]

            event_key = event_date.strftime("%Y%m%d")

            rainfall_data = parameter_data["PRECTOTCORR"]

            dates = sorted(rainfall_data.keys())

            if event_key not in rainfall_data:
                return None

            event_index = dates.index(event_key)

            rainfall = [
                float(rainfall_data[d])
                for d in dates
            ]

            rainfall_1d = rainfall[event_index]

            rainfall_3d = sum(
                rainfall[
                    max(0, event_index - 2):
                    event_index + 1
                ]
            )

            rainfall_7d = sum(
                rainfall[
                    max(0, event_index - 6):
                    event_index + 1
                ]
            )

            rainfall_30d = sum(
                rainfall[
                    max(0, event_index - 29):
                    event_index + 1
                ]
            )

            return {
                "latitude": float(latitude),
                "longitude": float(longitude),
                "event_date": event_date.strftime("%Y-%m-%d"),
                "rainfall_1d": rainfall_1d,
                "rainfall_3d": rainfall_3d,
                "rainfall_7d": rainfall_7d,
                "rainfall_30d": rainfall_30d,
                "temperature": float(
                    parameter_data["T2M"][event_key]
                ),
                "humidity": float(
                    parameter_data["RH2M"][event_key]
                ),
                "wind_speed": float(
                    parameter_data["WS10M"][event_key]
                )
            }

        except Exception as error:

            print(
                f"Attempt {attempt + 1}/3 failed: "
                f"{latitude}, {longitude}, "
                f"{event_date.date()} -> {error}"
            )

            if attempt < 2:
                time.sleep(1)

    return None


# ---------------------------------------------------------
# Load background dataset
# ---------------------------------------------------------

background = pd.read_csv(BACKGROUND_FILE)

background["event_date"] = pd.to_datetime(
    background["event_date"],
    errors="coerce"
)

if background["event_date"].isna().any():

    raise ValueError(
        "Invalid event dates found in background dataset."
    )


# ---------------------------------------------------------
# Load existing cache safely
# ---------------------------------------------------------

weather_columns = [
    "latitude",
    "longitude",
    "event_date",
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_30d",
    "temperature",
    "humidity",
    "wind_speed"
]


if CACHE_FILE.exists():

    try:

        cache = pd.read_csv(CACHE_FILE)

        if (
            cache.empty
            or "event_date" not in cache.columns
        ):

            print(
                "Existing weather cache is empty or invalid."
            )

            cache = pd.DataFrame(
                columns=weather_columns
            )

    except Exception as error:

        print(
            "Could not read existing cache:",
            error
        )

        cache = pd.DataFrame(
            columns=weather_columns
        )

else:

    cache = pd.DataFrame(
        columns=weather_columns
    )


if not cache.empty:

    cache["event_date"] = pd.to_datetime(
        cache["event_date"],
        errors="coerce"
    )

    cache = cache.dropna(
        subset=["event_date"]
    )

    cache["latitude_key"] = cache[
        "latitude"
    ].round(2)

    cache["longitude_key"] = cache[
        "longitude"
    ].round(2)

    cache["date_key"] = cache[
        "event_date"
    ].dt.strftime("%Y-%m-%d")

else:

    cache["latitude_key"] = pd.Series(
        dtype=float
    )

    cache["longitude_key"] = pd.Series(
        dtype=float
    )

    cache["date_key"] = pd.Series(
        dtype=str
    )


# ---------------------------------------------------------
# Prepare unique background requests
# ---------------------------------------------------------

requests_df = background[
    [
        "latitude",
        "longitude",
        "event_date"
    ]
].copy()

requests_df["latitude_key"] = requests_df[
    "latitude"
].round(2)

requests_df["longitude_key"] = requests_df[
    "longitude"
].round(2)

requests_df["date_key"] = requests_df[
    "event_date"
].dt.strftime("%Y-%m-%d")

requests_df = requests_df.drop_duplicates(
    subset=[
        "latitude_key",
        "longitude_key",
        "date_key"
    ]
)

print(
    "\nBackground rows:",
    len(background)
)

print(
    "Unique weather requests:",
    len(requests_df)
)


# ---------------------------------------------------------
# Find cached requests
# ---------------------------------------------------------

existing_keys = set()

if not cache.empty:

    existing_keys = set(
        zip(
            cache["latitude_key"],
            cache["longitude_key"],
            cache["date_key"]
        )
    )


missing_requests = []

for _, row in requests_df.iterrows():

    key = (
        row["latitude_key"],
        row["longitude_key"],
        row["date_key"]
    )

    if key not in existing_keys:

        missing_requests.append(row)


print(
    "Weather records already cached:",
    len(existing_keys)
)

print(
    "New NASA POWER requests required:",
    len(missing_requests)
)


# ---------------------------------------------------------
# Fetch missing weather
# ---------------------------------------------------------

new_records = []

total = len(missing_requests)

for index, row in enumerate(
    missing_requests,
    start=1
):

    result = fetch_weather(
        row["latitude"],
        row["longitude"],
        row["event_date"]
    )

    if result is not None:

        new_records.append(result)

    print(
        f"[{index}/{total}] completed"
    )

    time.sleep(0.3)


# ---------------------------------------------------------
# Update cache
# ---------------------------------------------------------

if new_records:

    new_df = pd.DataFrame(
        new_records
    )

    new_df["event_date"] = pd.to_datetime(
        new_df["event_date"]
    )

    cache_clean = cache.drop(
        columns=[
            "latitude_key",
            "longitude_key",
            "date_key"
        ],
        errors="ignore"
    )

    cache = pd.concat(
        [
            cache_clean,
            new_df
        ],
        ignore_index=True
    )

    cache = cache.drop_duplicates(
        subset=[
            "latitude",
            "longitude",
            "event_date"
        ],
        keep="last"
    )

    cache.to_csv(
        CACHE_FILE,
        index=False
    )

    print(
        "\nWeather cache updated:",
        len(cache),
        "records"
    )


# ---------------------------------------------------------
# Prepare cache keys
# ---------------------------------------------------------

if cache.empty:

    raise RuntimeError(
        "No weather records available."
    )

cache["event_date"] = pd.to_datetime(
    cache["event_date"]
)

cache["latitude_key"] = cache[
    "latitude"
].round(2)

cache["longitude_key"] = cache[
    "longitude"
].round(2)

cache["date_key"] = cache[
    "event_date"
].dt.strftime("%Y-%m-%d"
)


# ---------------------------------------------------------
# Prepare background merge keys
# ---------------------------------------------------------

background["latitude_key"] = background[
    "latitude"
].round(2)

background["longitude_key"] = background[
    "longitude"
].round(2)

background["date_key"] = background[
    "event_date"
].dt.strftime("%Y-%m-%d"
)


# ---------------------------------------------------------
# Merge weather with background
# ---------------------------------------------------------

weather_for_merge = cache[
    [
        "latitude_key",
        "longitude_key",
        "date_key",
        "rainfall_1d",
        "rainfall_3d",
        "rainfall_7d",
        "rainfall_30d",
        "temperature",
        "humidity",
        "wind_speed"
    ]
].copy()

background_weather = background.merge(
    weather_for_merge,
    on=[
        "latitude_key",
        "longitude_key",
        "date_key"
    ],
    how="left"
)


# ---------------------------------------------------------
# Final columns
# ---------------------------------------------------------

background_weather = background_weather[
    [
        "latitude",
        "longitude",
        "state",
        "district",
        "event_date",
        "landslide_observed",
        "sample_type",
        "source_event_id",
        "elevation",
        "slope",
        "rainfall_1d",
        "rainfall_3d",
        "rainfall_7d",
        "rainfall_30d",
        "temperature",
        "humidity",
        "wind_speed"
    ]
]


# ---------------------------------------------------------
# Save output
# ---------------------------------------------------------

background_weather.to_csv(
    OUTPUT_FILE,
    index=False
)


# ---------------------------------------------------------
# Validation
# ---------------------------------------------------------

print(
    "\nBackground weather dataset created."
)

print(
    "Output:",
    OUTPUT_FILE
)

print(
    "Rows:",
    len(background_weather)
)

print("\nMissing values:")

print(
    background_weather.isna().sum()
)

print("\nLabel distribution:")

print(
    background_weather[
        "landslide_observed"
    ].value_counts()
)

print("\nState counts:")

print(
    background_weather[
        "state"
    ].value_counts()
)

print("\nWeather statistics:")

print(
    background_weather[
        [
            "rainfall_1d",
            "rainfall_3d",
            "rainfall_7d",
            "rainfall_30d",
            "temperature",
            "humidity",
            "wind_speed"
        ]
    ].describe()
)
