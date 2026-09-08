import pandas as pd

INPUT_FILE = "data/processed/gsi_ner_landslides_final.csv"
OUTPUT_FILE = "data/processed/gsi_ner_landslides_ml_ready.csv"

df = pd.read_csv(INPUT_FILE)

print("\n========== CATEGORY NORMALIZATION ==========\n")

def normalize_movement(value):
    value = str(value).strip().lower()

    if value in ["unknown", "nan", "nil"]:
        return "Unknown"

    if any(word in value for word in [
        "complex",
        "multiple type",
        "multiple slide",
        "slide and flow",
        "debris slide and debris flow",
        "debris slide and subsidence",
        "debris flow and subsidence",
        "subsidence and slide",
        "slide and subsidence",
        "slide & subsidence",
        "slide/subsidence",
        "complex-",
        "fall and slide",
        "slide and topple",
        "topple/fall",
        "fall/topple",
        "planar/wedge"
    ]):
        return "Complex"

    if "spread" in value:
        return "Spread"

    if "creep" in value:
        return "Creep"

    if "rotational" in value:
        return "Rotational"

    if "topple" in value or "toppled" in value:
        return "Topple"

    if "subsidence" in value or "subside" in value or "sinking" in value:
        return "Subsidence"

    if "flow" in value:
        return "Flow"

    if "fall" in value:
        return "Fall"

    if "slide" in value or "sldies" in value or "silde" in value:
        return "Slide"

    if "wedge" in value:
        return "Wedge Failure"

    if "bulging" in value:
        return "Slope Failure"

    return "Other"


def normalize_material(value):
    value = str(value).strip().lower()

    if value in ["unknown", "nan"]:
        return "Unknown"

    if "rock" in value and ("debris" in value or "boulder" in value):
        return "Rock/Debris"

    if ("soil" in value or "earth" in value) and "debris" in value:
        return "Soil/Debris"

    if "soil" in value and "rock" in value:
        return "Soil/Rock"

    if "earth" in value and "rock" in value:
        return "Earth/Rock"

    if "regolith" in value:
        return "Regolith"

    if "debris" in value:
        return "Debris"

    if "rock" in value or "shale" in value or "quartzite" in value:
        return "Rock"

    if "soil" in value or "earth" in value or "sandy" in value:
        return "Soil/Earth"

    if "colluvium" in value:
        return "Colluvium"

    return "Other"


df["movement_category"] = df["movement_type"].apply(normalize_movement)
df["material_category"] = df["material_involved"].apply(normalize_material)

print("Movement categories:\n")
print(df["movement_category"].value_counts().to_string())

print("\nMaterial categories:\n")
print(df["material_category"].value_counts().to_string())

df.to_csv(OUTPUT_FILE, index=False)

print("\nRecords:", len(df))
print("Output:", OUTPUT_FILE)

print("\n========== NORMALIZATION COMPLETE ==========\n")