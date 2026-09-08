import pandas as pd
import os

INPUT_PATH = "data/processed/gsi_landslides.csv"
OUTPUT_PATH = "data/processed/gsi_landslides_clean.csv"

df = pd.read_csv(INPUT_PATH)

print("\n========== GSI DATA CLEANING ==========\n")

print("Original records:", len(df))

# Remove completely empty rows
df = df.dropna(how="all")

# Clean text columns
text_columns = [
    "slide_no",
    "state",
    "district",
    "slide_name",
    "nh_sh_location",
    "material_involved",
    "movement_type",
    "history"
]

for column in text_columns:
    df[column] = (
        df[column]
        .fillna("")
        .astype(str)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )

# Clean state names
state_mapping = {
    "KERALA": "Kerala",
    "KARNATAKA": "Karnataka",
    "MEGHALAYA": "Meghalaya",
    "Tamil nadu": "Tamil Nadu",
    "-Arunachal Pradesh": "Arunachal Pradesh"
}

df["state"] = df["state"].replace(state_mapping)

# Normalize movement type
df["movement_type"] = (
    df["movement_type"]
    .str.replace("\n", " ", regex=False)
    .str.replace(r"\s+", " ", regex=True)
    .str.strip()
    .str.lower()
)

movement_mapping = {
    "slide": "Slide",
    "fall": "Fall",
    "flow": "Flow",
    "subsidence": "Subsidence",
    "slide & flow": "Slide & Flow",
    "slide + flow": "Slide & Flow",
    "slide & fall": "Slide & Fall",
    "slide + fall": "Slide & Fall",
    "slide & subsidence": "Slide & Subsidence",
    "slide + subsidence": "Slide & Subsidence"
}

df["movement_type"] = df["movement_type"].replace(movement_mapping)

# Normalize material names
df["material_involved"] = (
    df["material_involved"]
    .str.replace("\n", " ", regex=False)
    .str.replace(r"\s+", " ", regex=True)
    .str.strip()
)

material_mapping = {
    "rock": "Rock",
    "debris": "Debris",
    "earth": "Earth",
    "soil": "Soil",
    "rock cum debris": "Rock cum debris",
    "Rock cum debris": "Rock cum debris"
}

df["material_involved"] = df["material_involved"].replace(material_mapping)

# Convert coordinates to numeric
df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")

# Remove impossible coordinates
df.loc[
    ~df["latitude"].between(-90, 90),
    "latitude"
] = pd.NA

df.loc[
    ~df["longitude"].between(-180, 180),
    "longitude"
] = pd.NA

# Remove records without coordinates
before_coordinates = len(df)

df = df.dropna(
    subset=["latitude", "longitude"]
)

removed_coordinates = before_coordinates - len(df)

# Create binary historical landslide indicator
df["landslide_observed"] = 1

# Reset index
df = df.reset_index(drop=True)

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

df.to_csv(OUTPUT_PATH, index=False)

print("Cleaned records:", len(df))
print("Removed records without coordinates:", removed_coordinates)

print("\nStates:")
print(df["state"].value_counts())

print("\nMovement types:")
print(df["movement_type"].value_counts().head(20))

print("\nMaterials:")
print(df["material_involved"].value_counts().head(20))

print("\nMissing values:")
print(df.isnull().sum())

print("\nOutput:")
print(OUTPUT_PATH)

print("\n========== CLEANING COMPLETE ==========\n")
