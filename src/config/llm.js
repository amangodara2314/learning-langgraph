import { ChatGoogle } from "@langchain/google";
import { createAgent } from "langchain";

import "dotenv/config";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export const model = new ChatGoogle("gemini-3.1-flash-lite", {
  apiKey: GOOGLE_API_KEY,
});

const callLlm = async (prompt) => {
  const response = await model.invoke(prompt);
  return response;
};

export const getModelWithTools = (tools) => {
  return model.bindTools(tools);
};

export const getAgent = async ({
  model,
  tools,
  middleware,
  checkpointer,
  stateSchema,
}) => {
  return createAgent({
    model,
    tools,
    middleware,
    checkpointer,
    stateSchema,
  });
};

export default callLlm;
