from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def create_large_pdf(pages=15, out='input.pdf'):
    c = canvas.Canvas(out, pagesize=A4)
    width, height = A4
    for p in range(1, pages+1):
        y = height - 50
        c.setFont('Helvetica', 12)
        c.drawString(50, y, f'Test Document - Page {p}')
        y -= 30
        # Add multiple paragraphs per page
        for i in range(20):
            text = f"This is sample paragraph {i+1} on page {p}. " \
                   "The quick brown fox jumps over the lazy dog. " \
                   "Programming languages and natural language models are useful."
            c.drawString(50, y, text[:100])
            y -= 20
            if y < 80:
                break
        c.showPage()
    c.save()

if __name__ == '__main__':
    create_large_pdf(pages=15)
    print('Large input.pdf created (15 pages).')
