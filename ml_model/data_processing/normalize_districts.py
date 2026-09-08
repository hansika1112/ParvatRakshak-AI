import pandas as pd

INPUT_FILE = "data/processed/gsi_ner_landslides_ml_ready.csv"
OUTPUT_FILE = "data/processed/gsi_ner_landslides_ml_ready_v2.csv"

df = pd.read_csv(INPUT_FILE)

print("\n========== DISTRICT NORMALIZATION ==========\n")


def normalize_district(value):
    value = str(value).strip()

    if value.lower() == "unknown":
        return "Unknown"

    value = " ".join(value.split())

    replacements = {
        "TAMENGLONG": "Tamenglong",
        "CHHITUIPUI": "Chhituipui",
        "CHAMPHAI": "Champhai",
        "MAMIT": "Mamit",
        "West Jaintia hills": "West Jaintia Hills",
        "South Garo hills": "South Garo Hills",
        "East Garo hills": "East Garo Hills",
        "Lower dibang valley": "Lower Dibang Valley"
    }

    return replacements.get(value, value)


df["district_normalized"] = df["district"].apply(normalize_district)

print("Original unique districts:", df["district"].nunique())
print("Normalized unique districts:", df["district_normalized"].nunique())

print("\n---------- District Changes ----------\n")

changed = df[df["district"] != df["district_normalized"]]

if len(changed) > 0:
    print(
        changed[
            ["state", "district", "district_normalized"]
        ]
        .drop_duplicates()
        .sort_values(["state", "district"])
        .to_string(index=False)
    )
else:
    print("No district names changed.")

df.to_csv(OUTPUT_FILE, index=False)

print("\nRecords:", len(df))
print("Output:", OUTPUT_FILE)

print("\n========== DISTRICT NORMALIZATION COMPLETE ==========\n")