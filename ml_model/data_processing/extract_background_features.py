import pandas as pd
import geopandas as gpd
import rasterio
from pathlib import Path

BACKGROUND_FILE = Path(
    "data/processed/gsi_matched_background_weather_base.csv"
)

BOUNDARY_FILE = Path(
    "data/processed/ner_district_boundaries.shp"
)

DEM_FILE = Path(
    "data/processed/ner_copernicus_glo30.tif"
)

SLOPE_FILE = Path(
    "data/processed/ner_slope_degrees_final.tif"
)

OUTPUT_FILE = Path(
    "data/processed/gsi_matched_background_features.csv"
)


background = pd.read_csv(BACKGROUND_FILE)

background["state"] = (
    background["state"]
    .str.strip()
    .str.title()
)

points = gpd.GeoDataFrame(
    background,
    geometry=gpd.points_from_xy(
        background["longitude"],
        background["latitude"]
    ),
    crs="EPSG:4326"
)

districts = gpd.read_file(BOUNDARY_FILE)

if districts.crs != points.crs:
    districts = districts.to_crs(points.crs)

district_column = None

for column in districts.columns:
    values = districts[column].astype(str).str.lower()

    if "district" in column.lower():
        district_column = column
        break

if district_column is None:
    raise ValueError(
        "District column could not be detected in boundary shapefile."
    )

state_column = None

for column in districts.columns:
    if "state" in column.lower():
        state_column = column
        break

if state_column is None:
    raise ValueError(
        "State column could not be detected in boundary shapefile."
    )

district_subset = districts[
    [state_column, district_column, "geometry"]
].copy()

district_subset = district_subset.rename(
    columns={
        state_column: "boundary_state",
        district_column: "district"
    }
)

joined = gpd.sjoin(
    points,
    district_subset,
    how="left",
    predicate="within"
)

joined = joined.drop(
    columns=["geometry", "index_right"],
    errors="ignore"
)

joined["district"] = (
    joined["district"]
    .astype("string")
    .str.strip()
)

print("\nDistrict assignment:")
print(
    joined["district"]
    .isna()
    .sum(),
    "background points without district"
)

with rasterio.open(DEM_FILE) as dem:
    coords = list(
        zip(
            joined["longitude"],
            joined["latitude"]
        )
    )

    elevation = [
        value[0]
        for value in dem.sample(coords)
    ]

joined["elevation"] = elevation

with rasterio.open(SLOPE_FILE) as slope:
    coords = list(
        zip(
            joined["longitude"],
            joined["latitude"]
        )
    )

    slope_values = [
        value[0]
        for value in slope.sample(coords)
    ]

joined["slope"] = slope_values

joined["elevation"] = pd.to_numeric(
    joined["elevation"],
    errors="coerce"
)

joined["slope"] = pd.to_numeric(
    joined["slope"],
    errors="coerce"
)

joined = joined[
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
        "slope"
    ]
]

joined.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\nBackground feature dataset created.")
print("Output:", OUTPUT_FILE)
print("Rows:", len(joined))

print("\nMissing values:")
print(joined.isna().sum())

print("\nState counts:")
print(joined["state"].value_counts())

print("\nSample:")
print(joined.head(10).to_string(index=False))
