import { generateText, type LanguageModelV1 } from 'ai'

import {
  AZURE_SYSTEM_PROMPT,
  DEBATE_TOPIC,
  DEEPSEEK_SYSTEM_PROMPT,
  MAX_TURN,
  RETRY_ATTEMPTS,
  RETRY_DELAY,
} from './constants'
import {
  azure,
  cleanText,
  deepseek,
  logMessage,
  withRetry,
  type Messages,
  type ModelClient,
} from './utils'

const createModelClient = (systemPrompt: string, defaultModel: LanguageModelV1): ModelClient => {
  const messages: Messages = []

  return async (message: string, model: LanguageModelV1 = defaultModel): Promise<string> => {
    messages.push({ role: 'user', content: message })

    try {
      const { text } = await withRetry(
        () =>
          generateText({
            system: systemPrompt,
            model,
            messages,
          }),
        RETRY_ATTEMPTS,
        RETRY_DELAY
      )

      messages.push({ role: 'assistant', content: text })
      return text
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logMessage('Error', errorMessage)
      return `Sorry, I encountered an error: ${errorMessage}`
    }
  }
}

async function runDebate(): Promise<void> {
  const deepseekClient = createModelClient(DEEPSEEK_SYSTEM_PROMPT, deepseek)
  const azureClient = createModelClient(AZURE_SYSTEM_PROMPT, azure('gpt4o'))

  let currentTurn = 0
  let flag = 'A'
  let lastMessage = 'Hello'

  logMessage('Debate', `Starting debate on topic: ${DEBATE_TOPIC}`)
  logMessage('Debate', `Maximum turns: ${MAX_TURN}`)

  try {
    while (currentTurn < MAX_TURN) {
      if (flag === 'A') {
        lastMessage = await azureClient(`DeepSeek says: ${lastMessage}`)
        logMessage('Azure', lastMessage)
        flag = 'D'
      } else {
        lastMessage = await deepseekClient(`Azure says: ${lastMessage}`)
        lastMessage = cleanText(lastMessage)
        logMessage('DeepSeek', lastMessage)
        flag = 'A'
      }

      currentTurn++
      logMessage('Debate', `Completed turn ${currentTurn}/${MAX_TURN}`)
    }

    logMessage('Debate', 'Debate completed successfully')
  } catch (error) {
    logMessage('Fatal Error', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

runDebate().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
