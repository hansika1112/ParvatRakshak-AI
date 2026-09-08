import pandas as pd

FILE_PATH = "data/processed/gsi_landslides.csv"

df = pd.read_csv(FILE_PATH)

print("\n========== GSI DATASET VALIDATION ==========\n")

print("Total records:", len(df))
print("Total columns:", len(df.columns))

print("\n---------- Columns ----------")
print(df.columns.tolist())

print("\n---------- Data Types ----------")
print(df.dtypes)

print("\n---------- Missing Values ----------")
print(df.isnull().sum())

print("\n---------- States ----------")
print(df["state"].value_counts())

print("\n---------- Top Districts ----------")
print(df["district"].value_counts().head(20))

print("\n---------- Movement Types ----------")
print(df["movement_type"].value_counts())

print("\n---------- Materials ----------")
print(df["material_involved"].value_counts())

print("\n---------- Latitude Range ----------")
print(df["latitude"].min(), "to", df["latitude"].max())

print("\n---------- Longitude Range ----------")
print(df["longitude"].min(), "to", df["longitude"].max())

print("\n---------- Duplicate Rows ----------")
print("Duplicates:", df.duplicated().sum())

print("\n---------- Duplicate Slide Numbers ----------")
print("Duplicate slide_no:", df["slide_no"].duplicated().sum())

print("\n========== VALIDATION COMPLETE ==========\n")
