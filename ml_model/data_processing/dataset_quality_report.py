import pandas as pd

INPUT_FILE = "data/processed/gsi_ner_landslides_ml_ready_v2.csv"

df = pd.read_csv(INPUT_FILE)

print("\n========== DATASET QUALITY REPORT ==========\n")

print("Total records:", len(df))
print("Total columns:", len(df.columns))

print("\n---------- Data Types ----------")
print(df.dtypes)

print("\n---------- Missing Values ----------")
missing = df.isnull().sum()

if missing.sum() == 0:
    print("No missing values found.")
else:
    print(missing[missing > 0])

print("\n---------- Duplicate Rows ----------")
print("Duplicate rows:", df.duplicated().sum())

print("\n---------- States ----------")
print("Number of states:", df["state"].nunique())
print(df["state"].value_counts().sort_index().to_string())

print("\n---------- Districts ----------")
print("Number of districts:", df["district_normalized"].nunique())

print("\n---------- Coordinates ----------")
print("Latitude range:", df["latitude"].min(), "to", df["latitude"].max())
print("Longitude range:", df["longitude"].min(), "to", df["longitude"].max())

valid_coordinates = (
    df["latitude"].between(20, 30)
    & df["longitude"].between(88, 98)
)

print("Valid coordinates:", valid_coordinates.sum())
print("Invalid coordinates:", (~valid_coordinates).sum())

print("\n---------- Movement Categories ----------")
print(
    df["movement_category"]
    .value_counts()
    .to_string()
)

print("\n---------- Material Categories ----------")
print(
    df["material_category"]
    .value_counts()
    .to_string()
)

print("\n---------- Landslide Label ----------")
print(df["landslide_observed"].value_counts().to_string())

print("\n---------- Numeric Statistics ----------")
print(
    df[
        ["latitude", "longitude", "landslide_observed"]
    ].describe()
)

print("\n========== QUALITY REPORT COMPLETE ==========\n")