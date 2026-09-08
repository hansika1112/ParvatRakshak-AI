import pandas as pd
import os

INPUT_PATH = "data/processed/gsi_landslides_clean.csv"
OUTPUT_PATH = "data/processed/gsi_ner_landslides.csv"

NER_STATES = [
    "Arunachal Pradesh",
    "Assam",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Sikkim",
    "Tripura"
]

df = pd.read_csv(INPUT_PATH)

print("\n========== CREATING NER DATASET ==========\n")

print("Original records:", len(df))

ner_df = df[df["state"].isin(NER_STATES)].copy()

ner_df = ner_df.reset_index(drop=True)

print("NER records:", len(ner_df))

print("\n---------- State Distribution ----------")

print(
    ner_df["state"]
    .value_counts()
    .sort_index()
)

print("\n---------- Coordinates ----------")

print(
    "Latitude:",
    ner_df["latitude"].min(),
    "to",
    ner_df["latitude"].max()
)

print(
    "Longitude:",
    ner_df["longitude"].min(),
    "to",
    ner_df["longitude"].max()
)

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

ner_df.to_csv(OUTPUT_PATH, index=False)

print("\nOutput:")
print(OUTPUT_PATH)

print("\nDataset shape:")
print(ner_df.shape)

print("\n========== NER DATASET CREATED ==========\n")
