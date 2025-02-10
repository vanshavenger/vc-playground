import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const multiply = tool(
  async ({ a, b }) => {
    return a * b;
  },
  {
    name: "multiply",
    description: "Multiply two numbers",
    schema: z.object({
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    }),
  },
);

export const divide = tool(
  async ({ a, b }) => {
    return a / b;
  },
  {
    name: "divide",
    description: "Divide two numbers",
    schema: z.object({
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    }),
  },
);


export const add = tool(
    async ({ a, b }) => {
        return a + b;
    },
    {
        name: "add",
        description: "Add two numbers",
        schema: z.object({
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
        }),
    },
);
    
export const subtract = tool(
    async ({ a, b }) => {
        return a - b;
    },
    {
        name: "subtract",
        description: "Subtract two numbers",
        schema: z.object({
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
        }),
    },
);

const tools = [multiply, divide, add, subtract];
export const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));