
import { createResponse, createTxtAnswer, type DnsResponseMessage, startUdpServer, } from "denamed"
import {GoogleGenerativeAI} from "@google/generative-ai"

const API_KEY = Bun.env.API
if (!API_KEY) {
    throw new Error('API key is required')
}

const genai = new GoogleGenerativeAI(API_KEY!)
const model = genai.getGenerativeModel({
    model: "gemini-1.5-flash"
})

startUdpServer(async (query) => {
    console.log(query)
    if (!query.questions?.length) {
        throw new Error('No questions in DNS query')
    }
    const question = query.questions[0]
    const prompt = `
    Answeer the question in one word or sentence
    Question: ${question.name.split('.').join(' ')}`

    const res = await model.generateContent(prompt)

    const response = res.response.text().trim()

    return createResponse(query, [createTxtAnswer(question, response)]) as DnsResponseMessage
}, {
    port: 8000
})

