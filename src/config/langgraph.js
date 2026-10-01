import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

const client = new MongoClient(process.env.MONGODB_URI);

export const connectLangGraphDb = async () => {
  await client.connect;
  console.log("LangGraph MongoDB client connected");
};

export const checkpointer = new MongoDBSaver({
  client,
});
