import pandas as pd
import geopandas as gpd
import rasterio
from pathlib import Path

GSI_FILE = Path(
    "data/processed/gsi_ner_landslides_ml_ready_v2.csv"
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
    "data/processed/gsi_ner_positive_terrain_with_id.csv"
)


# ---------------------------------------------------------
# Load GSI NER landslide records
# ---------------------------------------------------------

gsi = pd.read_csv(GSI_FILE)

gsi["state"] = (
    gsi["state"]
    .astype(str)
    .str.strip()
    .str.title()
)

gsi["landslide_observed"] = 1
gsi["sample_type"] = "landslide"


print("GSI NER records:", len(gsi))


# ---------------------------------------------------------
# Create point GeoDataFrame
# ---------------------------------------------------------

points = gpd.GeoDataFrame(
    gsi,
    geometry=gpd.points_from_xy(
        gsi["longitude"],
        gsi["latitude"]
    ),
    crs="EPSG:4326"
)


# ---------------------------------------------------------
# Assign district
# ---------------------------------------------------------

districts = gpd.read_file(
    BOUNDARY_FILE
)

if districts.crs != points.crs:
    districts = districts.to_crs(points.crs)


district_column = None

for column in districts.columns:

    if "district" in column.lower():

        district_column = column
        break


if district_column is None:

    raise ValueError(
        "District column not found."
    )


district_subset = districts[
    [district_column, "geometry"]
].copy()

district_subset = district_subset.rename(
    columns={
        district_column: "boundary_district"
    }
)


points = gpd.sjoin(
    points,
    district_subset,
    how="left",
    predicate="within"
)


points["district"] = (
    points["boundary_district"]
    .fillna(points["district"])
    .astype(str)
    .str.strip()
)


# ---------------------------------------------------------
# Extract elevation
# ---------------------------------------------------------

coords = list(
    zip(
        points["longitude"],
        points["latitude"]
    )
)


with rasterio.open(DEM_FILE) as dem:

    elevation = [
        value[0]
        for value in dem.sample(coords)
    ]


points["elevation"] = elevation


# ---------------------------------------------------------
# Extract slope
# ---------------------------------------------------------

with rasterio.open(SLOPE_FILE) as slope:

    slope_values = [
        value[0]
        for value in slope.sample(coords)
    ]


points["slope"] = slope_values


# ---------------------------------------------------------
# Select required columns
# ---------------------------------------------------------

output = pd.DataFrame(points.drop(
    columns=[
        "geometry",
        "index_right",
        "boundary_district"
    ],
    errors="ignore"
))


output = output[
    [
        "sl_no",
        "slide_no",
        "state",
        "district",
        "latitude",
        "longitude",
        "landslide_observed",
        "sample_type",
        "elevation",
        "slope"
    ]
]


# ---------------------------------------------------------
# Validation
# ---------------------------------------------------------

print("\n========================================")
print("POSITIVE TERRAIN DATASET")
print("========================================")

print(
    "Rows:",
    len(output)
)

print(
    "Columns:",
    len(output.columns)
)

print(
    "Unique sl_no:",
    output["sl_no"].nunique()
)

print("\nMissing values:")

print(
    output.isna().sum()
)

print("\nState counts:")

print(
    output["state"].value_counts()
)


# ---------------------------------------------------------
# Save
# ---------------------------------------------------------

output.to_csv(
    OUTPUT_FILE,
    index=False
)

print(
    "\nSaved:",
    OUTPUT_FILE
)
