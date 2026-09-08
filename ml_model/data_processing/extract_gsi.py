import pdfplumber
import pandas as pd
import os

PDF_PATH = "data/raw/gsi/landslide_report.pdf"
OUTPUT_PATH = "data/processed/gsi_landslides.csv"

columns = [
    "sl_no",
    "slide_no",
    "state",
    "district",
    "slide_name",
    "nh_sh_location",
    "latitude",
    "longitude",
    "material_involved",
    "movement_type",
    "history"
]

all_records = []

with pdfplumber.open(PDF_PATH) as pdf:

    total_pages = len(pdf.pages)

    print("Total pages:", total_pages)
    print("Processing first 5 pages...\n")

    for page_number, page in enumerate(pdf.pages, start=1):

        print(f"Processing page {page_number}/5")

        tables = page.extract_tables()

        for table in tables:

            for row in table:

                if not row:
                    continue

                if row[0] in ["LANDSLIDE INVENTORY (Field vaidated)", "Sl.No.", None]:
                    continue

                if len(row) != 11:
                    continue

                row = [
                    value.strip() if isinstance(value, str) else value
                    for value in row
                ]

                all_records.append(row)

print("\nRecords extracted:", len(all_records))

df = pd.DataFrame(all_records, columns=columns)

df["sl_no"] = pd.to_numeric(df["sl_no"], errors="coerce")
df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")

df["material_involved"] = (
    df["material_involved"].astype(str).str.strip()
)

df["movement_type"] = (
    df["movement_type"].astype(str).str.strip()
)

df["history"] = (
    df["history"].astype(str).str.strip()
)

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

df.to_csv(OUTPUT_PATH, index=False)

print("\nExtraction completed.")
print("Output:", OUTPUT_PATH)

print("\nDataset shape:", df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nFirst 10 records:")
print(df.head(10).to_string(index=False))

print("\nMissing values:")
print(df.isnull().sum())
