from flask import Flask, render_template, request, send_file
import os
import logging
# Configure logging
logging.basicConfig(
    filename='web_app_debug.log', 
    level=logging.DEBUG, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)

from app import extract_text, translate_text, create_pdf

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        try:
            logging.info("Received POST request")
            print("Received POST request")
            
            if 'pdf' not in request.files:
                logging.warning("No 'pdf' file in request")
                print("No 'pdf' file in request")
                return "No file part"
            
            pdf_file = request.files["pdf"]

            if pdf_file.filename == "":
                logging.warning("No filename selected")
                print("No filename selected")
                return "No file selected"

            logging.info(f"Saving file: {pdf_file.filename}")
            print(f"Saving file: {pdf_file.filename}")
            
            input_path = os.path.join(UPLOAD_FOLDER, "input.pdf")
            pdf_file.save(input_path)

            # PDF → Tamil
            logging.info("Extracting text...")
            print("Extracting text...")
            text = extract_text(input_path)
            logging.info(f"Extracted {len(text)} characters. Translating...")
            print(f"Extracted {len(text)} characters. Translating...")
            
            tamil_text = translate_text(text)
            logging.info("Translation successful.")
            print("Translation successful.")
            
            # Debug: Save raw translation
            with open("debug_translation.txt", "w", encoding="utf-8") as f:
                f.write(tamil_text)
                
            create_pdf(tamil_text, "output_tamil.pdf")
            logging.info("PDF created. Sending file...")
            print("PDF created. Sending file...")
            return send_file("output_tamil.pdf", as_attachment=True)
            
        except Exception as e:
            logging.error(f"Error during processing: {e}", exc_info=True)
            print(f"Error during processing: {e}")
            import traceback
            traceback.print_exc()
            return f"Error: {e}", 500

    return render_template("index.html")

@app.route('/favicon.ico')
def favicon():
    return "", 204

if __name__ == "__main__":
    app.run(debug=True)
