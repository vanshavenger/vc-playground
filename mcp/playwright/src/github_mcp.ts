import { google } from '@ai-sdk/google'
import { groq } from '@ai-sdk/groq'
import {
  experimental_createMCPClient,
  generateObject,
  Output,
  smoothStream,
  streamObject,
  streamText,
} from 'ai'
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio'
import { z } from 'zod'

const model = google('gemini-2.5-pro-exp-03-25')

const main = async () => {
  try {
    const transport = new Experimental_StdioMCPTransport({
      command: 'docker',
      args: [
        'run',
        '-i',
        '--rm',
        '-e',
        'GITHUB_PERSONAL_ACCESS_TOKEN',
        'ghcr.io/github/github-mcp-server',
      ],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN!,
      },
    })

    const clientOne = await experimental_createMCPClient({
      transport,
    })

    const tools = await clientOne.tools()

    const { textStream, steps } = streamText({
      model: model,
      tools: tools,
      maxSteps: 10,
      // experimental_output: Output.object({
      //   schema: z.object({
      //     title: z.string(),
      //     author: z.string(),
      //     summary: z.string(),
      //     url: z.string().url(),
      //   }),
      // }),
      messages: [
        {
          role: 'user',
          content:
            'Find 5 PRs in ai-sdk repository (https://github.com/vercel/ai) and give me details about them including the title, author, and a summary of the changes made.',
        },
      ],
      system: `
        You are a GitHub expert. You can search for PRs in any repository and provide details about them.
        ### Output format
        \`\`\`json
        {
          "title": "PR Title",
          "author": "Author Name",
          "summary": "Summary of the changes made in the PR.",
          "url": "URL to the PR"
        }
        \`\`\`
        ### Instructions
        - Provide the details in the specified format.
        - Include the title, author, summary, and URL of each PR.
        - Make sure to format the output as JSON.
        - If you cannot find any PRs, respond with "No PRs found."
        - If the repository is private, respond with "Repository is private. Please provide access."
        - If the repository does not exist, respond with "Repository does not exist."
        - If the repository is not specified, respond with "Please provide a valid repository URL."
        - If the repository is not a GitHub repository, respond with "Please provide a valid GitHub repository URL."
        - If the repository is not accessible, respond with "Repository is not accessible."
        - If the repository is archived, respond with "Repository is archived. No PRs available."
        - If the repository is empty, respond with "Repository is empty. No PRs available."
        - If the repository is not public, respond with "Repository is not public. Please provide access."
        - If the repository is not a fork, respond with "Repository is not a fork. No PRs available."
        - If the repository is a fork, respond with "Repository is a fork. No PRs available."
        - If the repository is a draft, respond with "Repository is a draft. No PRs available."
        - If the repository is a template, respond with "Repository is a template. No PRs available."
        `,
      onFinish: async () => {
        console.log('Finished')
        await clientOne.close()
      },
      onChunk: async ({ chunk }) => {
        if (chunk.type === 'text-delta') {
          process.stdout.write(chunk.textDelta)
        }
      },
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
  .catch((error) => {
    console.error('Error:', error)
  })
  .finally(() => {
    console.log('Done')
  })
