import rasterio
import geopandas as gpd
from rasterio.mask import mask
from pathlib import Path

DEM_FILE = Path(
    "data/processed/ner_copernicus_glo30_mosaic.tif"
)

BOUNDARY_FILE = Path(
    "data/processed/ner_district_boundaries.shp"
)

OUTPUT_FILE = Path(
    "data/processed/ner_copernicus_glo30.tif"
)

print("Loading NER boundary...")

boundary = gpd.read_file(BOUNDARY_FILE)

print(f"NER districts: {len(boundary)}")
print(f"Boundary CRS: {boundary.crs}")

with rasterio.open(DEM_FILE) as src:

    print(f"DEM CRS: {src.crs}")
    print(f"DEM size: {src.width} x {src.height}")

    boundary = boundary.to_crs(src.crs)

    geometries = boundary.geometry.tolist()

    print("\nClipping DEM to exact NER boundary...")

    clipped, transform = mask(
        src,
        geometries,
        crop=True,
        nodata=src.nodata
    )

    profile = src.profile.copy()

    profile.update(
        height=clipped.shape[1],
        width=clipped.shape[2],
        transform=transform,
        compress="deflate",
        tiled=True,
        BIGTIFF="YES"
    )

    print("Saving clipped DEM...")

    with rasterio.open(OUTPUT_FILE, "w", **profile) as dst:
        dst.write(clipped)

print("\nNER DEM clipping completed successfully.")
print(f"Output: {OUTPUT_FILE}")
print(f"Clipped size: {clipped.shape}")
