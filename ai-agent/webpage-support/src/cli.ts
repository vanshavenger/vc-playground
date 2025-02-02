import readline from 'readline'
import { handleChatRequest } from './chat'

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

const startChatCLI = () => {
	rl.question('Q: ', async (question) => {
		if (question.toLowerCase() === 'exit') {
			console.log('Goodbye!')
			rl.close()
			return
		}

		try {
			const response = await handleChatRequest(question)
			console.log(`A: ${response}\n`)
		} catch (error) {
			console.error('Error:', error)
		}

		startChatCLI()
	})
}

console.log('Welcome to the AI Chat CLI!')
console.log('Ask questions about the vansh chopra or type "exit" to quit.\n')

startChatCLI()
