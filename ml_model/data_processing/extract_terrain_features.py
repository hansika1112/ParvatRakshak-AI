import pandas as pd
import geopandas as gpd
import rasterio
from pathlib import Path

POSITIVE_FILE = Path(
    "data/processed/gsi_ner_landslides_ml_ready_v2.csv"
)

BACKGROUND_FILE = Path(
    "data/processed/gsi_ner_background_samples_balanced.csv"
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
    "data/processed/ner_landslide_terrain_dataset.csv"
)


print("Loading GSI landslide data...")
positive = pd.read_csv(POSITIVE_FILE)

print(f"Positive samples: {len(positive)}")

print("Loading background samples...")
background = pd.read_csv(BACKGROUND_FILE)

print(f"Background samples: {len(background)}")


positive["landslide_observed"] = 1
background["landslide_observed"] = 0


positive = positive[
    [
        "latitude",
        "longitude",
        "state",
        "district",
        "landslide_observed"
    ]
]

background = background[
    [
        "latitude",
        "longitude",
        "state",
        "landslide_observed"
    ]
]


print("\nLoading NER district boundaries...")

boundary = gpd.read_file(BOUNDARY_FILE)

boundary = boundary.to_crs("EPSG:4326")

print(f"NER districts: {len(boundary)}")


background_geo = gpd.GeoDataFrame(
    background,
    geometry=gpd.points_from_xy(
        background["longitude"],
        background["latitude"]
    ),
    crs="EPSG:4326"
)


print("\nAssigning districts to background samples...")

background_geo = gpd.sjoin(
    background_geo,
    boundary[["DISTRICT", "geometry"]],
    how="left",
    predicate="within"
)


background_geo["district"] = background_geo["DISTRICT"]

background = pd.DataFrame(background_geo.drop(
    columns=["geometry", "DISTRICT", "index_right"],
    errors="ignore"
))


background = background[
    [
        "latitude",
        "longitude",
        "state",
        "district",
        "landslide_observed"
    ]
]


data = pd.concat(
    [positive, background],
    ignore_index=True
)


print(f"\nTotal samples: {len(data)}")

print(
    f"Background samples without district: "
    f"{data.loc[data['landslide_observed'] == 0, 'district'].isna().sum()}"
)


coordinates = list(
    zip(
        data["longitude"],
        data["latitude"]
    )
)


print("\nExtracting elevation values...")

with rasterio.open(DEM_FILE) as dem:

    print(f"DEM CRS: {dem.crs}")

    elevation_values = [
        value[0]
        for value in dem.sample(coordinates)
    ]


print("Extracting slope values...")

with rasterio.open(SLOPE_FILE) as slope:

    print(f"Slope CRS: {slope.crs}")

    slope_values = [
        value[0]
        for value in slope.sample(coordinates)
    ]


data["elevation"] = elevation_values
data["slope"] = slope_values


data["elevation"] = pd.to_numeric(
    data["elevation"],
    errors="coerce"
)

data["slope"] = pd.to_numeric(
    data["slope"],
    errors="coerce"
)


print("\nChecking extracted values...")

print(
    f"Elevation missing: "
    f"{data['elevation'].isna().sum()}"
)

print(
    f"Slope missing: "
    f"{data['slope'].isna().sum()}"
)


before = len(data)

data = data.dropna(
    subset=["elevation", "slope", "district"]
).reset_index(drop=True)

removed = before - len(data)

print(f"Rows removed: {removed}")


print("\nTerrain statistics:")

print(
    f"Elevation range: "
    f"{data['elevation'].min():.2f} - "
    f"{data['elevation'].max():.2f} m"
)

print(
    f"Mean elevation: "
    f"{data['elevation'].mean():.2f} m"
)

print(
    f"Slope range: "
    f"{data['slope'].min():.2f} - "
    f"{data['slope'].max():.2f} degrees"
)

print(
    f"Mean slope: "
    f"{data['slope'].mean():.2f} degrees"
)


print("\nClass distribution:")

print(
    data["landslide_observed"].value_counts()
)


print("\nSaving terrain dataset...")

data.to_csv(
    OUTPUT_FILE,
    index=False
)

print(f"\nSaved: {OUTPUT_FILE}")
print(f"Final samples: {len(data)}")

print("\nTerrain feature extraction completed successfully.")
