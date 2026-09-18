import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    title: { type: String, default: "New Chat" },
    tone: {
      type: String,
      enum: ["professional", "casual", "concise", "straightforward"],
      default: "casual"
    },
    temporary: { type: Boolean, default: false },
    messages: [messageSchema]
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
