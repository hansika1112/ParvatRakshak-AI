import pandas as pd
import numpy as np

FILE = "data/processed/final_ml_dataset.csv"

df = pd.read_csv(FILE)

print("=" * 60)
print("FINAL ML DATASET QUALITY CHECK")
print("=" * 60)

# --------------------------------------------------
# Basic information
# --------------------------------------------------

print("\nDataset shape:")
print("Rows:", len(df))
print("Columns:", len(df.columns))

print("\nColumns:")
for col in df.columns:
    print("-", col)


# --------------------------------------------------
# Labels
# --------------------------------------------------

print("\n" + "=" * 60)
print("LABEL CHECK")
print("=" * 60)

print("Unique labels:", sorted(df["landslide_observed"].unique()))

if set(df["landslide_observed"].unique()) <= {0, 1}:
    print("SUCCESS: Labels are binary (0/1).")
else:
    print("ERROR: Unexpected label values found.")


print("\nClass distribution:")
print(df["landslide_observed"].value_counts().sort_index())


# --------------------------------------------------
# Missing values
# --------------------------------------------------

print("\n" + "=" * 60)
print("MISSING VALUE CHECK")
print("=" * 60)

missing = df.isnull().sum()

print(missing)

if missing.sum() == 0:
    print("\nSUCCESS: No missing values.")
else:
    print("\nWARNING: Missing values found.")


# --------------------------------------------------
# Numerical features
# --------------------------------------------------

numeric_features = [
    "latitude",
    "longitude",
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

print("\n" + "=" * 60)
print("NUMERICAL FEATURE CHECK")
print("=" * 60)

for col in numeric_features:

    values = pd.to_numeric(df[col], errors="coerce")

    nan_count = values.isna().sum()
    inf_count = np.isinf(values).sum()

    print(
        f"{col:15} "
        f"NaN={nan_count:4} "
        f"Inf={inf_count:4} "
        f"Min={values.min():.3f} "
        f"Max={values.max():.3f}"
    )


# --------------------------------------------------
# Coordinate validation
# --------------------------------------------------

print("\n" + "=" * 60)
print("COORDINATE CHECK")
print("=" * 60)

invalid_lat = ((df["latitude"] < -90) | (df["latitude"] > 90)).sum()
invalid_lon = ((df["longitude"] < -180) | (df["longitude"] > 180)).sum()

print("Invalid latitude:", invalid_lat)
print("Invalid longitude:", invalid_lon)

if invalid_lat == 0 and invalid_lon == 0:
    print("SUCCESS: Coordinates are valid.")


# --------------------------------------------------
# Terrain check
# --------------------------------------------------

print("\n" + "=" * 60)
print("TERRAIN CHECK")
print("=" * 60)

print("Elevation < 0:", (df["elevation"] < 0).sum())
print("Slope < 0:", (df["slope"] < 0).sum())
print("Slope > 90:", (df["slope"] > 90).sum())


# --------------------------------------------------
# Weather check
# --------------------------------------------------

print("\n" + "=" * 60)
print("WEATHER CHECK")
print("=" * 60)

rainfall_cols = [
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_30d"
]

for col in rainfall_cols:
    print(
        f"{col}: negative values = "
        f"{(df[col] < 0).sum()}"
    )

print(
    "Humidity outside 0-100:",
    ((df["humidity"] < 0) | (df["humidity"] > 100)).sum()
)

print(
    "Wind speed negative:",
    (df["wind_speed"] < 0).sum()
)


# --------------------------------------------------
# Date check
# --------------------------------------------------

print("\n" + "=" * 60)
print("DATE CHECK")
print("=" * 60)

dates = pd.to_datetime(
    df["event_date"],
    errors="coerce"
)

print("Invalid dates:", dates.isna().sum())

if dates.notna().all():
    print("Minimum date:", dates.min().date())
    print("Maximum date:", dates.max().date())
    print("SUCCESS: All event dates are valid.")


# --------------------------------------------------
# State distribution
# --------------------------------------------------

print("\n" + "=" * 60)
print("STATE / CLASS BALANCE")
print("=" * 60)

state_class = (
    df.groupby(
        ["state", "landslide_observed"]
    )
    .size()
    .unstack(fill_value=0)
)

print(state_class)


# --------------------------------------------------
# Exact duplicate check
# --------------------------------------------------

print("\n" + "=" * 60)
print("DUPLICATE CHECK")
print("=" * 60)

duplicates = df.duplicated().sum()

print("Exact duplicate rows:", duplicates)

if duplicates == 0:
    print("SUCCESS: No exact duplicate rows.")


print("\n" + "=" * 60)
print("QUALITY CHECK COMPLETE")
print("=" * 60)
