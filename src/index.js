import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Conversation from "./models/conversation.model.js";
import Message from "./models/message.model.js";
import graph from "./conversation.js";
import { connectLangGraphDb } from "./config/langgraph.js";
dotenv.config();

const app = express();

app.use(express.json());

app.post("/conversation", async (req, res) => {
  const { message } = req.body;

  const conversation = await Conversation.create({});

  await Message.create({
    content: message,
    role: "user",
    conversationId: conversation._id,
  });

  const id = conversation._id.toString();

  const config = { configurable: { thread_id: id } };
  const result = await graph.invoke(
    { messages: [{ role: "user", content: message }] },
    config,
  );

  console.log(
    "AI response:",
    result.messages[result.messages.length - 1].content,
  );

  await Message.create({
    content: result.messages[result.messages.length - 1].content,
    role: "assistant",
    conversationId: conversation._id,
  });

  return res.json({
    conversationId: conversation._id,
    userMessage: message,
    aiResponse: result.messages[result.messages.length - 1].content,
  });
});

app.post("/conversation/:id/message", async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  await Message.create({
    content: message,
    role: "user",
    conversationId: conversation._id,
  });

  const config = { configurable: { thread_id: conversation._id.toString() } };
  const result = await graph.invoke(
    { messages: [{ role: "user", content: message }] },
    config,
  );

  console.log(
    "AI response:",
    result.messages[result.messages.length - 1].content,
  );

  await Message.create({
    content: result.messages[result.messages.length - 1].content,
    role: "assistant",
    conversationId: conversation._id,
  });

  return res.json({
    conversationId: conversation._id,
    userMessage: message,
    aiResponse: result.messages[result.messages.length - 1].content,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  console.log("Error:", err.message);
  res.status(500).send("Something went wrong!");
});

app.listen(process.env.PORT || 3000, async () => {
  await connectLangGraphDb();
  await connectDB();
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
