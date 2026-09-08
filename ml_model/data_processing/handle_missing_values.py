import pandas as pd

INPUT_FILE = "data/processed/gsi_ner_landslides_validated.csv"
OUTPUT_FILE = "data/processed/gsi_ner_landslides_final.csv"

df = pd.read_csv(INPUT_FILE)

print("\n========== MISSING VALUE HANDLING ==========\n")

print("Records before cleaning:", len(df))

columns_to_fill = [
    "slide_no",
    "district",
    "slide_name",
    "nh_sh_location",
    "material_involved",
    "movement_type",
    "history"
]

print("\nMissing values before cleaning:\n")
print(df[columns_to_fill].isnull().sum())

for column in columns_to_fill:
    df[column] = df[column].fillna("Unknown")

print("\nMissing values after cleaning:\n")
print(df[columns_to_fill].isnull().sum())

df.to_csv(OUTPUT_FILE, index=False)

print("\nRecords after cleaning:", len(df))
print("Output file:", OUTPUT_FILE)

print("\n========== CLEANING COMPLETE ==========\n")