import * as store from "../services/conversationService.js";
import { SUPPORTED_TONES } from "../services/aiService.js";

export async function create(req, res, next) {
  try {
    const { tone = "casual", temporary = false } = req.body || {};
    if (!SUPPORTED_TONES.includes(tone)) {
      return res.status(400).json({ error: "Invalid tone" });
    }
    const convo = await store.createConversation({ tone, temporary: !!temporary });
    res.status(201).json(convo);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    res.json(await store.listConversations());
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    if (!store.isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    const convo = await store.getConversation(req.params.id);
    if (!convo) return res.status(404).json({ error: "Conversation not found" });
    res.json(convo);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    if (!store.isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    await store.deleteConversation(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
