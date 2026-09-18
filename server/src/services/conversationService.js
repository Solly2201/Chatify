import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

// In-memory store for temporary chats (never persisted to MongoDB).
const tempStore = new Map();

export function isValidId(id) {
  return typeof id === "string" && (tempStore.has(id) || mongoose.isValidObjectId(id));
}

export function deriveTitle(firstMessage) {
  const clean = firstMessage.replace(/\s+/g, " ").trim().replace(/[?.!,;:]+$/, "");
  return clean.length > 50 ? clean.slice(0, 47) + "..." : clean || "New Chat";
}

export async function createConversation({ tone = "casual", temporary = false }) {
  if (temporary) {
    const id = "temp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    const convo = {
      _id: id,
      title: "Temporary Chat",
      tone,
      temporary: true,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    tempStore.set(id, convo);
    return convo;
  }
  return Conversation.create({ tone, temporary: false });
}

export async function listConversations() {
  return Conversation.find({}, { messages: 0 }).sort({ updatedAt: -1 }).lean();
}

export async function getConversation(id) {
  if (tempStore.has(id)) return tempStore.get(id);
  return Conversation.findById(id);
}

export async function deleteConversation(id) {
  if (tempStore.has(id)) return tempStore.delete(id);
  return Conversation.findByIdAndDelete(id);
}

export async function saveConversation(convo) {
  if (convo.temporary) {
    convo.updatedAt = new Date();
    return convo;
  }
  return convo.save();
}
