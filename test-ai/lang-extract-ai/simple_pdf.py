import fitz  # PyMuPDF for PDF generation
import textwrap


def create_simple_pdf_report(input_text, filename="simple_extraction_report.pdf"):
    """Create a simple PDF with the input text"""
    doc = fitz.open()  # Create a new PDF document
    page = doc.new_page()  # Create a new page

    # Define text styling
    title_font_size = 16
    subtitle_font_size = 14
    body_font_size = 12
    margin = 50

    # Current position for text insertion
    current_y = margin

    # Add title
    title = "Text Analysis Report"
    page.insert_text((margin, current_y), title,
                     fontsize=title_font_size, color=(0, 0, 0))
    current_y += title_font_size + 20

    # Add input text section
    page.insert_text((margin, current_y), "Input Text:",
                     fontsize=subtitle_font_size, color=(0, 0, 0))
    current_y += subtitle_font_size + 10

    # Wrap input text if too long
    wrapped_input = textwrap.fill(f'"{input_text}"', width=80)
    for line in wrapped_input.split('\n'):
        page.insert_text((margin, current_y), line,
                         fontsize=body_font_size, color=(0.2, 0.2, 0.2))
        current_y += body_font_size + 5

    current_y += 20

    # Add some analysis notes
    page.insert_text((margin, current_y), "Text Analysis:",
                     fontsize=subtitle_font_size, color=(0, 0, 0))
    current_y += subtitle_font_size + 15

    analysis_notes = [
        "• Characters mentioned: Lady Juliet, Romeo",
        "• Emotions present: longing, aching heart",
        "• Setting: Stars, suggesting nighttime",
        "• Relationship: Romantic connection between characters"
    ]

    for note in analysis_notes:
        page.insert_text((margin, current_y), note,
                         fontsize=body_font_size, color=(0.3, 0.3, 0.3))
        current_y += body_font_size + 8

    # Save the PDF
    doc.save(filename)
    doc.close()
    print(f"PDF report saved as: {filename}")


# Create PDF with the specified text
input_text = "Lady Juliet gazed longingly at the stars, her heart aching for Romeo"
create_simple_pdf_report(input_text)
