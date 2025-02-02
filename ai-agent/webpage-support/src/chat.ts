import 'dotenv/config'
import { ChromaClient } from 'chromadb'
import { embed, generateText } from 'ai'
import { createAzure } from '@ai-sdk/azure'

const azure = createAzure({
	apiKey: process.env.AZURE_API_KEY!,
	apiVersion: process.env.AZURE_API_VERSION!,
	baseURL: process.env.AZURE_BASE_URL!,
})

const COLLECTION_NAME = 'web-embedding'
const embeddingModel = azure.textEmbeddingModel('text-embedding-ada-002', {})
const chroma = new ChromaClient({ path: 'http://localhost:8000' })

interface ChatResult {
	answer: string
	confidence: number
	sources: string[]
}

const chat = async (question: string): Promise<ChatResult> => {
	try {
		const { embedding } = await embed({
			model: embeddingModel,
			value: question,
		})

		const collection = await chroma.getOrCreateCollection({
			name: COLLECTION_NAME,
		})
		const results = await collection.query({
			nResults: 3,
			queryEmbeddings: [embedding],
		})

		const context = results.metadatas[0]
			.map((metadata: any) => ({
				body: metadata.body,
				url: metadata.url,
			}))
			.filter((e: any) => e.body.trim() !== '' && e.url.trim() !== '')

		const { text } = await generateText({
			model: azure('gpt4o'),
			messages: [
				{
					role: 'system',
					content: `
### Instruction ###
You are an AI support agent for a webpage. Your task is to provide accurate, helpful, and structured responses based on the given context about the page content. Follow these guidelines:

1. Provide concise and relevant answers directly related to the user's query.
2. Structure your response in a clear, point-by-point format when appropriate.
3. Use only the information from the provided context. Do not invent or assume any information not present in the context.
4. If the context doesn't contain enough information to answer the query, respond with "Insufficient information: [brief explanation]".
5. Do not ask for additional information or clarification from the user.
6. Maintain a professional and friendly tone in your responses.
7. If asked about personal opinions or experiences, respond with "As an AI, I don't have personal opinions or experiences."
8. Do not provide any information about the internal workings of the AI system or the company behind it.
9. If asked to perform tasks outside of providing information, respond with "I can only provide information based on the webpage content."
10. Include a confidence score (0-100%) for your answer based on the relevance and completeness of the context.
11. Cite the source URL for each piece of information you provide in your answer.

Format your response as follows:
Answer: [Your structured, point-by-point answer]
Confidence: [0-100]%
Sources: [List of relevant URLs]

Remember, your primary goal is to assist users by providing accurate, structured information from the webpage content while adhering to these guidelines.
          `,
				},
				{
					role: 'user',
					content: `
Query: ${question}
Retrieved Context: ${context
						.map((c) => `URL: ${c.url}\nBody: ${c.body}`)
						.join('\n\n')}
          `,
				},
			],
		})

		const parsedResponse = parseResponse(text)
		return parsedResponse
	} catch (error) {
		console.error('Error in chat function:', error)
		throw new Error('Failed to process your request. Please try again later.')
	}
}

const parseResponse = (text: string): ChatResult => {
	const answerMatch = text.match(/Answer:([\s\S]*?)(?=Confidence:)/)
	const confidenceMatch = text.match(/Confidence:\s*(\d+)%/)
	const sourcesMatch = text.match(/Sources:([\s\S]*)/)

	return {
		answer: answerMatch ? answerMatch[1].trim() : 'No answer provided.',
		confidence: confidenceMatch ? Number.parseInt(confidenceMatch[1]) : 0,
		sources: sourcesMatch
			? sourcesMatch[1]
					.split('\n')
					.map((s) => s.trim())
					.filter((s) => s.length > 0)
			: [],
	}
}

export const handleChatRequest = async (question: string): Promise<string> => {
	try {
		const result = await chat(question)
		return `
Answer: ${result.answer}

Confidence: ${result.confidence}%

Sources:
${result.sources.map((s) => `- ${s}`).join('\n')}
    `.trim()
	} catch (error) {
		console.error('Error handling chat request:', error)
		return 'I apologize, but I encountered an error while processing your request. Please try again later.'
	}
}
