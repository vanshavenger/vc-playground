import { generateObject } from 'ai'
import { createAzure } from '@ai-sdk/azure'
import { z } from 'zod'

const azure = createAzure({
	apiKey: process.env.AZURE_API_KEY!,
	apiVersion: process.env.AZURE_API_VERSION!,
	baseURL: process.env.AZURE_BASE_URL!,
})

export async function detectLanguage(code: string): Promise<string> {
	const model = azure('gpt4o')

	const { object } = await generateObject({
		model,
		system:
			'You are an expert in programming languages with extensive knowledge of syntax patterns and language-specific features.',
		schema: z.object({
			language: z.string().describe('The detected programming language'),
			confidence: z
				.number()
				.min(0)
				.max(1)
				.describe('Confidence level of the detection (0-1)'),
			reasoning: z
				.string()
				.describe('Brief explanation of the detection reasoning'),
		}),
		prompt: `Analyze the following code snippet and determine its programming language. Provide your confidence level in the detection and a brief explanation of your reasoning.

Code snippet:
${code.slice(
	0,
	1000
)} // Only send the first 1000 characters for language detection

Respond with a JSON object containing 'language', 'confidence', and 'reasoning'.

Example responses:

1. For JavaScript:
{
  "language": "JavaScript",
  "confidence": 0.95,
  "reasoning": "The code uses JavaScript-specific syntax such as 'const', arrow functions (=>), and methods like 'map' and 'filter'. It also includes typical JS patterns like async/await and Promise usage."
}

2. For Python:
{
  "language": "Python",
  "confidence": 0.98,
  "reasoning": "The code uses Python-specific syntax such as 'def' for function definitions, ':' for block starts, and 'import' statements. It also includes Python-style string formatting and list comprehensions."
}

3. For Java:
{
  "language": "Java",
  "confidence": 0.92,
  "reasoning": "The code contains Java-specific elements such as 'public class', 'public static void main(String[] args)', and strong typing (e.g., 'String', 'int'). It also uses Java-style exception handling with try-catch blocks."
}`,
	})

	return object.language
}
