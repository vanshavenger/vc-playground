import axios from 'axios'
import * as cheerio from 'cheerio'
import { embed } from 'ai'
import { createAzure } from '@ai-sdk/azure'
import 'dotenv/config'
import { ChromaClient } from 'chromadb'
import { URL } from 'url'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const requiredEnvVars = ['AZURE_API_KEY', 'AZURE_API_VERSION', 'AZURE_BASE_URL']
for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		throw new Error(`Missing required environment variable: ${envVar}`)
	}
}

const azure = createAzure({
	apiKey: process.env.AZURE_API_KEY!,
	apiVersion: process.env.AZURE_API_VERSION!,
	baseURL: process.env.AZURE_BASE_URL!,
})

const embeddingModel = azure.textEmbeddingModel('text-embedding-ada-002', {})

const chroma = new ChromaClient({
	path: 'http://localhost:8000',
})

const BASE_URL = 'https://vansh.dsandev.in'
const COLLECTION_NAME = 'web-embedding'
const CHUNK_SIZE = 350
const RATE_LIMIT_DELAY = 5000

const scrapeWebpage = async (url: string) => {
	try {
		const { data } = await axios.get(url)
		const $ = cheerio.load(data)
		const pageHead = $('head').html() || ''
		const pageBody = $('body').html() || ''

		const internalLinks = new Set<string>()
		const externalLinks = new Set<string>()

		$('a').each((_, element) => {
			const link = $(element).attr('href')
			if (!link || link === '#' || link.startsWith('mailto:') || link === '/')
				return

			try {
				const fullUrl = new URL(link, url)
				if (fullUrl.origin === new URL(BASE_URL).origin) {
					internalLinks.add(fullUrl.href)
				} else {
					externalLinks.add(fullUrl.href)
				}
			} catch (error) {
				console.error(`Invalid URL: ${link}`)
			}
		})

		console.log('internalLinks:', internalLinks)

		return {
			head: pageHead,
			body: pageBody,
			internalLinks: Array.from(internalLinks),
			externalLinks: Array.from(externalLinks),
		}
	} catch (error) {
		console.error(`Error scraping webpage ${url}:`, error)
		return { head: '', body: '', internalLinks: [], externalLinks: [] }
	}
}

const generateChunks = (input: string, chunkSize: number): string[] => {
	if (!input || chunkSize <= 0) return []
	const words = input.split(/\s+/)
	const chunks = []

	for (let i = 0; i < words.length; i += chunkSize) {
		chunks.push(words.slice(i, i + chunkSize).join(' '))
	}

	return chunks
}

const generateEmbedding = async (text: string) => {
	try {
		const { embedding } = await embed({
			model: embeddingModel,
			value: text,
		})
		return embedding
	} catch (error) {
		console.error('Error generating embedding:', error)
		return null
	}
}

const insertIntoDB = async (
	embedding: number[] | null,
	url: string,
	body = '',
	head = ''
) => {
	if (!embedding) return

	try {
		const collection = await chroma.getOrCreateCollection({
			name: COLLECTION_NAME,
		})

		const uniqueId = `${url}_${Date.now()}_${Math.random()
			.toString(36)
			.substring(7)}`

		await collection.add({
			ids: [uniqueId],
			embeddings: [embedding],
			metadatas: [{ url, body, head }],
		})

		console.log(
			`Successfully inserted embedding for ${url} with ID ${uniqueId}`
		)
	} catch (error) {
		console.error(`Error inserting into DB for ${url}:`, error)
	}
}

const processUrl = async (url: string, visitedUrls: Set<string>) => {
	if (visitedUrls.has(url)) return
	visitedUrls.add(url)

	console.log(`Processing ${url}`)
	const { head, body, internalLinks } = await scrapeWebpage(url)

	if (head) {
		const headEmbedding = await generateEmbedding(head)
		await insertIntoDB(headEmbedding, url, '', head)
		await sleep(RATE_LIMIT_DELAY)
	}

	if (body) {
        const bodyChunks = generateChunks(body, CHUNK_SIZE)
        console.log('bodyChunks:', bodyChunks.length)
		for (const chunk of bodyChunks) {
			const bodyEmbedding = await generateEmbedding(chunk)
			await insertIntoDB(bodyEmbedding, url, chunk, head)
			await sleep(RATE_LIMIT_DELAY)
		}
	}

	for (const link of internalLinks) {
		if (!visitedUrls.has(link)) {
			await processUrl(link, visitedUrls)
		}
	}
}

const main = async () => {
	try {
		await chroma.heartbeat()
		const visitedUrls = new Set<string>()
		await processUrl(BASE_URL, visitedUrls)
		console.log('Scraping and embedding completed successfully')
	} catch (error) {
		console.error('An error occurred during the main process:', error)
	}
}

main()
