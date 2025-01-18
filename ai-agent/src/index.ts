import { createAzure } from '@ai-sdk/azure'
import { type CoreMessage, generateText } from 'ai'
import 'dotenv/config'
import readline from 'readline-sync'
import type { Message, UserMessage, ActionMessage, Tools } from './types'

const azure = createAzure({
  baseURL: Bun.env.BASE_URL!,
  apiKey: Bun.env.API_KEY!,
  apiVersion: Bun.env.API_VERSION!,
})

const apiKey = Bun.env.OPENWEATHERMAP_API_KEY
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

const SYSTEM_PROMPT = `
You are an AI Assistant with START, PLAN, ACTION, Observation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, Return the AI response based on START prompt and observations.

Strictly follow the JSON Output format as in example.

Available Tools:
- function getWeatherDetails(location: string): number
getWeatherDetails is a function that accepts location name as string and returns the weather details of that location.

Example:
START
{ "type" : "user", "user" : "What is the sum of weather of Patiala and Ludhiana?" }
{ "type" : "plan", "plan" : "I will call the getWeatherDetails for Patiala" }
{ "type" : "action", "function" : "getWeatherDetails", "input" : "Patiala" }
{ "type" : "observation", "observation" : 25 }
{ "type" : "plan", "plan" : "I will call the getWeatherDetails for Ludhiana" }
{ "type" : "action", "function" : "getWeatherDetails", "input" : "Ludhiana" }
{ "type" : "observation", "observation" : 24 }
{ "type" : "output", "output" : "The sum of weather of Patiala and Ludhiana is 49" }
`

const getWeatherDetails = async (location: string): Promise<number> => {
  const formattedLocation =
    location.charAt(0).toUpperCase() + location.slice(1).toLowerCase()

  const url = `${API_BASE_URL}?q=${encodeURIComponent(
    formattedLocation,
  )}&units=metric&appid=${apiKey}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.main.temp
  } catch (error) {
    console.error('Error fetching weather data:', error)
    throw error
  }
}

const tools: Tools = {
  getWeatherDetails: getWeatherDetails,
}

const messages: Array<CoreMessage> = []

const isActionMessage = (message: Message): message is ActionMessage => {
  return message.type === 'action'
}

const main = async (): Promise<void> => {
  while (true) {
    const query: string = readline.question('>> ')
    const userMessage: UserMessage = {
      type: 'user',
      user: query,
    }

    messages.push({
      role: 'user',
      content: JSON.stringify(userMessage),
    })

    while (true) {
      const { text } = await generateText({
        model: azure('gpt4o', { structuredOutputs: true }),
        messages: messages,
        system: SYSTEM_PROMPT,
        // tools: {
        //   getWeatherDetails: tool({
        //     description:
        //       'getWeatherDetails is a function that accepts location name as string and returns the weather details of that location.',
        //     parameters: z.object({
        //       location: z.string(),
        //     }),
        //     execute: async ({ location }) => {
        //       return getWeatherDetails(location)
        //     },
        //   }),
        // },
      })

      messages.push({
        role: 'assistant',
        content: text,
      })

      const call = JSON.parse(text) as Message

      if (call.type === 'output') {
        console.log(call.output)
        break
      } else if (isActionMessage(call)) {
        const fn = tools[call.function]
        const observation = await fn(call.input)
        const obs = { type: 'observation' as const, observation: observation }
        messages.push({ role: 'assistant', content: JSON.stringify(obs) })
      }
    }
  }
}

main().catch((error) => {
  console.error('An error occurred:', error)
})
