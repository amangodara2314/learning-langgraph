import {
  END,
  interrupt,
  MemorySaver,
  START,
  StateGraph,
  StateSchema,
  Command,
} from "@langchain/langgraph";

import * as z from "zod";

const State = new StateSchema({
  action: z.string(),
  userId: z.string(),
});

const checkpointer = new MemorySaver();

const deleteUserAccount = async (state) => {
  console.log(`Deleting account for user: ${state.userId}`);
};

const generateAction = async (state) => {
  return {
    action: "Delete my account",
    userId: "ABC123",
  };
};

const askForApproval = async (state) => {
  const answer = interrupt({
    action: state.action,
    userId: state.userId,
    message: "Do you approve deleting this account?",
  });

  if (answer.approved) {
    return new Command({
      goto: "deleteUserAccount",
      update: {
        action: "Account deletion approved",
      },
    });
  }

  return new Command({
    goto: END,
    update: {
      action: "Account deletion cancelled",
    },
  });
};

const graph = new StateGraph(State)
  .addNode("generateAction", generateAction)
  .addNode("askForApproval", askForApproval)
  .addNode("deleteUserAccount", deleteUserAccount)

  .addEdge(START, "generateAction")
  .addEdge("generateAction", "askForApproval")
  .addEdge("askForApproval", "deleteUserAccount")
  .addEdge("deleteUserAccount", END)

  .compile({
    checkpointer,
  });

const config = {
  configurable: {
    thread_id: "test-1",
  },
};

const result = await graph.invoke(
  {
    action: "",
    userId: "",
  },
  config,
);

console.log(result);

const result2 = await graph.invoke(
  new Command({
    resume: {
      approved: true,
    },
  }),
  config,
);

console.log(result2);
