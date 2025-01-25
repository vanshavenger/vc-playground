import { GoogleGenerativeAI }  from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(Bun.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
