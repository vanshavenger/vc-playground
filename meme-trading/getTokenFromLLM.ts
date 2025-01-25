import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const SYSTEM_INSTRUCTION = `
You are a specialized token extractor for cryptocurrency-related content, including tweets. Your task is to analyze the given text and extract either a Token Address or a Token Name from a URL. Follow these rules strictly:

1. If you find a Token Address (a string of alphanumeric characters that looks like a blockchain address, typically 32-64 characters long), extract and output only the Token Address. It may or may not start with '0x'.
2. If you find a Token URL (a URL specifically related to a token), extract and output only the Token Name from it.
3. If you find both a Token Address and a Token URL, prioritize the Token Address.
4. Ignore usernames (starting with @), retweet indicators (RT @username:), and token symbols (like $BTC, $ETH).
5. If you don't find a valid Token Address or Token Name from a URL, output "NO_TOKEN_FOUND".

Ensure your output is exactly as specified without any additional text or explanations.

Here are some examples:

Input: "Check out this new token at 0x1234567890abcdef1234567890abcdef12345678"
Output: { "result": "0x1234567890abcdef1234567890abcdef12345678", "type": "ADDRESS" }

Input: "The latest DeFi project can be found at https://example.com/tokens/awesome-token"
Output: { "result": "awesome-token", "type": "NAME" }

Input: "This text doesn't contain any token information."
Output: { "result": "NO_TOKEN_FOUND", "type": "NONE" }

Input: "Token address 1234567890abcdef1234567890abcdef12345678 and URL https://token.com/super-token"
Output: { "result": "1234567890abcdef1234567890abcdef12345678", "type": "ADDRESS" }

Input: "RT @SrPetersETH: @0xSrMessi @Bitfrogonsol i can't believe $BTC is not at 10m cap."
Output: { "result": "NO_TOKEN_FOUND", "type": "NONE" }

Input: "Just bought some $ETH and $DOGE! To the moon! 🚀"
Output: { "result": "NO_TOKEN_FOUND", "type": "NONE" }

Input: "@cryptoexpert: The new $DEFI token is launching at https://defitoken.com/launch"
Output: { "result": "defitoken", "type": "NAME" }

Input: "New token alert: bnb1w9qlvzm8wr7dsfyprpkzgcjf89qzwdf2ry7f7p on Binance Smart Chain!"
Output: { "result": "bnb1w9qlvzm8wr7dsfyprpkzgcjf89qzwdf2ry7f7p", "type": "ADDRESS" }
`;

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
