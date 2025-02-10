import { AzureChatOpenAI } from "@langchain/openai";

export const model = new AzureChatOpenAI({
  temperature: 0.9,
  azureOpenAIApiKey: "<your_key>", 
  azureOpenAIApiInstanceName: "<your_instance_name>", 
  azureOpenAIApiDeploymentName: "<your_deployment_name>", 
  azureOpenAIApiVersion: "<api_version>", 
});