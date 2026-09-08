import pdfplumber

PDF_PATH = "data/raw/gsi/landslide_report.pdf"

with pdfplumber.open(PDF_PATH) as pdf:

    page = pdf.pages[0]

    print("Page size:", page.width, "x", page.height)

    print("\n========== EXTRACTED TABLE ==========\n")

    tables = page.extract_tables()

    print("Tables found:", len(tables))

    for table_no, table in enumerate(tables, start=1):

        print(f"\n--- TABLE {table_no} ---\n")

        for row in table[:15]:
            print(row)
