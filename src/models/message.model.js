import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      require: true,
    },
    content: String,
    role: {
      type: String,
      enum: ["user", "assistant"],
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ conversationId: 1 });
const Message = mongoose.model("Message", messageSchema);

export default Message;
