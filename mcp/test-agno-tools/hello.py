import os
from agno.agent import Agent
from agno.models.groq import Groq
from agno.tools.thinking import ThinkingTools
from agno.knowledge.url import UrlKnowledge
from agno.vectordb.pgvector import PgVector, SearchType
from agno.embedder.ollama import OllamaEmbedder
from agno.models.google import Gemini
from agno.tools.sleep import SleepTools

from dotenv import load_dotenv

load_dotenv()

db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"


def sleep(seconds=10):
    """Sleep for a given number of seconds.

    Args:
        seconds (int): Number of seconds to sleep. Default is 10.

    Returns:
        None

    Raises:
        None

    """
    import time
    time.sleep(seconds)


knowledge_base = UrlKnowledge(
    urls=["https://sdk.vercel.ai/llms.txt"],
    vector_db=PgVector(table_name="ai_sdk", db_url=db_url,
                       search_type=SearchType.hybrid, embedder=OllamaEmbedder()),
    num_documents=5,
    optimize_on=2000,

)

# knowledge_base.load(recreate=True, upsert=True)

agent = Agent(
    model=Gemini(id="gemini-2.5-pro-preview-03-25"),
    markdown=True,
    tools=[ThinkingTools(add_instructions=True), SleepTools()],
    show_tool_calls=True,
    knowledge=knowledge_base,
    add_references=True,
    debug_mode=True,
    search_knowledge=True,
    instructions="""
    You are a helpful assistant.
    You have access to a knowledge base.
    
    ### Sleep Tool
    Use it after each step and sleep for 10 seconds
    
    """

)

agent.print_response(
    "Best model on vercel ai sdk",)


for key in list(os.environ.keys()):
    if key.startswith('GROQ_'):
        del os.environ[key]
    if key.startswith("HUGGINGFACE_"):
        del os.environ[key]
