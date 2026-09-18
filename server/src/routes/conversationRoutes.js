import { Router } from "express";
import * as conversations from "../controllers/conversationController.js";
import { sendMessage } from "../controllers/messageController.js";
import { messageRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.post("/", conversations.create);
router.get("/", conversations.list);
router.get("/:id", conversations.getOne);
router.delete("/:id", conversations.remove);
router.post("/:id/messages", messageRateLimit, sendMessage);

export default router;
