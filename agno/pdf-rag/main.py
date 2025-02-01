import os
from agno.models.azure import AzureOpenAI
from pydantic import BaseModel, Field
from typing import Optional
from agno.embedder.azure_openai import AzureOpenAIEmbedder
from dotenv import load_dotenv
from pathlib import Path
from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
from agno.vectordb.pgvector import PgVector, SearchType
from agno.agent import Agent
import time

load_dotenv()

AZURE_MODEL_DEPLOYMENT = "gpt4o"
AZURE_EMBEDDER_DEPLOYMENT = "text-embedding-ada-002"
AZURE_EMBEDDER_MODEL = "text-embedding-ada-002"
DB_URL = "postgresql+psycopg://ai:ai@localhost:5532/ai"
PDF_TABLE_NAME = "pdf_documents"
INVOICE_FOLDER = "invoice"

class InvoiceItem(BaseModel):
    item: str = Field(..., description="Name of the item")
    description: str = Field(..., description="Description of the item")
    quantity: float = Field(..., description="Quantity of the item")
    unit_price: float = Field(..., description="Unit price of the item")
    tax: Optional[float] = Field(None, description="Tax amount for the item")
    subtotal: float = Field(..., description="Subtotal for the item")


class InvoiceData(BaseModel):
    invoice_number: str = Field(..., description="Invoice number")
    items: list[InvoiceItem] = Field(..., description="List of items in the invoice")
    total_amount: float = Field(..., description="Total amount of the invoice")
    total_tax: Optional[float] = Field(
        None, description="Total tax amount for the invoice"
    )

def setup_azure_model():
    return AzureOpenAI(
        id=AZURE_MODEL_DEPLOYMENT,
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        azure_endpoint=os.getenv("AZURE_API_BASE"),
        azure_deployment=AZURE_MODEL_DEPLOYMENT,
    )

def setup_azure_embedder():
    return AzureOpenAIEmbedder(
        model=AZURE_EMBEDDER_MODEL,
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        azure_endpoint=os.getenv("AZURE_API_BASE"),
        azure_deployment=AZURE_EMBEDDER_DEPLOYMENT,
    )
    
def setup_pdf_knowledge_base(pdf_path: str | Path, azure_embedder: AzureOpenAIEmbedder):
    return PDFKnowledgeBase(
        path=pdf_path,
        vector_db=PgVector(
            table_name=PDF_TABLE_NAME,
            db_url=DB_URL,
            search_type=SearchType.hybrid,
            embedder=azure_embedder,
        ),
        reader=PDFReader(chunk=True),
        num_documents=1,
        optimize_on=1,
    )

def setup_agent(azure_model: AzureOpenAI, pdf_knowledge_base: PDFKnowledgeBase):
    return Agent(
        description="You are an expert Vansh product invoice data extractor. Your task is to meticulously extract and structure information from Vansh invoices, ensuring accuracy and completeness in the data you provide.",
        instructions="""
            ### Instruction ###
            Extract the Vansh invoice data following these specific guidelines:

            1. Invoice Number:
            - Extract the exact Vansh invoice number as it appears on the document.
            - Format: "VANSH-INV-YYYY-NNNN" or as it appears on the invoice.

            2. Items:
            For each Vansh product or service, extract the following in the specified format:
            a) Item: Full Vansh product name or service title, exactly as it appears.
            b) Description: Additional details about the Vansh item. This should be separate from the item name.
            c) Quantity: Exact number of units (integer or decimal).
            d) Unit Price: Price per unit, as a numeric value without currency symbols.
            e) Tax: Tax amount for the item if stated, otherwise null.
            f) Subtotal: Total price for this item (quantity * unit price).

            3. Total Amount:
            - Extract the final total amount as a numeric value, excluding currency symbols.

            4. Total Tax:
            - Extract the explicitly stated total tax amount.
            - If not stated, calculate by summing individual item taxes.
            - If no tax information is available, set to null.

            Additional Instructions:
            - Preserve original formatting of Vansh SKUs, product codes, and identifiers in the item name.
            - Convert all numeric values to appropriate number types (integer or float).
            - Represent absent required fields as null.
            - Ensure all extracted data is directly sourced from the Vansh invoice document.

            Example:
            Given the following Vansh invoice item:
            "VANSH_TECH_001 - Vansh Pro Laptop, 16GB RAM, 512GB SSD, 1 unit @ $999.99, Tax: $80.00, Subtotal: $999.99"

            The extracted data should be:
            {
                "item": "VANSH_TECH_001",
                "description": "Vansh Pro Laptop, 16GB RAM, 512GB SSD",
                "quantity": 1,
                "unit_price": 999.99,
                "tax": 80.00,
                "subtotal": 999.99
            }

            Output Format:
            {
                "invoice_number": "VANSH-INV-2023-001",
                "items": [
                    {
                        "item": "VANSH_TECH_001",
                        "description": "Vansh Pro Laptop, 16GB RAM, 512GB SSD",
                        "quantity": 1,
                        "unit_price": 999.99,
                        "tax": 80.00,
                        "subtotal": 999.99
                    },
                    {
                        "item": "VANSH_SERVICE_001",
                        "description": "Vansh Tech Support - Premium package, 1-year subscription",
                        "quantity": 1,
                        "unit_price": 199.99,
                        "tax": 16.00,
                        "subtotal": 199.99
                    }
                ],
                "total_amount": 1295.98,
                "total_tax": 96.00
            }

            Extract the Vansh invoice data from the provided document and present it in the format shown above.
        """,
        add_references=True,
        model=azure_model,
        knowledge=pdf_knowledge_base,
        search_knowledge=True,
        markdown=False,
        response_model=InvoiceData,
        structured_outputs=True,
    )
    

def process_invoices():
    azure_model = setup_azure_model()
    azure_embedder = setup_azure_embedder()
    
    pdf_files = [f for f in os.listdir(INVOICE_FOLDER) if f.endswith(".pdf")]
    all_invoice_data = []

    for pdf_file in pdf_files:
        pdf_path = os.path.join(INVOICE_FOLDER, pdf_file)
        pdf_knowledge_base = setup_pdf_knowledge_base(pdf_path, azure_embedder)

        agent = setup_agent(azure_model, pdf_knowledge_base)
        response = agent.run("Extract the invoice data.")
        invoice_data: InvoiceData = response.content
        all_invoice_data.append(invoice_data)

    return all_invoice_data

def main():
    all_invoice_data = process_invoices()
    print(all_invoice_data)
    


if __name__ == "__main__":
    main()
