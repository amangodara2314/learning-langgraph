import { ChatGoogle } from "@langchain/google";
import "dotenv/config";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const model = new ChatGoogle("gemini-3.1-flash-lite", {
  apiKey: GOOGLE_API_KEY,
});

export default model;
