import pandas as pd

FILE_PATH = "data/processed/gsi_ner_landslides_validated.csv"

df = pd.read_csv(FILE_PATH)

print("\n========== NER DATASET VERIFICATION ==========\n")

print("Total records:", len(df))

print("\n---------- Dataset Shape ----------")
print("Rows:", df.shape[0])
print("Columns:", df.shape[1])

print("\n---------- Columns ----------")
print(df.columns.tolist())

print("\n---------- State-wise Distribution ----------")
print(df["state"].value_counts().sort_index())

print("\n---------- Missing Values ----------")
missing = df.isnull().sum()
print(missing[missing > 0])

if missing.sum() == 0:
    print("No missing values found.")

print("\n---------- Duplicate Records ----------")
print("Duplicate rows:", df.duplicated().sum())
print("Duplicate slide numbers:", df["slide_no"].duplicated().sum())

print("\n---------- Coordinate Range ----------")
print("Latitude minimum:", df["latitude"].min())
print("Latitude maximum:", df["latitude"].max())
print("Longitude minimum:", df["longitude"].min())
print("Longitude maximum:", df["longitude"].max())

print("\n---------- Coordinate Validation ----------")

valid_coordinates = (
    df["latitude"].between(20, 30)
    & df["longitude"].between(88, 98)
)

print("Valid coordinates:", valid_coordinates.sum())
print("Invalid coordinates:", (~valid_coordinates).sum())

print("\n---------- Movement Types ----------")
print(df["movement_type"].value_counts().head(15))

print("\n---------- Materials ----------")
print(df["material_involved"].value_counts().head(15))

print("\n---------- Dataset Preview ----------")
print(df.head(10).to_string(index=False))

print("\n========== VERIFICATION COMPLETE ==========\n")