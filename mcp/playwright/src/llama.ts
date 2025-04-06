import { groq } from '@ai-sdk/groq'
import { generateText, experimental_createMCPClient } from 'ai'
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio'

interface GenerateGamingRecipeOptions {
  servings?: number
  dietary?: string
  dishType: string
  gameName?: string
  gameGenre?: string
}

const model = groq('meta-llama/llama-4-scout-17b-16e-instruct')

const generateGamingRecipe = async ({
  servings = 4,
  dietary = 'vegetarian',
  dishType,
  gameName = 'Minecraft',
  gameGenre = 'sandbox',
}: GenerateGamingRecipeOptions): Promise<string> => {
  try {
    const transport = new Experimental_StdioMCPTransport({
      command: 'npx',
      args: ['@playwright/mcp@latest'],
    })

    const mcpClient = await experimental_createMCPClient({
      transport,
    })

    const prompt = `Create a ${gameGenre} gaming-themed ${dietary} ${dishType} recipe for ${servings} people, inspired by ${gameName}. 
    Make it fun and reference game elements in both ingredients and instructions.
    Include:
    1. A creative game-themed name
    2. Ingredients list with gaming references
    3. Step-by-step instructions using gaming terminology`

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.8,
      maxTokens: 1500,
    })

    await mcpClient.close()
    return text
  } catch (error) {
    console.error('Error generating gaming recipe:', error)
    throw new Error(
      `Failed to generate gaming recipe: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

const main = async () => {
  try {
    const recipes = [
      {
        dishType: 'pizza',
        gameName: 'Super Mario',
        gameGenre: 'platformer',
      },
      {
        dishType: 'burger',
        gameName: 'Minecraft',
        gameGenre: 'sandbox',
        servings: 2,
      },
      {
        dishType: 'power-up smoothie',
        gameName: 'The Legend of Zelda',
        gameGenre: 'action-adventure',
        dietary: 'vegan',
      },
    ]

    for (const recipe of recipes) {
      console.log(
        `\n=== Generating ${recipe.gameName} inspired ${
          recipe.dietary || 'vegetarian'
        } ${recipe.dishType} recipe ===\n`
      )
      const text = await generateGamingRecipe(recipe)
      console.log(text)
      console.log('\n' + '='.repeat(50) + '\n')
    }
  } catch (error) {
    console.error('Main execution failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
