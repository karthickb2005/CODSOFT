import os
from dotenv import load_dotenv
load_dotenv()
import groq_client as groq
import fitz
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
import time
import random

# CONFIGURE GEMINI
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise EnvironmentError("GROQ_API_KEY environment variable is not set")

DEFAULT_GROQ_MODEL = os.environ.get(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def translate_text_with_retry(text, retries=5, delay=20):
    prompt = f"""
    Translate the following English text into clear, natural, and grammatically correct Tamil.
    Use professional Tamil suitable for official documents.
    Avoid literal word-by-word translation.

    English Text:
    {text}
    """
    
    for attempt in range(retries):
        try:
            print(f"Attempt {attempt+1} to translate...")
            try:
                resp_text = groq.generate_text(DEFAULT_GROQ_MODEL, prompt)
                return resp_text
            except Exception as e:
                raise
        except Exception as e:
            print(f"Error on attempt {attempt+1}: {e}")
            if "429" in str(e) or "ResourceExhausted" in str(e):
                wait_time = delay * (attempt + 1) + random.uniform(0, 5)
                print(f"Rate limit hit. Waiting for {wait_time:.2f} seconds...")
                time.sleep(wait_time)
            else:
                raise e
    raise Exception("Max retries exceeded for translation.")

def create_pdf(text, output_path):
    pdfmetrics.registerFont(
        TTFont("TamilFont", "NotoSansTamil-Regular.ttf")
    )

    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    c.setFont("TamilFont", 12)

    y = height - 40
    for line in text.split("\n"):
        if y < 40:
            c.showPage()
            c.setFont("TamilFont", 12)
            y = height - 40
        c.drawString(40, y, line)
        y -= 16

    c.save()

# MAIN
if __name__ == "__main__":
    try:
        print("Starting PDF translation process (with retry)...")
        print("Extracting text from input.pdf...")
        pdf_text = extract_text("input.pdf")
        print(f"Extracted {len(pdf_text)} characters.")
        
        print("Translating text using Gemini...")
        tamil_text = translate_text_with_retry(pdf_text)
        print("Translation received from Gemini.")

        print("Generating PDF...")
        create_pdf(tamil_text, "output_tamil.pdf")
        print("Tamil PDF generated successfully: output_tamil.pdf")

    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
