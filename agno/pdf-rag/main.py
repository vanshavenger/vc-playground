import os

from agno.models.azure import AzureOpenAI
from pydantic import BaseModel, Field
from typing import Optional
from agno.embedder.azure_openai import AzureOpenAIEmbedder
from dotenv import load_dotenv
from pathlib import Path
from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
from agno.vectordb.pgvector import PgVector, SearchType

load_dotenv()

AZURE_MODEL_DEPLOYMENT = "gpt4o"
AZURE_EMBEDDER_DEPLOYMENT = "text-embedding-ada-002"
AZURE_EMBEDDER_MODEL = "text-embedding-ada-002"
DB_URL = "postgresql+psycopg://ai:ai@localhost:5532/ai"
PDF_TABLE_NAME = "pdf_documents"

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

def process_invoices():
    azure_model = setup_azure_model()
    azure_embedder = setup_azure_embedder()

def main():
    all_invoice_data = process_invoices()
    print(all_invoice_data)
    


if __name__ == "__main__":
    main()
