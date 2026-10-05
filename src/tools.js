import { tool } from "@langchain/core/tools";
import {
  MemorySaver,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from "@langchain/langgraph";
import getWeather from "./utils/getWeather.js";
import * as z from "zod";
import { getModelWithTools } from "./config/llm.js";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import readline from "readline/promises";
import { HumanMessage } from "@langchain/core/messages";

const State = new StateSchema({
  messages: MessagesValue,
  userId: z.string(),
});

const getWeatherTool = tool(
  async ({ city }, runtime) => {
    console.log("Getting weather for city:", city);
    console.log("Runtime:", runtime);
    return await getWeather(city);
  },
  {
    name: "get_weather_tool",
    description: "Get current weather of any city",
    schema: z.object({
      city: z.string().describe("Name of the city to get the weather for"),
    }),
  },
);

const tools = [getWeatherTool, deleteUserAccount];
const model = getModelWithTools(tools);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const userMessage = async (state) => {
  const message = await rl.question(">> ");
  const humanMessage = new HumanMessage(message);

  return {
    messages: [humanMessage],
  };
};

const agentMessage = async (state) => {
  const agentResponse = await model.invoke(state.messages);

  return {
    messages: [agentResponse],
  };
};

const toolNode = new ToolNode(tools);

const checkpointer = new MemorySaver();

const config = { configurable: { thread_id: "123" } };

const graph = new StateGraph(State)
  .addNode("agent", agentMessage)
  .addNode("prompt", userMessage)
  .addNode("tools", toolNode)
  .addEdge(START, "prompt")
  .addEdge("prompt", "agent")
  .addConditionalEdges("agent", toolsCondition)
  .addEdge("tools", "agent")
  .compile({ checkpointer });

while (true) {
  const result = await graph.invoke({ messages: [] }, config);
  console.log("AI :", result.messages[result.messages.length - 1].content);
}
