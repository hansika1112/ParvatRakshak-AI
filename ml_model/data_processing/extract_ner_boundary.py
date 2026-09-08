import geopandas as gpd
from pathlib import Path

INPUT = Path(
    "data/external/ner_boundary/"
    "District_Subdistrict_PAN INDIA/"
    "District Boundary.shp"
)

OUTPUT_DIR = Path("data/processed")
OUTPUT_SHP = OUTPUT_DIR / "ner_district_boundaries.shp"
OUTPUT_GEOJSON = OUTPUT_DIR / "ner_district_boundaries.geojson"

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

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("Loading Survey of India district boundary data...")

gdf = gpd.read_file(INPUT)

print(f"Total districts in source: {len(gdf)}")
print(f"Source CRS: {gdf.crs}")

ner = gdf[
    gdf["STATE_UT"].str.strip().str.upper().isin(NER_STATES)
].copy()

ner = ner.to_crs("EPSG:4326")

print(f"NER district records: {len(ner)}")

print("\nNER states found:")

for state in NER_STATES:
    count = (
        ner["STATE_UT"].str.strip().str.upper() == state
    ).sum()
    print(f"{state}: {count}")

print("\nSaving NER boundary files...")

ner.to_file(OUTPUT_SHP, driver="ESRI Shapefile")
ner.to_file(OUTPUT_GEOJSON, driver="GeoJSON")

print(f"\nSaved Shapefile: {OUTPUT_SHP}")
print(f"Saved GeoJSON: {OUTPUT_GEOJSON}")
print("\nNER boundary extraction completed successfully.")
