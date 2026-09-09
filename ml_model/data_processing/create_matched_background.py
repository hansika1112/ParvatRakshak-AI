import pandas as pd
import numpy as np
from pathlib import Path

POSITIVE_FILE = Path(
    "data/processed/gsi_landslide_weather_features.csv"
)

BACKGROUND_FILE = Path(
    "data/processed/gsi_ner_background_samples_balanced.csv"
)

OUTPUT_FILE = Path(
    "data/processed/gsi_matched_background_weather_base.csv"
)

SEED = 42

positive = pd.read_csv(POSITIVE_FILE)
background = pd.read_csv(BACKGROUND_FILE)

positive["state"] = positive["state"].str.strip().str.title()
background["state"] = background["state"].str.strip().str.title()

positive["event_date"] = pd.to_datetime(
    positive["event_date"],
    errors="coerce"
)

background["landslide_observed"] = 0

rng = np.random.default_rng(SEED)

matched_parts = []

for state, positive_state in positive.groupby("state"):
    background_state = background[
        background["state"] == state
    ].copy()

    required = len(positive_state)

    if len(background_state) < required:
        raise ValueError(
            f"Not enough background samples for {state}: "
            f"need {required}, have {len(background_state)}"
        )

    selected_indices = rng.choice(
        background_state.index.to_numpy(),
        size=required,
        replace=False
    )

    selected = background_state.loc[selected_indices].copy()

    positive_state = positive_state.sort_values(
        ["event_date", "latitude", "longitude"]
    ).reset_index(drop=True)

    selected = selected.reset_index(drop=True)

    selected["event_date"] = positive_state["event_date"]

    selected["source_event_id"] = positive_state["sl_no"].values

    selected["sample_type"] = "matched_background"

    matched_parts.append(selected)

matched_background = pd.concat(
    matched_parts,
    ignore_index=True
)

matched_background = matched_background[
    [
        "latitude",
        "longitude",
        "state",
        "event_date",
        "landslide_observed",
        "sample_type",
        "source_event_id"
    ]
]

matched_background.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\nMatched background dataset created successfully.")
print("Output:", OUTPUT_FILE)
print("Rows:", len(matched_background))

print("\nState-wise counts:")
print(
    matched_background["state"]
    .value_counts()
    .sort_index()
)

print("\nLabel distribution:")
print(
    matched_background["landslide_observed"]
    .value_counts()
)

print("\nDate range:")
print(
    matched_background["event_date"].min(),
    "to",
    matched_background["event_date"].max()
)

print("\nSample:")
print(
    matched_background.head(10).to_string(index=False)
)
