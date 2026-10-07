import { stdin, stdout } from "process";
import {
  StateSchema,
  StateGraph,
  END,
  START,
  MessagesValue,
  MemorySaver,
} from "@langchain/langgraph";
import readline from "readline/promises";
import { HumanMessage } from "@langchain/core/messages";
import callLlm from "./config/llm.js";

const State = new StateSchema({
  messages: MessagesValue,
});

const addAssistantMessage = async (state) => {
  const aiMessage = await callLlm(state.messages);
  return {
    messages: [aiMessage],
  };
};

const checkpointer = new MemorySaver();

const graph = new StateGraph(State)
  .addNode("addAssistantMessage", addAssistantMessage)
  .addEdge(START, "addAssistantMessage")
  .addEdge("addAssistantMessage", END)
  .compile({ checkpointer });

const rl = readline.createInterface({ input: stdin, output: stdout });
const config = { configurable: { thread_id: "test-1" } };

async function chat() {
  console.log("Starting new conversation... (type 'exit' to quit)");

  while (true) {
    const userInput = await rl.question(">> ");

    if (userInput.toLowerCase() === "exit") break;

    const stream = await graph.stream(
      { messages: [new HumanMessage(userInput)] },
      { ...config, streamMode: "messages" },
    );

    process.stdout.write("AI: ");

    for await (const [messageChunk] of stream) {
      if (messageChunk.content) {
        process.stdout.write(messageChunk.content);
      }
    }

    process.stdout.write("\n");
  }
  rl.close();
}

chat();
