import { createAzure } from '@ai-sdk/azure'
import { generateText, generateObject } from 'ai'
import { z } from 'zod'
import 'dotenv/config'
import { detectLanguage } from './detectLanguage'

const azure = createAzure({
	apiKey: process.env.AZURE_API_KEY!,
	apiVersion: process.env.AZURE_API_VERSION!,
	baseURL: process.env.AZURE_BASE_URL!,
})

export async function parallelCodeReview(code: string) {
	const model = azure('gpt4o')
	const language = await detectLanguage(code)

	const [securityReview, performanceReview, maintainabilityReview] =
		await Promise.all([
			generateObject({
				model,
				system: `You are a senior security expert with 10+ years of experience in identifying and mitigating critical vulnerabilities in ${language} applications. Focus only on severe security issues that could lead to immediate exploitation or data breaches.`,
				schema: z.object({
					criticalVulnerabilities: z
						.array(z.string())
						.describe('List of critical or high-risk security vulnerabilities'),
					riskAssessment: z
						.string()
						.describe('Brief assessment of the overall security risk'),
					urgentFixes: z
						.array(z.string())
						.describe('Urgent fixes for critical vulnerabilities'),
				}),
				prompt: `Conduct a thorough security audit of the following ${language} code, focusing exclusively on critical and high-risk vulnerabilities:
1. Identify only the most severe security issues, providing specific line numbers and detailed explanations.
2. Assess the overall security risk, considering the potential impact and ease of exploitation.
3. Propose urgent, concrete fixes for each identified critical vulnerability.

Code to review:
${code}

Respond with a JSON object containing 'criticalVulnerabilities', 'riskAssessment', and 'urgentFixes'.

Example response for a JavaScript application:
{
  "criticalVulnerabilities": [
    "Severe SQL Injection vulnerability in user input processing (lines 78-85): The application directly concatenates user input into SQL queries without any sanitization.",
    "Exposed API keys and database credentials in plaintext (lines 12-18): Sensitive information is hardcoded in the source code, risking unauthorized access to critical systems."
  ],
  "riskAssessment": "The application has critical security flaws that pose an immediate and severe risk of data breach and unauthorized system access. The identified vulnerabilities could be easily exploited by attackers to gain full control of the system and access sensitive user data.",
  "urgentFixes": [
    "Implement parameterized queries or an ORM (e.g., Sequelize) to prevent SQL injection. Replace lines 78-85 with prepared statements.",
    "Move all sensitive information (API keys, database credentials) to environment variables or a secure key management system. Update lines 12-18 to use process.env to access these secrets."
  ]
}`,
			}),

			generateObject({
				model,
				system: `You are a performance optimization guru with extensive experience in profiling and optimizing ${language} applications. Focus only on critical performance bottlenecks and major memory usage issues that significantly impact application responsiveness or stability.`,
				schema: z.object({
					majorIssues: z
						.array(z.string())
						.describe('List of significant performance or memory usage issues'),
					performanceImpact: z
						.string()
						.describe('Assessment of the overall performance impact'),
					criticalOptimizations: z
						.array(z.string())
						.describe(
							'Critical optimizations to address major performance issues'
						),
				}),
				prompt: `Conduct a comprehensive performance analysis of the following ${language} code, identifying only the most critical performance and memory usage issues:
1. Pinpoint severe performance bottlenecks and memory leaks, providing specific line numbers and detailed explanations.
2. Assess the overall impact on application performance and stability.
3. Propose critical, implementable optimizations to address each major issue identified.

Code to review:
${code}

Respond with a JSON object containing 'majorIssues', 'performanceImpact', and 'criticalOptimizations'.

Example response for a Python application:
{
  "majorIssues": [
    "Exponential time complexity in recursive function (lines 45-60): The current implementation of the Fibonacci sequence calculation has a time complexity of O(2^n), causing severe performance degradation for larger inputs.",
    "Memory leak in file handling (lines 102-120): The code opens file handles in a loop without properly closing them, leading to resource exhaustion over time."
  ],
  "performanceImpact": "The identified issues cause exponential slowdown for certain operations and gradual memory exhaustion, severely impacting application responsiveness and stability. Under moderate load, the application is likely to become unresponsive or crash.",
  "criticalOptimizations": [
    "Implement dynamic programming or memoization in the Fibonacci function to reduce time complexity from O(2^n) to O(n). Replace the recursive implementation with an iterative approach using a dictionary to store previously computed values.",
    "Use a context manager (with statement) for file handling to ensure proper closure of file handles. Refactor the file processing loop to open and close files for each iteration, or process files in batches to limit the number of open handles."
  ]
}`,
			}),

			generateObject({
				model,
				system: `You are a senior software architect specializing in clean code practices and software design patterns for ${language}. Focus only on major code quality issues that significantly impair maintainability, readability, and extensibility of the codebase.`,
				schema: z.object({
					majorConcerns: z
						.array(z.string())
						.describe('List of major code quality concerns'),
					maintainabilityImpact: z
						.string()
						.describe(
							'Assessment of the overall impact on code maintainability'
						),
					keyImprovements: z
						.array(z.string())
						.describe('Key improvements to address major code quality issues'),
				}),
				prompt: `Perform a thorough code quality assessment of the following ${language} code, focusing on critical maintainability and readability issues:
1. Identify major violations of clean code principles and design patterns, providing specific line numbers and detailed explanations.
2. Assess the overall impact on code maintainability, readability, and extensibility.
3. Propose key, high-impact improvements to address each major code quality issue identified.

Code to review:
${code}

Respond with a JSON object containing 'majorConcerns', 'maintainabilityImpact', and 'keyImprovements'.

Example response for a Java application:
{
  "majorConcerns": [
    "Massive 'God' class violating Single Responsibility Principle (UserManager.java, 1000+ lines): This class handles user authentication, profile management, email notifications, and data persistence, making it extremely difficult to maintain and test.",
    "Excessive use of deep nesting and complex conditional logic (OrderProcessor.java, lines 150-300): The order processing method contains nested conditionals up to 6 levels deep, severely impacting readability and making the business logic hard to follow and modify."
  ],
  "maintainabilityImpact": "The codebase suffers from severe maintainability issues due to violations of SOLID principles and overly complex implementations. These problems significantly increase the risk of introducing bugs during modifications and make it extremely challenging to extend or refactor the application.",
  "keyImprovements": [
    "Refactor the UserManager class into smaller, focused classes adhering to the Single Responsibility Principle. Create separate classes for authentication, profile management, notifications, and data persistence. Use dependency injection to manage relationships between these classes.",
    "Apply the Strategy pattern to refactor the complex conditional logic in OrderProcessor. Extract each major branch of the conditional into a separate strategy class, and use a factory to instantiate the appropriate strategy based on the order type or conditions."
  ]
}`,
			}),
		])

	const reviews = [
		{ ...securityReview.object, type: 'security' },
		{ ...performanceReview.object, type: 'performance' },
		{ ...maintainabilityReview.object, type: 'maintainability' },
	]

	const { text: summary } = await generateText({
		model,
		system: `You are a seasoned technical lead with 15+ years of experience in secure, high-performance, and maintainable ${language} application development. Your task is to synthesize critical code review findings and provide actionable, high-priority recommendations.`,
		prompt: `Analyze and summarize the following ${language} code review results, focusing exclusively on the most critical issues and highest-priority improvements:
1. Identify the top 3 most severe issues across all review categories (security, performance, and code quality), explaining their potential impact on the application.
2. Propose the top 3 highest-priority improvements that must be implemented immediately, providing a brief justification for each.
3. Deliver a concise yet comprehensive risk assessment of the codebase, considering security vulnerabilities, performance bottlenecks, and maintainability challenges.

Review results:
${JSON.stringify(reviews, null, 2)}

Provide a summary containing sections for 'Critical Issues', 'Urgent Improvements', and 'Risk Assessment'. Each section should be detailed yet concise, offering clear and actionable insights.

Example response for a Node.js/Express.js application:

Critical Issues:
1. Remote Code Execution Vulnerability (Security): A critical RCE vulnerability exists in the user input processing module, allowing attackers to execute arbitrary code on the server. This poses an immediate and severe threat to the entire application and its data.
2. O(n^3) Time Complexity in Data Processing (Performance): The main data processing algorithm has a time complexity of O(n^3), causing exponential slowdown for larger datasets. This severely impacts application responsiveness and may lead to timeouts or crashes under moderate load.
3. Monolithic Architecture with Poor Separation of Concerns (Code Quality): The application is structured as a monolithic "God" module, violating SOLID principles and making the codebase extremely difficult to maintain, test, and extend.

Urgent Improvements:
1. Implement Input Sanitization and Validation: Immediately integrate a robust input sanitization library (e.g., DOMPurify) and implement strict input validation to prevent the RCE vulnerability. This is crucial to prevent potential system compromise and data breaches.
2. Optimize Data Processing Algorithm: Refactor the data processing algorithm to reduce time complexity, potentially using indexing or caching mechanisms. This improvement is essential to ensure the application remains responsive under various load conditions.
3. Begin Architectural Refactoring: Start breaking down the monolithic structure into smaller, focused modules following the Single Responsibility Principle. Prioritize extracting critical components like authentication and data processing into separate services.

Risk Assessment:
The ${language} codebase presents severe and immediate risks across multiple dimensions. The critical security vulnerability exposes the system to potential complete compromise, posing an existential threat to the application and its data. Severe performance issues may render the application unusable under real-world conditions, risking service outages and user abandonment. The poor code structure and violation of software design principles create a high risk of introducing new bugs and make it extremely challenging to maintain or extend the application. Immediate, focused action is required to address these high-priority issues to mitigate risks and improve the overall health of the application.`,
	})

	return { reviews, summary, language }
}
