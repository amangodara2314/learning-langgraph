import { stdin, stdout } from "process";
import {
  StateSchema,
  StateGraph,
  END,
  START,
  MessagesValue,
} from "@langchain/langgraph";
import readline from "readline/promises";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import model from "./config/llm.js";

const State = new StateSchema({
  messages: MessagesValue,
});

const callLlm = async (prompt) => {
  const response = await model.invoke(prompt);
  return response;
};

const rl = readline.createInterface({ input: stdin, output: stdout });

const addUserMessage = async (state) => {
  const message = await rl.question(">>");
  const humanMessage = new HumanMessage(message);
  return {
    messages: [humanMessage],
  };
};

const addAssistantMessage = async (state) => {
  const aiMessage = await callLlm(state.messages);
  console.log("AI:", aiMessage.content);
  return {
    messages: [aiMessage],
  };
};

const graph = new StateGraph(State)
  .addNode("addUserMessage", addUserMessage)
  .addNode("addAssistantMessage", addAssistantMessage)
  .addEdge(START, "addUserMessage")
  .addEdge("addUserMessage", "addAssistantMessage")
  .addEdge("addAssistantMessage", "addUserMessage")
  .compile();

const result = await graph.invoke({ messages: [] });
console.log(result);
