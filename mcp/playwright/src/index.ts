import { google } from '@ai-sdk/google'
import { experimental_createMCPClient, streamText } from 'ai'
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio'

const model = google('gemini-2.5-pro-exp-03-25', {
  safetySettings: [
    {
      category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
      threshold: 'BLOCK_NONE',
    },
  ],
})

const main = async () => {
  try {
    const transport = new Experimental_StdioMCPTransport({
      command: 'npx',
      args: ['@playwright/mcp@latest'],
    })

    const clientOne = await experimental_createMCPClient({
      transport,
    })

    const tools = await clientOne.tools()

    const { textStream } = streamText({
      model: model,
      tools: tools,
      maxSteps: 10,
      messages: [
        {
          role: 'user',
          content:
            'Find PRs in the last 30 days for the ai-sdk repository (https://github.com/vercel/ai) and take screenshots of the top 2',
        },
      ],
      onFinish: async () => {
        await clientOne.close()
      },
      onChunk: async (chunk) => {
        console.log('Chunk:', chunk.chunk)
      },
      onStepFinish: async (step) => {
        console.log('Step finished:', step.)
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
