import pandas as pd
import geopandas as gpd
import numpy as np
from pathlib import Path
from shapely.geometry import Point

GSI_FILE = Path(
    "data/processed/gsi_ner_landslides_ml_ready_v2.csv"
)

BOUNDARY_FILE = Path(
    "data/processed/ner_district_boundaries.geojson"
)

OUTPUT_FILE = Path(
    "data/processed/gsi_ner_background_samples.csv"
)

TARGET_SAMPLES = 11024
MIN_DISTANCE_KM = 5
RANDOM_SEED = 42

NER_STATES = [
    "ARUNACHAL PRADESH",
    "ASSAM",
    "MANIPUR",
    "MEGHALAYA",
    "MIZORAM",
    "NAGALAND",
    "SIKKIM",
    "TRIPURA",
]

print("Loading GSI landslide data...")
gsi = pd.read_csv(GSI_FILE)

print(f"GSI landslide records: {len(gsi)}")

print("Loading NER boundary...")
boundary = gpd.read_file(BOUNDARY_FILE)

boundary = boundary[
    boundary["STATE_UT"].str.upper().isin(NER_STATES)
].copy()

boundary = boundary.to_crs("EPSG:4326")

print(f"NER boundary polygons: {len(boundary)}")

landslide_points = gpd.GeoDataFrame(
    gsi,
    geometry=gpd.points_from_xy(
        gsi["longitude"],
        gsi["latitude"]
    ),
    crs="EPSG:4326"
)

# Use a metric CRS for distance calculations.
metric_boundary = boundary.to_crs("EPSG:32645")
metric_landslides = landslide_points.to_crs("EPSG:32645")

landslide_union = metric_landslides.geometry.union_all()

# Create a 5 km exclusion zone around known landslides.
exclusion_zone = landslide_union.buffer(MIN_DISTANCE_KM * 1000)

minx, miny, maxx, maxy = metric_boundary.total_bounds

rng = np.random.default_rng(RANDOM_SEED)

background_points = []

print("Generating background samples...")

attempts = 0
max_attempts = TARGET_SAMPLES * 100

while len(background_points) < TARGET_SAMPLES and attempts < max_attempts:
    attempts += 1

    x = rng.uniform(minx, maxx)
    y = rng.uniform(miny, maxy)

    point = Point(x, y)

    if not metric_boundary.geometry.contains(point).any():
        continue

    if exclusion_zone.contains(point):
        continue

    background_points.append(point)

print(f"Background samples generated: {len(background_points)}")
print(f"Attempts: {attempts}")

if len(background_points) < TARGET_SAMPLES:
    raise RuntimeError(
        f"Could generate only {len(background_points)} "
        f"of {TARGET_SAMPLES} requested samples."
    )

background_metric = gpd.GeoDataFrame(
    geometry=background_points,
    crs="EPSG:32645"
)

background = background_metric.to_crs("EPSG:4326")

background["latitude"] = background.geometry.y
background["longitude"] = background.geometry.x
background["landslide_observed"] = 0
background["sample_type"] = "background"

# Assign state using spatial join.
state_polygons = boundary[
    ["STATE_UT", "geometry"]
].to_crs("EPSG:4326")

background = gpd.sjoin(
    background,
    state_polygons,
    how="left",
    predicate="within"
)

background = background.rename(
    columns={"STATE_UT": "state"}
)

result = pd.DataFrame({
    "latitude": background["latitude"],
    "longitude": background["longitude"],
    "state": background["state"],
    "landslide_observed": background["landslide_observed"],
    "sample_type": background["sample_type"],
})

result.to_csv(OUTPUT_FILE, index=False)

print("\nBackground dataset saved:")
print(OUTPUT_FILE)

print("\nState distribution:")
print(result["state"].value_counts(dropna=False))

print("\nLabel distribution:")
print(result["landslide_observed"].value_counts())

print("\nBackground sampling completed successfully.")
