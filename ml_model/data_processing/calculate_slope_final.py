import rasterio
import numpy as np
from pathlib import Path

DEM_FILE = Path("data/processed/ner_copernicus_glo30.tif")
SLOPE_FILE = Path("data/processed/ner_slope_degrees_final.tif")

print("Opening DEM...")

with rasterio.open(DEM_FILE) as src:

    print(f"DEM size: {src.width} x {src.height}")
    print(f"CRS: {src.crs}")
    print(f"Resolution: {src.res}")

    profile = src.profile.copy()

    profile.update(
        dtype="float32",
        count=1,
        nodata=-9999.0,
        compress="deflate",
        tiled=True,
        BIGTIFF="YES"
    )

    with rasterio.open(SLOPE_FILE, "w", **profile) as dst:

        block_size = 512

        for row in range(0, src.height, block_size):

            for col in range(0, src.width, block_size):

                height = min(
                    block_size,
                    src.height - row
                )

                width = min(
                    block_size,
                    src.width - col
                )

                row_start = max(row - 1, 0)
                col_start = max(col - 1, 0)
                row_end = min(row + height + 1, src.height)
                col_end = min(col + width + 1, src.width)

                window = rasterio.windows.Window(
                    col_start,
                    row_start,
                    col_end - col_start,
                    row_end - row_start
                )

                z = src.read(
                    1,
                    window=window
                ).astype("float32")

                transform = src.window_transform(window)

                center_row = row_start + z.shape[0] / 2

                latitude = (
                    transform.f
                    + center_row * transform.e
                )

                lat_rad = np.radians(latitude)

                meters_lat = (
                    111132.92
                    - 559.82 * np.cos(2 * lat_rad)
                    + 1.175 * np.cos(4 * lat_rad)
                )

                meters_lon = (
                    111412.84 * np.cos(lat_rad)
                    - 93.5 * np.cos(3 * lat_rad)
                )

                dx = abs(transform.a) * meters_lon
                dy = abs(transform.e) * meters_lat

                dzdx = (
                    z[1:-1, 2:]
                    - z[1:-1, :-2]
                ) / (2 * dx)

                dzdy = (
                    z[2:, 1:-1]
                    - z[:-2, 1:-1]
                ) / (2 * dy)

                slope = np.degrees(
                    np.arctan(
                        np.sqrt(
                            dzdx ** 2 +
                            dzdy ** 2
                        )
                    )
                ).astype("float32")

                output = np.full(
                    (height, width),
                    -9999.0,
                    dtype="float32"
                )

                valid_h = min(
                    slope.shape[0],
                    height
                )

                valid_w = min(
                    slope.shape[1],
                    width
                )

                output[
                    :valid_h,
                    :valid_w
                ] = slope[
                    :valid_h,
                    :valid_w
                ]

                dst.write(
                    output,
                    1,
                    window=rasterio.windows.Window(
                        col,
                        row,
                        width,
                        height
                    )
                )

            print(
                f"Processed: "
                f"{min(row + block_size, src.height)}"
                f"/{src.height} rows"
            )

print("\nFinal slope calculation completed.")
print(f"Output: {SLOPE_FILE}")
