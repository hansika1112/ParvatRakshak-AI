import rasterio
from rasterio.merge import merge
from pathlib import Path

INPUT_DIR = Path("data/raw/terrain/copernicus_glo30")
OUTPUT_DIR = Path("data/processed")
OUTPUT_FILE = OUTPUT_DIR / "ner_copernicus_glo30_mosaic.tif"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

files = sorted(INPUT_DIR.glob("*.tif"))

print(f"DEM tiles found: {len(files)}")

if len(files) != 90:
    raise ValueError(f"Expected 90 DEM tiles, found {len(files)}")

src_files = []

try:
    print("\nOpening DEM tiles...")

    for file in files:
        src_files.append(rasterio.open(file))

    print("Merging DEM tiles...")

    mosaic, transform = merge(src_files)

    profile = src_files[0].profile.copy()

    profile.update(
        height=mosaic.shape[1],
        width=mosaic.shape[2],
        transform=transform,
        compress="deflate",
        tiled=True,
        BIGTIFF="YES"
    )

    print("Saving mosaic...")

    with rasterio.open(OUTPUT_FILE, "w", **profile) as dest:
        dest.write(mosaic)

finally:
    for src in src_files:
        src.close()

print("\nMosaic completed successfully.")
print(f"Output: {OUTPUT_FILE}")
print(f"Size: {mosaic.shape}")
