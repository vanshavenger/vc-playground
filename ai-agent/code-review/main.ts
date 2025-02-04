import fs from 'fs/promises'
import { parallelCodeReview } from './parallelCodeReview'

const main = async () => {
	try {
		const code = await fs.readFile('code.txt', 'utf-8')

		console.log('Starting code review process...')
		const { reviews, summary, language } = await parallelCodeReview(code)

		console.log(`\nDetected Language: ${language}`)
		console.log('==========================\n')

		console.log('Code Review Results:')
		console.log('====================')
		for (const [type, review] of Object.entries(reviews)) {
			console.log(`\n${type.toUpperCase()} REVIEW:`)
			console.log('----------------')
			console.log(JSON.stringify(review, null, 2))
			console.log('----------------\n')
		}

		if (summary) {
			console.log('EXECUTIVE SUMMARY:')
			console.log('==================')
			console.log(summary)
		} else {
			console.log('Failed to generate an executive summary.')
		}

		console.log('\nCode review process completed.')
	} catch (error) {
		console.error('An error occurred during the code review process:', error)
	}
}

main()
