import { Command, MemorySaver, StateSchema } from "@langchain/langgraph";
import { getAgent, model } from "./config/llm.js";
import * as z from "zod";
import { humanInTheLoopMiddleware, tool } from "langchain";
import readline from "readline/promises";

const agentState = new StateSchema({
  userId: z.string(),
});

const deleteUserAccount = tool(
  async (_, runtime) => {
    const userId = runtime.state.userId;
    console.log(`Deleting account for user: ${userId}`);
    return `Account for user ${userId} deleted successfully.`;
  },
  {
    name: "delete_user_account_tool",
    description: "Delete a user account by user ID",
    schema: z.object({}),
  },
);

const getUserProfile = tool(
  async (_, runtime) => {
    const userId = runtime.state.userId;
    console.log(`Getting profile for user: ${userId}`);
    const userProfile = {
      name: "John Doe",
      email: "john.doe@example.com",
    };
    return userProfile;
  },
  {
    name: "get_user_profile_tool",
    description: "Get the profile of a user by user ID",
    schema: z.object({}),
  },
);

const tools = [deleteUserAccount, getUserProfile];

const checkpointer = new MemorySaver();

const agent = await getAgent({
  model: model,
  tools: tools,
  checkpointer,
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        get_user_profile_tool: false,

        delete_user_account_tool: {
          allowedDecisions: ["approve", "reject"],
          description: "Deleting user account needs approval",
        },
      },
      descriptionPrefix: "Tool execution pending approval",
    }),
  ],
  stateSchema: agentState,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

while (true) {
  const userPrompt = await rl.question(">> ");

  const result = await agent.invoke(
    {
      messages: [{ role: "user", content: userPrompt }],
      userId: "abc123",
    },
    {
      configurable: {
        thread_id: "abc123",
      },
    },
  );

  if (result.__interrupt__) {
    console.log("Human approval required:");
    const ans = await rl.question("Approve or Reject >>");
    if (ans.toLowerCase() == "approve") {
      console.log("...confirmed");
      await agent.invoke(
        new Command({
          resume: {
            decisions: [{ type: "approve" }],
          },
        }),
        {
          configurable: {
            thread_id: "abc123",
          },
        },
      );
    }

    continue;
  }

  console.log("AI :", result.messages[result.messages.length - 1].content);
}
