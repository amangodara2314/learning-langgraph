import mongoose from "mongoose";

const conversationModel = new mongoose.Schema(
  {
    title: String,
  },
  {
    timestamps: true,
  },
);

const Conversation = mongoose.model("Conversation", conversationModel);

export default Conversation;
