import { Command, MemorySaver, StateSchema } from "@langchain/langgraph";
import { getAgent, model } from "./config/llm.js";
import * as z from "zod";
import { humanInTheLoopMiddleware, tool } from "langchain";
import readline from "readline/promises";

const agentState = new StateSchema({
  userId: z.string(),
});

const deleteUserAccount = tool(
  async ({ userId }, runtime) => {
    console.log(`Deleting account for user: ${userId}`);
    return `Account for user ${userId} deleted successfully.`;
  },
  {
    name: "delete_user_account_tool",
    description: "Delete a user account by user ID",
    schema: z.object({
      userId: z.string().describe("ID of the user account to delete"),
    }),
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
          allowedDecisions: ["approve", "reject", "edit"],
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

const config = {
  configurable: {
    thread_id: "abc123",
  },
};

while (true) {
  const userPrompt = await rl.question(">> ");

  const result = await agent.invoke(
    {
      messages: [{ role: "user", content: userPrompt }],
      userId: "abc123",
    },
    config,
  );

  if (result.__interrupt__) {
    const answer = await rl.question("Approve / Edit / Reject >> ");

    let decision;

    if (answer.toLowerCase() === "approve") {
      decision = {
        type: "approve",
      };
    }

    if (answer.toLowerCase() === "edit") {
      const newUserId = await rl.question("New user ID >> ");

      decision = {
        type: "edit",
        editedAction: {
          name: "delete_user_account_tool",
          args: {
            userId: newUserId,
          },
        },
      };
    }

    if (answer.toLowerCase() === "reject") {
      decision = {
        type: "reject",
        message: "Account deletion rejected by human.",
      };
    }

    await agent.invoke(
      new Command({
        resume: {
          decisions: [decision],
        },
      }),
      config,
    );

    continue;
  }

  console.log("AI :", result.messages[result.messages.length - 1].content);
}
