import os

from agno.models.azure import AzureOpenAI

from agno.embedder.azure_openai import AzureOpenAIEmbedder
from dotenv import load_dotenv

load_dotenv()

AZURE_MODEL_DEPLOYMENT = "gpt4o"
AZURE_EMBEDDER_DEPLOYMENT = "text-embedding-ada-002"
AZURE_EMBEDDER_MODEL = "text-embedding-ada-002"

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

def process_invoices():
    azure_model = setup_azure_model()
    azure_embedder = setup_azure_embedder()

def main():
    all_invoice_data = process_invoices()
    print(all_invoice_data)
    


if __name__ == "__main__":
    main()
