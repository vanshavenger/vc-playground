import langextract as lx
import textwrap
import logging
# import fitz  # PyMuPDF for PDF generation

logging.basicConfig(level=logging.CRITICAL)

prompt = textwrap.dedent("""\
    Extract characters, emotions, and relationships in order of appearance.
    Use exact text for extractions. Do not paraphrase or overlap entities.
    Provide meaningful attributes for each entity to add context.""")

examples = [
    lx.data.ExampleData(
        text="ROMEO. But soft! What light through yonder window breaks? It is the east, and Juliet is the sun.",
        extractions=[
            lx.data.Extraction(
                extraction_class="character",
                extraction_text="ROMEO",
                attributes={"emotional_state": "wonder"}
            ),
            lx.data.Extraction(
                extraction_class="emotion",
                extraction_text="But soft!",
                attributes={"feeling": "gentle awe"}
            ),
            lx.data.Extraction(
                extraction_class="relationship",
                extraction_text="Juliet is the sun",
                attributes={"type": "metaphor"}
            ),
        ]
    )
]

input_text = "Lady Juliet gazed longingly at the stars, her heart aching for Romeo"

result = lx.extract(
    text_or_documents="extraction_report.pdf",
    prompt_description=prompt,
    examples=examples,
    model_id="gemini-2.5-flash-lite",
    extraction_passes=2,
    max_char_buffer=100
)


for i, extraction in enumerate(result.extractions, 1):
    if extraction.attributes:
        for key, value in extraction.attributes.items():
            print(f"{key}: {value}")

lx.io.save_annotated_documents(
    [result], output_name="extraction_results.jsonl", output_dir=".")

html_content = lx.visualize("extraction_results.jsonl")
with open("visualization.html", "w") as f:
    if hasattr(html_content, 'data'):
        f.write(html_content.data)
    else:
        f.write(html_content)


# def create_pdf_report(input_text, filename="extraction_report.pdf"):
#     doc = fitz.open()
#     page = doc.new_page()
#     body_font_size = 12
#     margin = 50

#     current_y = margin
#     wrapped_input = textwrap.fill(f'"{input_text}"', width=80)
#     for line in wrapped_input.split('\n'):
#         page.insert_text((margin, current_y), line,
#                          fontsize=body_font_size, color=(0.2, 0.2, 0.2))
#         current_y += body_font_size + 5

#     doc.save(filename)
#     doc.close()
#     print(f"PDF report saved as: {filename}")


# create_pdf_report(
#     "Lady Juliet gazed longingly at the stars, her heart aching for Romeo", "extraction_report.pdf")
