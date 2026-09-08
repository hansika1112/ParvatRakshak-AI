import math
import requests
import geopandas as gpd
from pathlib import Path

BOUNDARY = Path("data/processed/ner_district_boundaries.shp")
OUTPUT_DIR = Path("data/raw/terrain/copernicus_glo30")

TILE_LIST_URL = "https://copernicus-dem-30m.s3.amazonaws.com/tileList.txt"
BASE_URL = "https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("Loading NER boundary...")

gdf = gpd.read_file(BOUNDARY)
gdf = gdf.to_crs("EPSG:4326")

minx, miny, maxx, maxy = gdf.total_bounds

print(f"NER extent:")
print(f"Longitude: {minx:.6f} to {maxx:.6f}")
print(f"Latitude : {miny:.6f} to {maxy:.6f}")

min_lon = math.floor(minx)
max_lon = math.floor(maxx)
min_lat = math.floor(miny)
max_lat = math.floor(maxy)

print("\nDownloading Copernicus tile list...")

response = requests.get(TILE_LIST_URL, timeout=60)
response.raise_for_status()

available_tiles = set()

for line in response.text.splitlines():
    line = line.strip()

    if not line:
        continue

    if line.endswith("/"):
        line = line[:-1]

    if line.startswith("Copernicus_DSM_COG_10_"):
        available_tiles.add(line)

print(f"Available tiles: {len(available_tiles)}")

required_tiles = []

for lat in range(min_lat, max_lat + 1):
    for lon in range(min_lon, max_lon + 1):

        lat_prefix = f"N{lat:02d}" if lat >= 0 else f"S{abs(lat):02d}"
        lon_prefix = f"E{lon:03d}" if lon >= 0 else f"W{abs(lon):03d}"

        tile = (
            f"Copernicus_DSM_COG_10_"
            f"{lat_prefix}_00_"
            f"{lon_prefix}_00_DEM"
        )

        if tile in available_tiles:
            required_tiles.append(tile)

print(f"\nRequired tiles: {len(required_tiles)}")

for tile in sorted(required_tiles):
    print(tile)

print("\nStarting downloads...\n")

for index, tile in enumerate(sorted(required_tiles), start=1):

    filename = f"{tile}.tif"
    output_file = OUTPUT_DIR / filename

    if output_file.exists():
        print(f"[{index}/{len(required_tiles)}] Already exists: {filename}")
        continue

    url = f"{BASE_URL}/{tile}/{filename}"

    print(f"[{index}/{len(required_tiles)}] Downloading {filename}")

    try:
        with requests.get(url, stream=True, timeout=120) as r:

            if r.status_code != 200:
                print(f"FAILED: HTTP {r.status_code}")
                continue

            with open(output_file, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        f.write(chunk)

        print(f"Saved: {output_file}")

    except Exception as e:
        print(f"ERROR: {e}")

print("\nCopernicus GLO-30 download completed.")
print(f"Output directory: {OUTPUT_DIR}")
