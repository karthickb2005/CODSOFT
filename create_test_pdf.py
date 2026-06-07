from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def create_test_pdf():
    c = canvas.Canvas("input.pdf", pagesize=A4)
    c.drawString(100, 750, "Hello, this is a test PDF document.")
    c.drawString(100, 730, "We are testing the English to Tamil translation.")
    c.drawString(100, 710, "Programming is fun and powerful.")
    c.save()

if __name__ == "__main__":
    create_test_pdf()
    print("input.pdf created.")
