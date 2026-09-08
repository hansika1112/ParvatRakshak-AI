from PyPDF2 import PdfReader
import re

PDF_PATH = "data/raw/gsi/landslide_report.pdf"

reader = PdfReader(PDF_PATH)

record_start = re.compile(r"^(\d+)\s+(\S+)\s+")

current_record = None
records = []

for page in reader.pages[:5]:

    text = page.extract_text()

    if not text:
        continue

    for line in text.splitlines():

        line = re.sub(r"\s+", " ", line).strip()

        if not line:
            continue

        if line.startswith("Sl.No."):
            continue

        if line.startswith("TypeHistory"):
            continue

        if line.startswith("LANDSLIDE INVENTORY"):
            continue

        if record_start.match(line):

            if current_record:
                records.append(current_record)

            current_record = line

        else:

            if current_record:
                current_record += " " + line

if current_record:
    records.append(current_record)

print("Total combined records:", len(records))

print("\n========== FIRST 20 RECORDS ==========\n")

for i, record in enumerate(records[:20], start=1):
    print(f"\nRECORD {i}")
    print(record)
