from PyPDF2 import PdfReader

pdf_path = "data/raw/gsi/landslide_report.pdf"

reader = PdfReader(pdf_path)

print("Total pages:", len(reader.pages))

for page_number in range(min(5, len(reader.pages))):
    page = reader.pages[page_number]
    text = page.extract_text()

    print("\n" + "=" * 80)
    print(f"PAGE {page_number + 1}")
    print("=" * 80)

    if text:
        print(text[:5000])
    else:
        print("No text extracted from this page.")