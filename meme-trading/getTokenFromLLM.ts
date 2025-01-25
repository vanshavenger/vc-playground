import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { SYSTEM_INSTRUCTION } from "./constants";

const TokenSchema = z.object({
  result: z.string(),
  type: z.enum(["ADDRESS", "NAME", "NONE"]),
});

export async function extractToken(text: string) {
  const model = google("gemini-2.0-flash-exp", {
    safetySettings: [
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_LOW_AND_ABOVE",
      },
    ],
    structuredOutputs: true,
  });

  try {
    const result = await generateObject({
      model,
      schema: TokenSchema,
      system: SYSTEM_INSTRUCTION,
      prompt: text,
    });

    return result.object;
  } catch (error) {
    console.error("Error extracting token:", error);
    return { result: "ERROR_PROCESSING", type: "NONE" };
  }
}
