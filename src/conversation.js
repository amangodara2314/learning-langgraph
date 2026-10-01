import {
  END,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from "@langchain/langgraph";
import * as z from "zod";
import callLlm from "./config/llm.js";
import { checkpointer } from "./config/langgraph.js";

const State = new StateSchema({
  messages: MessagesValue,
});

const assistantMessage = async (state) => {
  const response = await callLlm(state.messages);
  return {
    messages: [response],
  };
};

const graph = new StateGraph(State)
  .addNode("assistantMessage", assistantMessage)
  .addEdge(START, "assistantMessage")
  .addEdge("assistantMessage", END)
  .compile({ checkpointer });

export default graph;
