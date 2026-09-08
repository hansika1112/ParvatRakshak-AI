import geopandas as gpd
from pathlib import Path

INPUT = Path("data/processed/ner_district_boundaries.shp")
OUTPUT_DIR = Path("data/processed")
OUTPUT_SHP = OUTPUT_DIR / "ner_bhoonidhi_aoi.shp"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("Loading NER district boundaries...")

gdf = gpd.read_file(INPUT)

print(f"Input district polygons: {len(gdf)}")
print(f"Input CRS: {gdf.crs}")

projected = gdf.to_crs("EPSG:3857")

print("Merging all NER districts into one AOI...")
ner = projected.dissolve()

print("Simplifying AOI geometry...")
ner["geometry"] = ner.geometry.simplify(
    tolerance=1000,
    preserve_topology=True
)

ner = ner.to_crs("EPSG:4326")
ner = ner[["geometry"]]

print("Saving Bhoonidhi AOI...")

ner.to_file(
    OUTPUT_SHP,
    driver="ESRI Shapefile"
)

print(f"Saved: {OUTPUT_SHP}")

geometry = ner.geometry.iloc[0]

if geometry.geom_type == "Polygon":
    vertex_count = len(geometry.exterior.coords)
else:
    vertex_count = sum(
        len(poly.exterior.coords)
        for poly in geometry.geoms
    )

print(f"Approximate exterior vertices: {vertex_count}")
print("Bhoonidhi AOI creation completed.")
