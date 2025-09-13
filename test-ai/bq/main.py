from crewai import LLM
from pydantic import BaseModel, Field


def load_llm():
    llm = LLM(
        base_url="http://localhost:11434",
        model="gpt-oss:20"
    )
    return llm
