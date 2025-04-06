import asyncio
from textwrap import dedent

from agno.agent import Agent
from agno.tools.mcp import MCPTools
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from agno.models.google import Gemini
from dotenv import load_dotenv

import os

load_dotenv()


async def create_filesystem_agent(session):
    """Create and configure a filesystem agent with MCP tools."""
    mcp_tools = MCPTools(session=session)
    await mcp_tools.initialize()

    return Agent(
        model=Gemini(
            id="gemini-2.0-flash",
        ),
        tools=[mcp_tools],
        instructions=dedent("""\
                You are a GitHub assistant. Help users explore repositories and their activity.

                - Use headings to organize your responses
                - Be concise and focus on relevant information\
            """),
        markdown=True,
        show_tool_calls=True,
        debug_mode=True
    )


async def run_agent(message: str) -> None:
    """Run the filesystem agent with the given message."""

    server_params = StdioServerParameters(
        command="docker",

        args=[
            "run",
            "-i",
            "--rm",
            "-e",
            "GITHUB_PERSONAL_ACCESS_TOKEN",
            "mcp_local"
        ],
        env={
            "GITHUB_PERSONAL_ACCESS_TOKEN": os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN"),
        }

    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            agent = await create_filesystem_agent(session)

            await agent.aprint_response(message, stream=True)


if __name__ == "__main__":
    asyncio.run(run_agent(
        "Summarize the last change in the repository https://github.com/github/github-mcp-server"))
