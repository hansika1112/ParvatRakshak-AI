from PyPDF2 import PdfReader

PDF_PATH = "data/raw/gsi/landslide_report.pdf"

reader = PdfReader(PDF_PATH)

print("Total pages:", len(reader.pages))
print("\n========== PAGE 1 ==========\n")

text = reader.pages[0].extract_text()

if text:
    lines = text.splitlines()

    for i, line in enumerate(lines[:60], start=1):
        print(f"{i}: {repr(line)}")
else:
    print("No text extracted.")
