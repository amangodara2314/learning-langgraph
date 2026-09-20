import { StateSchema, StateGraph, START, END } from "@langchain/langgraph";
import * as z from "zod";

const state = new StateSchema({
  number: z.number(),
});

const addNumber = async (state) => {
  return {
    number: state.number + 10,
  };
};

// const multiplyByTwo = async (state) => {
//   return {
//     number: state.number * 2,
//   };
// };

const route = (state) => {
  if (state.number >= 80) {
    return END;
  }

  return "addNumber";
};

const graph = new StateGraph(state)
  .addNode("addNumber", addNumber)
  .addEdge(START, "addNumber")
  .addConditionalEdges("addNumber", route)
  .compile();

const result = await graph.invoke({ number: 0 });

console.log(result);
