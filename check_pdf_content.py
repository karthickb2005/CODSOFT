import fitz
import sys

def check_pdf(pdf_path):
    print(f"Checking: {pdf_path}")
    try:
        doc = fitz.open(pdf_path)
        full_text = ""
        for i, page in enumerate(doc):
            text = page.get_text()
            print(f"--- Page {i+1} ---")
            print(text[:500]) # Print first 500 chars
            full_text += text
        
        if not full_text.strip():
            print("\nRESULT: NO TEXT FOUND. This is likely a scanned PDF or image.")
        else:
            print(f"\nRESULT: Found {len(full_text)} characters.")
            
    except Exception as e:
        print(f"Error reading PDF: {e}")

if __name__ == "__main__":
    check_pdf("uploads/input.pdf")
