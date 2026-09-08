import rasterio
import numpy as np
from pathlib import Path

DEM_FILE = Path(
    "data/processed/ner_copernicus_glo30.tif"
)

SLOPE_FILE = Path(
    "data/processed/ner_slope_degrees.tif"
)

print("Opening NER DEM...")

with rasterio.open(DEM_FILE) as src:

    profile = src.profile.copy()

    print(f"DEM size: {src.width} x {src.height}")
    print(f"CRS: {src.crs}")
    print(f"Pixel size: {src.res}")

    profile.update(
        dtype="float32",
        count=1,
        nodata=np.nan,
        compress="deflate",
        tiled=True,
        BIGTIFF="YES"
    )

    print("\nCalculating slope using metric pixel distances...")

    with rasterio.open(SLOPE_FILE, "w", **profile) as dst:

        block_height = 512
        block_width = 512

        for row in range(0, src.height, block_height):

            for col in range(0, src.width, block_width):

                height = min(
                    block_height,
                    src.height - row
                )

                width = min(
                    block_width,
                    src.width - col
                )

                window = rasterio.windows.Window(
                    col,
                    row,
                    width,
                    height
                )

                read_window = rasterio.windows.Window(
                    max(col - 1, 0),
                    max(row - 1, 0),
                    min(width + 2, src.width - max(col - 1, 0)),
                    min(height + 2, src.height - max(row - 1, 0))
                )

                elevation = src.read(
                    1,
                    window=read_window
                ).astype("float32")

                read_row = int(read_window.row_off)
                read_col = int(read_window.col_off)

                rows = np.arange(
                    read_row,
                    read_row + elevation.shape[0]
                )

                cols = np.arange(
                    read_col,
                    read_col + elevation.shape[1]
                )

                center_rows = rows + 0.5

                latitudes = (
                    src.transform.f
                    + center_rows * src.transform.e
                )

                latitudes = np.repeat(
                    latitudes[:, None],
                    elevation.shape[1],
                    axis=1
                )

                meters_per_degree_lat = (
                    111132.92
                    - 559.82 * np.cos(2 * np.radians(latitudes))
                    + 1.175 * np.cos(4 * np.radians(latitudes))
                    - 0.0023 * np.cos(6 * np.radians(latitudes))
                )

                meters_per_degree_lon = (
                    111412.84 * np.cos(np.radians(latitudes))
                    - 93.5 * np.cos(3 * np.radians(latitudes))
                    + 0.118 * np.cos(5 * np.radians(latitudes))
                )

                dx = (
                    abs(src.transform.a)
                    * meters_per_degree_lon
                )

                dy = (
                    abs(src.transform.e)
                    * meters_per_degree_lat
                )

                z = elevation

                dzdx = (
                    z[0:-2, 2:]
                    + 2 * z[1:-1, 2:]
                    + z[2:, 2:]
                    - z[0:-2, 0:-2]
                    - 2 * z[1:-1, 0:-2]
                    - z[2:, 0:-2]
                ) / (8 * dx[1:-1, 1:-1])

                dzdy = (
                    z[0:-2, 0:-2]
                    + 2 * z[0:-2, 1:-1]
                    + z[0:-2, 2:]
                    - z[2:, 0:-2]
                    - 2 * z[2:, 1:-1]
                    - z[2:, 2:]
                ) / (8 * dy[1:-1, 1:-1])

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
                    np.nan,
                    dtype="float32"
                )

                valid_height = min(
                    slope.shape[0],
                    height
                )

                valid_width = min(
                    slope.shape[1],
                    width
                )

                output[
                    :valid_height,
                    :valid_width
                ] = slope[
                    :valid_height,
                    :valid_width
                ]

                dst.write(
                    output,
                    1,
                    window=window
                )

            print(
                f"Processed rows: "
                f"{min(row + block_height, src.height)}"
                f"/{src.height}"
            )

print("\nCorrected slope calculation completed.")
print(f"Output: {SLOPE_FILE}")
