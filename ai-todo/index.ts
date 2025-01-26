import { SYSTEM_PROMPT } from './constants'
import {
  bulkCreateTodos,
  createTodo,
  deleteCompletedTodos,
  deleteTodo,
  getAllTodos,
  getTodoById,
  getTodosCompletedInRange,
  getTodosCount,
  getTodosCreatedInRange,
  getTodosUpdatedAfter,
  searchTodosByTitle,
  toggleTodoCompletion,
  updateTodo,
} from './tools'
import { google } from '@ai-sdk/google'
import { generateObject, type CoreMessage } from 'ai'
import readline from 'readline-sync'

const tools = {
  bulkCreateTodos: bulkCreateTodos,
  createTodo: createTodo,
  deleteCompletedTodos: deleteCompletedTodos,
  deleteTodo: deleteTodo,
  getAllTodos: getAllTodos,
  getTodoById: getTodoById,
  getTodosCompletedInRange: getTodosCompletedInRange,
  getTodosCount: getTodosCount,
  getTodosCreatedInRange: getTodosCreatedInRange,
  getTodosUpdatedAfter: getTodosUpdatedAfter,
  searchTodosByTitle: searchTodosByTitle,
  toggleTodoCompletion: toggleTodoCompletion,
  updateTodo: updateTodo,
}

const model = google('gemini-2.0-flash-exp', {
  structuredOutputs: true,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_ONLY_HIGH',
    },
  ],
})

const messages: CoreMessage[] = [
  {
    role: 'system',
    content: SYSTEM_PROMPT,
  },
]

while (true) {
  const query = readline.question('>> ')
  const userMessage = {
    type: 'user',
    user: query,
  }
  messages.push({
    role: 'user',
    content: JSON.stringify(userMessage),
  })

  while (true) {
    const { object } = await generateObject({
      model,
      messages: messages,
      output: 'no-schema',
    })
    messages.push({
      role: 'assistant',
      content: JSON.stringify(object),
    })

    const action = object

    // @ts-expect-error - This is a valid check
    if (action?.type === 'output') {
      // @ts-expect-error - This is a valid check
      console.log(action?.output)
      break
      // @ts-expect-error - This is a valid check
    } else if (action.type === 'action') {
      // @ts-expect-error - This is a valid check
      const fn = tools[action.function]
      if (!fn) {
        // @ts-expect-error - This is a valid check
        throw new Error(`Function ${action.function} not found`)
      }
      // @ts-expect-error - This is a valid check
      const observation = await fn(action.input)
      const observationMessage = {
        type: 'observation',
        observation: observation,
      }
      messages.push({
        role: 'assistant',
        content: JSON.stringify(observationMessage),
      })
    }
  }
}
