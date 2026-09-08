import pandas as pd

INPUT_FILE = "data/processed/gsi_ner_landslides_validated.csv"

df = pd.read_csv(INPUT_FILE)

print("\n========== DUPLICATE SLIDE NUMBER CHECK ==========\n")

duplicates = df[df["slide_no"].duplicated(keep=False)].copy()

print("Records involved in duplicate slide numbers:", len(duplicates))
print("Unique duplicate slide numbers:", duplicates["slide_no"].nunique())

print("\n---------- Duplicate Slide Numbers ----------\n")

for slide_no, group in duplicates.groupby("slide_no", dropna=False):
    print(f"\nSlide No: {slide_no}")
    print(
        group[
            [
                "sl_no",
                "slide_no",
                "state",
                "district",
                "slide_name",
                "latitude",
                "longitude",
                "movement_type",
                "material_involved"
            ]
        ].to_string(index=False)
    )

print("\n========== CHECK COMPLETE ==========\n")