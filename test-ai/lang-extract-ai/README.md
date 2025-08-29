# Azure OpenAI Provider for LangExtract

This project extends LangExtract with Azure OpenAI support, including GPT-4o model registration and PDF processing capabilities.

## Quick Setup with UV

### 1. Install Dependencies

```bash
# Install all dependencies including OpenAI and PyMuPDF for PDF support
uv add langextract openai pymupdf
```

### 2. Configure Azure Credentials

Copy the template and set your Azure OpenAI credentials:

```bash
cp .env.template .env
# Edit .env with your actual values
```

Your `.env` file should contain:
```bash
AZURE_OPENAI_API_KEY=your-actual-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
```

### 3. Test the Setup

```bash
uv run python test_setup.py
```

## Usage Examples

### Basic Text Extraction with Azure GPT-4o

```python
import os
import sys
import langextract as lx

# Import our custom Azure provider
sys.path.insert(0, '.')
import providers

# Define extraction task
prompt = "Extract names and locations from the text."
examples = [
    lx.data.ExampleData(
        text="Dr. Smith works at MIT in Boston.",
        extractions=[
            lx.data.Extraction(
                extraction_class="person",
                extraction_text="Dr. Smith",
                attributes={"title": "Dr."}
            ),
            lx.data.Extraction(
                extraction_class="organization",
                extraction_text="MIT",
                attributes={"type": "university"}
            ),
            lx.data.Extraction(
                extraction_class="location",
                extraction_text="Boston",
                attributes={"type": "city"}
            ),
        ]
    )
]

# Run extraction with Azure OpenAI
result = lx.extract(
    text_or_documents="Prof. Johnson from Stanford visited Google in Mountain View.",
    prompt_description=prompt,
    examples=examples,
    model_id="gpt-4o",  # Uses our Azure provider
    api_key=os.getenv('AZURE_OPENAI_API_KEY'),
    azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT'),
    deployment_name="gpt-4o",
    fence_output=True,
    use_schema_constraints=False,
)

# Display results
for extraction in result.extractions:
    print(f"{extraction.extraction_class}: {extraction.extraction_text}")
```

### PDF Processing

```python
import langextract as lx

# Process PDF files directly
result = lx.extract(
    text_or_documents="document.pdf",  # LangExtract handles PDF parsing
    prompt_description="Extract research findings from the document.",
    examples=examples,
    model_id="gpt-4o",
    api_key=os.getenv('AZURE_OPENAI_API_KEY'),
    azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT'),
    deployment_name="gpt-4o",
    fence_output=True,
    use_schema_constraints=False,
    extraction_passes=2,  # Multiple passes for better recall
    max_workers=3,  # Parallel processing
)

# Generate interactive visualization
html_content = lx.visualize("results.jsonl")
with open("visualization.html", "w") as f:
    f.write(html_content if isinstance(html_content, str) else html_content.data)
```

## Available Examples

### 1. Basic Azure Example
```bash
uv run python azure_example.py
```
Demonstrates basic text extraction with Azure OpenAI.

### 2. PDF Processing Example  
```bash
uv run python pdf_azure_example.py
```
Shows how to extract information from PDF documents.

### 3. Original Gemini Example
```bash
uv run python main.py
```
The original example using Gemini models (requires LANGEXTRACT_API_KEY).

## Azure Provider Features

- **Model Support**: GPT-4o, GPT-4o-mini, GPT-4, GPT-4-turbo, GPT-35-turbo
- **PDF Processing**: Direct PDF file processing with PyMuPDF
- **Parallel Processing**: Configurable workers for large documents
- **Multi-pass Extraction**: Multiple passes for improved recall
- **Interactive Visualization**: HTML output for reviewing extractions

## Project Structure

```
lang-extract-ai/
├── providers/
│   ├── __init__.py              # Provider registration
│   └── azure_provider.py       # Azure OpenAI implementation
├── main.py                      # Original Gemini example
├── azure_example.py             # Azure text processing
├── pdf_azure_example.py         # Azure PDF processing
├── test_setup.py               # Setup verification
├── pyproject.toml              # Project configuration
├── .env.template               # Environment template
└── README.md                   # This file
```

## Configuration Details

### Environment Variables
- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL
- `AZURE_OPENAI_API_VERSION`: API version (optional, defaults to 2024-02-15-preview)

### Model Parameters
- `deployment_name`: Name of your Azure OpenAI deployment
- `fence_output=True`: Required for OpenAI models
- `use_schema_constraints=False`: Azure doesn't support schema constraints
- `max_tokens`: Token limit (default: 4000)
- `temperature`: Randomness (default: 0.0)

## Troubleshooting

### Common Issues

1. **Import Error**: Make sure you import the providers module:
   ```python
   import providers  # This registers the Azure provider
   ```

2. **Authentication**: Verify your Azure credentials in `.env`

3. **Deployment Name**: Ensure it matches your Azure deployment

4. **Rate Limits**: Adjust `max_workers` for your Azure quota

### Debug Mode
Enable logging to see detailed API interactions:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Getting Started

1. **Set up Azure OpenAI**: Create a resource and deploy GPT-4o
2. **Configure environment**: Copy `.env.template` to `.env` and fill in credentials  
3. **Test setup**: Run `uv run python test_setup.py`
4. **Try examples**: Start with `uv run python azure_example.py`
5. **Process PDFs**: Use `uv run python pdf_azure_example.py` with your documents

The provider automatically registers with LangExtract and enables seamless Azure OpenAI integration while maintaining compatibility with all LangExtract features like PDF processing, parallel extraction, and interactive visualization.
