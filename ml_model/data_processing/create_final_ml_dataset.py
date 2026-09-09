import pandas as pd

POSITIVE_TERRAIN = "data/processed/gsi_ner_positive_terrain_with_id.csv"
POSITIVE_WEATHER = "data/processed/gsi_landslide_weather_features.csv"
BACKGROUND_TERRAIN = "data/processed/gsi_matched_background_features.csv"
BACKGROUND_WEATHER = "data/processed/gsi_background_weather_features.csv"

OUTPUT = "data/processed/final_ml_dataset.csv"


print("Loading datasets...")

positive_terrain = pd.read_csv(POSITIVE_TERRAIN)
positive_weather = pd.read_csv(POSITIVE_WEATHER)

background_terrain = pd.read_csv(BACKGROUND_TERRAIN)
background_weather = pd.read_csv(BACKGROUND_WEATHER)


# --------------------------------------------------
# POSITIVE DATA
# Exact record-level matching using sl_no
# --------------------------------------------------

positive = positive_terrain.merge(
    positive_weather[
        [
            "sl_no",
            "event_date",
            "rainfall_1d",
            "rainfall_3d",
            "rainfall_7d",
            "rainfall_30d",
            "temperature",
            "humidity",
            "wind_speed"
        ]
    ],
    on="sl_no",
    how="inner"
)

positive["sample_type"] = "landslide_inventory"


# --------------------------------------------------
# BACKGROUND DATA
# Match using state + coordinates + event_date
# --------------------------------------------------

background = background_terrain.merge(
    background_weather[
        [
            "latitude",
            "longitude",
            "state",
            "event_date",
            "rainfall_1d",
            "rainfall_3d",
            "rainfall_7d",
            "rainfall_30d",
            "temperature",
            "humidity",
            "wind_speed"
        ]
    ],
    on=["latitude", "longitude", "state", "event_date"],
    how="inner"
)

background["sample_type"] = "background"


# --------------------------------------------------
# Keep common ML columns
# --------------------------------------------------

columns = [
    "latitude",
    "longitude",
    "state",
    "district",
    "event_date",
    "landslide_observed",
    "sample_type",
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

positive = positive[columns]
background = background[columns]


# --------------------------------------------------
# Combine
# --------------------------------------------------

final = pd.concat(
    [positive, background],
    ignore_index=True
)


# Remove exact duplicate rows
before = len(final)

final = final.drop_duplicates()

duplicates_removed = before - len(final)


# Sort for consistency
final = final.sort_values(
    ["landslide_observed", "state", "latitude", "longitude"]
).reset_index(drop=True)


# Save
final.to_csv(OUTPUT, index=False)


# --------------------------------------------------
# Validation
# --------------------------------------------------

print("\n" + "=" * 50)
print("FINAL ML DATASET")
print("=" * 50)

print("Positive records:", len(positive))
print("Background records:", len(background))
print("Total rows:", len(final))
print("Columns:", len(final.columns))
print("Duplicates removed:", duplicates_removed)

print("\nClass distribution:")
print(final["landslide_observed"].value_counts().sort_index())

print("\nState distribution:")
print(
    final.groupby(
        ["state", "landslide_observed"]
    ).size().unstack(fill_value=0)
)

print("\nMissing values:")
print(final.isnull().sum())

print("\nFeature statistics:")
print(
    final[
        [
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
    ].describe()
)

print("\nSaved:", OUTPUT)
