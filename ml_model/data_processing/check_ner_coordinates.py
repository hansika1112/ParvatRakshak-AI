import pandas as pd

FILE_PATH = "data/processed/gsi_ner_landslides.csv"

df = pd.read_csv(FILE_PATH)

print("\n========== NER COORDINATE CHECK ==========\n")

print("Total records:", len(df))

# Northeast India approximate geographic bounds
valid = (
    df["latitude"].between(20, 30)
    & df["longitude"].between(88, 98)
)

print("Records inside NER coordinate range:", valid.sum())
print("Records outside NER coordinate range:", (~valid).sum())

print("\n---------- Suspicious Records ----------\n")

suspicious = df[~valid]

if len(suspicious) == 0:
    print("No suspicious coordinates found.")
else:
    print(
        suspicious[
            [
                "sl_no",
                "slide_no",
                "state",
                "district",
                "slide_name",
                "latitude",
                "longitude"
            ]
        ].to_string(index=False)
    )

print("\n========== CHECK COMPLETE ==========\n")
