import pandas as pd

INPUT_FILE = "data/processed/gsi_ner_landslides.csv"
OUTPUT_FILE = "data/processed/gsi_ner_landslides_validated.csv"

df = pd.read_csv(INPUT_FILE)

print("\n========== NER DATASET VALIDATION ==========\n")

print("Original records:", len(df))

valid_coordinates = (
    df["latitude"].between(20, 30)
    & df["longitude"].between(88, 98)
)

invalid_records = df[~valid_coordinates]

print("Invalid coordinate records:", len(invalid_records))

if len(invalid_records) > 0:
    print("\nRemoving invalid records:\n")
    print(
        invalid_records[
            [
                "sl_no",
                "slide_no",
                "state",
                "district",
                "latitude",
                "longitude"
            ]
        ].to_string(index=False)
    )

df_validated = df[valid_coordinates].copy()

df_validated.to_csv(OUTPUT_FILE, index=False)

print("\nValidated records:", len(df_validated))
print("Removed records:", len(df) - len(df_validated))
print("Output file:", OUTPUT_FILE)

print("\n========== VALIDATION COMPLETE ==========\n")