import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
	sendMessage,
	getMessages,
	getConversations,
	markAsRead,
	deleteMessage,
	canMessageUser,
} from "../controllers/message.controller.js";

const router = express.Router();

router.post("/send/:receiverId", protectRoute, sendMessage);
router.get("/conversations", protectRoute, getConversations);
router.get("/can-message/:userId", protectRoute, canMessageUser);
router.get("/:conversationId", protectRoute, getMessages);
router.patch("/read/:messageId", protectRoute, markAsRead);
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;
