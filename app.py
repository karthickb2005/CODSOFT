import os
from dotenv import load_dotenv
load_dotenv()
import groq_client as groq
import fitz
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
import time
import random
import sys
import traceback
import textwrap
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

# CONFIGURE GEMINI
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise EnvironmentError("GROQ_API_KEY environment variable is not set")

# Default Groq model can be configured via env `GROQ_MODEL`
DEFAULT_GROQ_MODEL = os.environ.get(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    
    print(f"DEBUG: Extracted text preview: {text[:100]}")
    if not text.strip():
        print("WARNING: Extracted text is empty! PDF might be scanned/image-based.")
    return text

def chunk_text(text, chunk_size=1200):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def translate_single_chunk(chunk, index, total_chunks):
    start_time = time.time()
    print(f"DEBUG: [Chunk {index+1}/{total_chunks}] Processing... (Size: {len(chunk)} chars)")
    
    # Micro-delay to prevent burst hitting
    time.sleep(0.3)
    
    # Retry logic for THIS chunk
    for attempt in range(5):
        try:
            msg = f"Translate the following text to Tamil:\n\n{chunk}"
            
            # Check for empty chunk
            if not chunk.strip():
                return ""

            try:
                resp_text = groq.generate_text(DEFAULT_GROQ_MODEL, msg)
                print(f"DEBUG: [Chunk {index+1}] Success! Took {time.time() - start_time:.2f}s")
                return resp_text
            except Exception as e:
                raise
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                import re
                # Default wait
                wait_time = (2 ** attempt) + random.uniform(0, 1) + 5
                # Try to parse wait time
                match = re.search(r"retry in (\d+(\.\d+)?)s", str(e))
                if match:
                   wait_time = float(match.group(1)) + 2
                
                print(f"WARNING: [Chunk {index+1}] Rate limit hit. Retrying in {wait_time:.2f} s...")
                time.sleep(wait_time)
            else:
                print(f"ERROR: [Chunk {index+1}] Failed with error: {e}")
                raise e
    else:
         # FAILED AFTER ALL RETRIES
         print(f"ERROR: [Chunk {index+1}] Failed to translate after 5 retries.")
         return chunk + "\n[Translation Failed for this section]"

def translate_text(text):
    chunks = chunk_text(text)
    translated_chunks = [""] * len(chunks)
    
    print(f"DEBUG: Split text into {len(chunks)} chunks. Starting parallel translation with 3 workers...")

    with ThreadPoolExecutor(max_workers=3) as executor:
        # Submit all tasks and keep track of them
        futures = []
        for i, chunk in enumerate(chunks):
            futures.append(executor.submit(translate_single_chunk, chunk, i, len(chunks)))

        # Collect results with timeout guard
        from concurrent.futures import TimeoutError
        
        for i, future in enumerate(futures):
            try:
                # Enforce 25s timeout for each chunk
                translated_text = future.result(timeout=25)
                translated_chunks[i] = translated_text
            except TimeoutError:
                print(f"CRITICAL ERROR: Chunk {i+1} timed out after 25s.")
                translated_chunks[i] = "[Timeout Skipped]"
            except Exception as e:
                print(f"CRITICAL ERROR in chunk {i+1}: {e}")
                translated_chunks[i] = "[Translation Failed]"

    return "\n".join(translated_chunks)

def structure_text(text):
    # Restore structure by keeping empty lines
    lines = text.split("\n")
    
    # Find first non-empty line as title
    title = "Language Translation"
    body_start = 0
    
    for i, line in enumerate(lines):
        if line.strip():
            title = line.strip()
            body_start = i + 1
            break
            
    body = lines[body_start:]
    return title, body

def create_pdf(text, output_path):
    pdfmetrics.registerFont(
        TTFont("TamilFont", "NotoSansTamil-Regular.ttf")
    )

    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    title_text, body_lines = structure_text(text)

    # ---------- TITLE ----------
    c.setFont("TamilFont", 17)
    c.drawCentredString(width / 2, height - 2 * cm, title_text)

    # ---------- BODY ----------
    c.setFont("TamilFont", 13)

    left_margin = 2 * cm
    top_margin = height - 3.8 * cm
    textobject = c.beginText(left_margin, top_margin)
    textobject.setLeading(20)

    for line in body_lines:
        line = line.strip()
        if not line:
            textobject.textLine("") # Print blank line
            continue

        wrapped = textwrap.wrap(line, 60) # Reduced to 60 chars/line to fit page
        for w in wrapped:
            textobject.textLine(w)
        # textobject.textLine("") # Removed forced double spacing

    c.drawText(textobject)
    c.save()

# MAIN
if __name__ == "__main__":
    try:
        print("Starting PDF translation process (with chunking)...")
        sys.stdout.flush()
        
        print("Extracting text from input.pdf...")
        pdf_text = extract_text("input.pdf")
        print(f"Extracted {len(pdf_text)} characters.")
        sys.stdout.flush()
        
        print("Translating text using Gemini...")
        tamil_text = translate_text(pdf_text)
        print("Translation received from Gemini.")
        sys.stdout.flush()

        # Debug: Save raw translation
        with open("debug_translation.txt", "w", encoding="utf-8") as f:
            f.write(tamil_text)
        print("Debug: Saved translation to debug_translation.txt")

        print("Generating PDF...")
        create_pdf(tamil_text, "output_tamil.pdf")
        print("Tamil PDF generated successfully: output_tamil.pdf")
        sys.stdout.flush()

    except Exception as e:
        with open("error.log", "w") as f:
            f.write(f"An error occurred: {e}\n")
            traceback.print_exc(file=f)
        sys.stdout.flush()
