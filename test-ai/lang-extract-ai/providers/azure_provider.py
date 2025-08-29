"""Azure OpenAI provider for LangExtract."""

import os
import logging
from typing import Any, Dict, List, Optional, Union, Type
from dataclasses import dataclass

try:
    from openai import AzureOpenAI
    AZURE_OPENAI_AVAILABLE = True
except ImportError:
    AZURE_OPENAI_AVAILABLE = False

import langextract.providers.registry as registry
from langextract.inference import BaseLanguageModel
from langextract.data import ChatMessage

logger = logging.getLogger(__name__)


@dataclass
class AzureConfig:
    """Configuration for Azure OpenAI."""
    api_key: Optional[str] = None
    azure_endpoint: Optional[str] = None
    api_version: str = "2024-02-15-preview"
    deployment_name: Optional[str] = None


class AzureOpenAIModel(BaseLanguageModel):
    """Azure OpenAI language model implementation."""

    def __init__(self, model_id: str, **kwargs):
        if not AZURE_OPENAI_AVAILABLE:
            raise ImportError(
                "Azure OpenAI is not available. Install it with: "
                "uv add openai"
            )

        super().__init__(model_id=model_id, **kwargs)

        self.config = AzureConfig(
            api_key=kwargs.get('api_key') or os.getenv('AZURE_OPENAI_API_KEY'),
            azure_endpoint=kwargs.get('azure_endpoint') or os.getenv(
                'AZURE_OPENAI_ENDPOINT'),
            api_version=kwargs.get('api_version', "2024-02-15-preview"),
            deployment_name=kwargs.get('deployment_name') or model_id
        )

        if not self.config.api_key:
            raise ValueError(
                "Azure OpenAI API key is required. Set AZURE_OPENAI_API_KEY "
                "environment variable or pass api_key parameter."
            )

        if not self.config.azure_endpoint:
            raise ValueError(
                "Azure OpenAI endpoint is required. Set AZURE_OPENAI_ENDPOINT "
                "environment variable or pass azure_endpoint parameter."
            )


        self.client = AzureOpenAI(
            api_key=self.config.api_key,
            azure_endpoint=self.config.azure_endpoint,
            api_version=self.config.api_version
        )

        self.max_tokens = kwargs.get('max_tokens', 4000)
        self.temperature = kwargs.get('temperature', 0.0)

    def generate_text(
        self,
        messages: List[ChatMessage],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> str:
        """Generate text using Azure OpenAI."""

        # Convert ChatMessage objects to OpenAI format
        openai_messages = []
        for msg in messages:
            openai_messages.append({
                "role": msg.role,
                "content": msg.content
            })

        try:
            response = self.client.chat.completions.create(
                model=self.config.deployment_name,
                messages=openai_messages,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature if temperature is not None else self.temperature,
                **kwargs
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Azure OpenAI API error: {e}")
            raise


@registry.register(
    provider="azure",
    models=["gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-4-turbo", "gpt-35-turbo"],
    priority=100
)
def create_azure_model(model_id: str, **kwargs) -> AzureOpenAIModel:
    """Create an Azure OpenAI model instance."""
    return AzureOpenAIModel(model_id=model_id, **kwargs)


def get_schema_class() -> Optional[Type]:
    """Return schema class for structured outputs (if supported)."""
    return None
