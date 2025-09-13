import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    firecrawl_api_key: str | None = None

    ollama_base_url: str = "http://localhost:11434"
    llm_model: str = "gpt-oss:20b"

    embedding_model: str = "nomic-embed-text"
    vector_dim: int = 1024

    top_k: int = 3
    batch_size: int = 512
    rerank_top_k: int = 3

    milvus_db_path: str = "./data/milvus_binary.db"
    collection_name: str = "paralegal_agent"

    docs_path: str = "./data/raft.pdf"

    hf_cache_dir: str = "./cache/hf_cache"

    temperature: float = 0.6
    max_tokens: int = 1000

    model_config: SettingsConfigDict = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )


def model_post_init(self, __context) -> None:
    Path(self.milvus_db_path).parent.mkdir(parents=True, exist_ok=True)
    Path(self.hf_cache_dir).mkdir(parents=True, exist_ok=True)


settings = Settings()
