import { createAzure } from '@ai-sdk/azure'
import type { CoreMessage, Message } from 'ai'
import { ollama } from 'ollama-ai-provider'

export const deepseek = ollama('deepseek-r1:8b')
export const azure = createAzure({
  apiVersion: '2024-10-21',
})

export type Messages = CoreMessage[] | Omit<Message, 'id'>[] | undefined
export type ModelClient = (message: string) => Promise<string>

export const cleanText = (text: string): string => {
  const thinkTagRegex = /<Thinking>[\s\S]*?<\/think>/g
  return text.replace(thinkTagRegex, '').trim()
}

export const logMessage = (source: string, message: string): void => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${source}: ${message}\n\n`)
}

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export const withRetry = async <T>(
  fn: () => Promise<T>,
  attempts: number,
  delay: number
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (attempts <= 1) throw error

    logMessage('Retry', `Attempt failed. Retrying in ${delay}ms... (${attempts - 1} attempts left)`)
    await sleep(delay)
    return withRetry(fn, attempts - 1, delay)
  }
}
