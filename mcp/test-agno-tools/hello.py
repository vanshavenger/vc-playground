import os
from agno.agent import Agent
from agno.models.groq import Groq
from agno.tools.thinking import ThinkingTools
from agno.knowledge.url import UrlKnowledge
from agno.vectordb.pgvector import PgVector, SearchType
from agno.embedder.ollama import OllamaEmbedder
from dotenv import load_dotenv

load_dotenv()

db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"

knowledge_base = UrlKnowledge(
    urls=["https://sdk.vercel.ai/llms.txt"],
    vector_db=PgVector(table_name="ai_sdk", db_url=db_url,
                       search_type=SearchType.hybrid, embedder=OllamaEmbedder()),
    num_documents=5,
    optimize_on=2000,

)

# knowledge_base.load(recreate=True, upsert=True)

agent = Agent(
    model=Groq(id="llama-3.3-70b-versatile"),
    markdown=True,
    tools=[ThinkingTools(add_instructions=True)],
    show_tool_calls=True,
    knowledge=knowledge_base,
    add_references=True,
    debug_mode=True,
    search_knowledge=True,
    
)

agent.print_response(
    "Give me the way to use tools with stream object", stream=True)


for key in list(os.environ.keys()):
    if key.startswith('GROQ_'):
        del os.environ[key]
    if key.startswith("HUGGINGFACE_"):
        del os.environ[key]
