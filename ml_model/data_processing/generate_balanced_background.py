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
    "data/processed/gsi_ner_background_samples_balanced.csv"
)

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

gsi["state"] = (
    gsi["state"]
    .astype(str)
    .str.strip()
    .str.upper()
)

print(f"Total positive samples: {len(gsi)}")

state_counts = (
    gsi["state"]
    .value_counts()
    .reindex(NER_STATES, fill_value=0)
)

print("\nPositive samples by state:")
print(state_counts)

print("\nLoading NER boundary...")

boundary = gpd.read_file(BOUNDARY_FILE)

boundary["STATE_UT"] = (
    boundary["STATE_UT"]
    .astype(str)
    .str.strip()
    .str.upper()
)

boundary = boundary[
    boundary["STATE_UT"].isin(NER_STATES)
].copy()

boundary = boundary.to_crs("EPSG:4326")

landslide_points = gpd.GeoDataFrame(
    gsi,
    geometry=gpd.points_from_xy(
        gsi["longitude"],
        gsi["latitude"]
    ),
    crs="EPSG:4326"
)

metric_boundary = boundary.to_crs("EPSG:32645")
metric_landslides = landslide_points.to_crs("EPSG:32645")

landslide_union = metric_landslides.geometry.union_all()

exclusion_zone = landslide_union.buffer(
    MIN_DISTANCE_KM * 1000
)

rng = np.random.default_rng(RANDOM_SEED)

all_samples = []

print("\nGenerating state-proportional background samples...")

for state in NER_STATES:

    target = int(state_counts[state])

    if target == 0:
        continue

    print(f"\n{state}: target = {target}")

    state_boundary = metric_boundary[
        metric_boundary["STATE_UT"] == state
    ]

    minx, miny, maxx, maxy = state_boundary.total_bounds

    samples = []
    attempts = 0
    max_attempts = max(target * 200, 10000)

    while len(samples) < target and attempts < max_attempts:

        attempts += 1

        x = rng.uniform(minx, maxx)
        y = rng.uniform(miny, maxy)

        point = Point(x, y)

        if not state_boundary.geometry.contains(point).any():
            continue

        if exclusion_zone.contains(point):
            continue

        samples.append(point)

    if len(samples) < target:
        raise RuntimeError(
            f"Could generate only {len(samples)} "
            f"of {target} samples for {state}."
        )

    temp = gpd.GeoDataFrame(
        geometry=samples,
        crs="EPSG:32645"
    )

    temp = temp.to_crs("EPSG:4326")

    temp["latitude"] = temp.geometry.y
    temp["longitude"] = temp.geometry.x
    temp["state"] = state
    temp["landslide_observed"] = 0
    temp["sample_type"] = "background"

    all_samples.append(
        temp[
            [
                "latitude",
                "longitude",
                "state",
                "landslide_observed",
                "sample_type",
            ]
        ]
    )

background = pd.concat(
    all_samples,
    ignore_index=True
)

background.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\n========================================")
print("Balanced background sampling completed")
print("========================================")

print(f"\nTotal background samples: {len(background)}")

print("\nBackground samples by state:")
print(background["state"].value_counts().sort_index())

print("\nLabel distribution:")
print(background["landslide_observed"].value_counts())

print(f"\nSaved to:")
print(OUTPUT_FILE)
