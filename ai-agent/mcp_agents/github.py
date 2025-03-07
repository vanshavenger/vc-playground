import asyncio
import os

from textwrap import dedent

from agno.models.azure import AzureOpenAI
from agno.agent import Agent
from agno.tools.mcp import MCPTools

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from dotenv import load_dotenv

load_dotenv()

async def create_github_agent(session):
    mcp_tools = MCPTools(session=session)
    await mcp_tools.initialize()

    return Agent(
        model=AzureOpenAI(
            id="gpt4o",
            api_version="2024-10-21",
            api_key=os.environ.get("AZURE_OPENAI_API_KEY"),
            azure_endpoint=os.environ.get("AZURE_API_BASE"),
        ),
        tools=[mcp_tools],
        instructions="You are a GitHub assistant. Help users explore repositories and their activity.",
        markdown=True,
        show_tool_calls=True,
    )


async def run_agent(message: str) -> None:
    if not os.getenv("GITHUB_TOKEN"):
        raise ValueError("GITHUB_TOKEN environment variable is required")

    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@modelcontextprotocol/server-github"],
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            agent = await create_github_agent(session)
            
            res = agent.arun(message)
            return res


def test_github():
    assert asyncio.run(run_agent("What is the latest commit on the master branch of the agno repository?"))

