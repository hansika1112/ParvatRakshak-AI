import pandas as pd
import requests
import re
import time
from datetime import datetime
from pathlib import Path

INPUT_FILE = Path(
    "data/processed/gsi_ner_landslides_ml_ready_v2.csv"
)

OUTPUT_FILE = Path(
    "data/processed/gsi_landslide_weather_features.csv"
)

CACHE_FILE = Path(
    "data/processed/nasa_power_weather_cache.csv"
)

API_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

REQUEST_DELAY = 0.5
MAX_RETRIES = 3


def parse_history(value):
    value = str(value).strip()

    if value.lower() in ["unknown", "", "nan"]:
        return pd.NaT

    if re.fullmatch(r"\d{4}", value):
        return pd.NaT

    value = re.sub(
        r"(\d{1,2})(st|nd|rd|th)",
        r"\1",
        value,
        flags=re.IGNORECASE
    )

    formats = [
        "%d %B %Y",
        "%d %b %Y",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%d.%m.%Y"
    ]

    for fmt in formats:
        try:
            return pd.Timestamp(
                datetime.strptime(value, fmt)
            )
        except ValueError:
            continue

    return pd.NaT


def request_weather(latitude, longitude, start_date, end_date):

    params = {
        "latitude": float(latitude),
        "longitude": float(longitude),
        "start": int(start_date.strftime("%Y%m%d")),
        "end": int(end_date.strftime("%Y%m%d")),
        "community": "AG",
        "parameters": "PRECTOTCORR,T2M,RH2M,WS10M",
        "format": "JSON",
        "header": "true"
    }

    for attempt in range(1, MAX_RETRIES + 1):

        try:

            response = requests.get(
                API_URL,
                params=params,
                timeout=60
            )

            response.raise_for_status()

            return response.json()

        except Exception as error:

            print(
                f"Request failed "
                f"(attempt {attempt}/{MAX_RETRIES}): {error}"
            )

            if attempt < MAX_RETRIES:
                time.sleep(2 * attempt)

    return None


print("Loading GSI landslide dataset...")

df = pd.read_csv(INPUT_FILE)

print(f"Total GSI records: {len(df)}")


print("\nParsing event dates...")

df["event_date"] = df["history"].apply(parse_history)

weather_df = df[
    df["event_date"].notna()
].copy()

print(
    f"Records with exact event dates: "
    f"{len(weather_df)}"
)


if weather_df.empty:

    raise SystemExit(
        "No valid event dates found."
    )


# Use 2-decimal coordinates for controlled spatial caching.
weather_df["latitude_key"] = (
    weather_df["latitude"].round(2)
)

weather_df["longitude_key"] = (
    weather_df["longitude"].round(2)
)

weather_df["date_key"] = (
    weather_df["event_date"]
    .dt.strftime("%Y-%m-%d")
)


requests_df = (
    weather_df[
        [
            "latitude_key",
            "longitude_key",
            "date_key"
        ]
    ]
    .drop_duplicates()
    .reset_index(drop=True)
)


print(
    f"Unique weather requests required: "
    f"{len(requests_df)}"
)


# Load previous cache if available.
if CACHE_FILE.exists():

    cache = pd.read_csv(
        CACHE_FILE
    )

    print(
        f"Existing cached requests: "
        f"{len(cache)}"
    )

else:

    cache = pd.DataFrame(
        columns=[
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
    )


cached_keys = set(
    zip(
        cache["latitude_key"],
        cache["longitude_key"],
        cache["date_key"]
    )
)


new_requests = requests_df[
    ~requests_df.apply(
        lambda row: (
            row["latitude_key"],
            row["longitude_key"],
            row["date_key"]
        ) in cached_keys,
        axis=1
    )
].copy()


print(
    f"New API requests required: "
    f"{len(new_requests)}"
)


new_results = []


for counter, (_, row) in enumerate(
    new_requests.iterrows(),
    start=1
):

    latitude = row["latitude_key"]
    longitude = row["longitude_key"]

    event_date = pd.Timestamp(
        row["date_key"]
    )

    start_date = (
        event_date -
        pd.Timedelta(days=30)
    )

    end_date = event_date

    print(
        f"[{counter}/{len(new_requests)}] "
        f"Lat={latitude}, "
        f"Lon={longitude}, "
        f"Date={event_date.date()}"
    )


    data = request_weather(
        latitude,
        longitude,
        start_date,
        end_date
    )


    if data is None:

        print("Skipping failed request.")
        continue


    try:

        parameters = (
            data["properties"]["parameter"]
        )

        precipitation = pd.Series(
            parameters["PRECTOTCORR"],
            dtype="float64"
        )

        temperature = pd.Series(
            parameters["T2M"],
            dtype="float64"
        )

        humidity = pd.Series(
            parameters["RH2M"],
            dtype="float64"
        )

        wind_speed = pd.Series(
            parameters["WS10M"],
            dtype="float64"
        )


        result = {

            "latitude_key": latitude,

            "longitude_key": longitude,

            "date_key": row["date_key"],

            "rainfall_1d": (
                precipitation.tail(1).sum()
            ),

            "rainfall_3d": (
                precipitation.tail(3).sum()
            ),

            "rainfall_7d": (
                precipitation.tail(7).sum()
            ),

            "rainfall_30d": (
                precipitation.sum()
            ),

            "temperature": (
                temperature.tail(1).mean()
            ),

            "humidity": (
                humidity.tail(1).mean()
            ),

            "wind_speed": (
                wind_speed.tail(1).mean()
            )
        }


        new_results.append(result)


    except Exception as error:

        print(
            f"Failed to process response: "
            f"{error}"
        )


    time.sleep(
        REQUEST_DELAY
    )


if new_results:

    new_cache = pd.DataFrame(
        new_results
    )

    cache = pd.concat(
        [
            cache,
            new_cache
        ],
        ignore_index=True
    )

    cache = cache.drop_duplicates(
        subset=[
            "latitude_key",
            "longitude_key",
            "date_key"
        ],
        keep="last"
    )

    cache.to_csv(
        CACHE_FILE,
        index=False
    )


print(
    f"\nWeather cache records: "
    f"{len(cache)}"
)


# Join weather features back to every GSI record.
weather_df = weather_df.merge(
    cache,
    on=[
        "latitude_key",
        "longitude_key",
        "date_key"
    ],
    how="left"
)


output_columns = [
    "sl_no",
    "slide_no",
    "state",
    "district",
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


weather_features = weather_df[
    output_columns
].copy()


print("\nWeather feature statistics:")

print(
    weather_features[
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


print("\nMissing weather values:")

print(
    weather_features.isna().sum()
)


weather_features.to_csv(
    OUTPUT_FILE,
    index=False
)


print(
    f"\nSaved: {OUTPUT_FILE}"
)

print(
    f"Final weather records: "
    f"{len(weather_features)}"
)

print(
    "\nWeather pipeline completed successfully."
)
