import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { v2 as cloudinary } from "cloudinary";

export const sendMessage = async (req, res) => {
	try {
		const { message, image } = req.body;
		const { receiverId } = req.params;
		const senderId = req.user._id;

		// Kiểm tra người nhận có tồn tại
		const receiver = await User.findById(receiverId);
		if (!receiver) {
			return res.status(404).json({ error: "User not found" });
		}

		// Kiểm tra sender
		const sender = await User.findById(senderId);
		if (!sender) {
			return res.status(404).json({ error: "Sender not found" });
		}

		// Kiểm tra xem cả hai có follow nhau không
		const senderFollowsReceiver = sender.following.includes(receiverId);
		const receiverFollowsSender = receiver.following.includes(senderId);

		if (!senderFollowsReceiver || !receiverFollowsSender) {
			return res.status(403).json({ 
				error: "You can only message users who follow you back" 
			});
		}

		// Tìm hoặc tạo conversation
		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
			});
		}

		let imageUrl = null;
		let messageType = "text";

		// Xử lý upload image nếu có
		if (image) {
			const uploadedResponse = await cloudinary.uploader.upload(image, {
				folder: "message_images"
			});
			imageUrl = uploadedResponse.secure_url;
			messageType = "image";
		}

		// Tạo message mới
		const newMessage = new Message({
			senderId,
			receiverId,
			message: imageUrl ? "" : (message || ""),
			messageType,
			...(imageUrl && { image: imageUrl }),
		});

		// Cập nhật conversation
		conversation.lastMessage = newMessage._id;
		conversation.lastMessageTime = new Date();

		// Lưu đồng thời
		await Promise.all([newMessage.save(), conversation.save()]);

		// Populate sender info
		await newMessage.populate("senderId", "username fullName profileImg");

		// Socket.IO - gửi tin nhắn real-time
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

		res.status(201).json(newMessage);
	} catch (error) {
		console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { conversationId } = req.params;
		const userId = req.user._id;

		// Kiểm tra user có quyền xem conversation này
		const conversation = await Conversation.findById(conversationId);
		if (!conversation || !conversation.participants.includes(userId)) {
			return res.status(403).json({ error: "Access denied" });
		}

		const messages = await Message.find({
			$or: [
				{ senderId: conversation.participants[0], receiverId: conversation.participants[1] },
				{ senderId: conversation.participants[1], receiverId: conversation.participants[0] },
			],
		})
			.populate("senderId", "username fullName profileImg")
			.populate("receiverId", "username fullName profileImg")
			.sort({ createdAt: 1 });

		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getConversations = async (req, res) => {
	try {
		const userId = req.user._id;

		// Lấy user để check following list
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		const conversations = await Conversation.find({
			participants: userId,
		})
			.populate("participants", "username fullName profileImg following")
			.populate("lastMessage")
			.sort({ lastMessageTime: -1 });

		// Lọc conversations chỉ với những người follow lẫn nhau
		const validConversations = conversations.filter(conversation => {
			const otherUser = conversation.participants.find(p => p._id.toString() !== userId.toString());
			
			if (!otherUser) return false;
			
			// Kiểm tra cả hai có follow nhau không
			const currentUserFollowsOther = currentUser.following.includes(otherUser._id);
			const otherUserFollowsCurrent = otherUser.following.includes(userId);
			
			return currentUserFollowsOther && otherUserFollowsCurrent;
		});

		res.status(200).json(validConversations);
	} catch (error) {
		console.log("Error in getConversations controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const markAsRead = async (req, res) => {
	try {
		const { messageId } = req.params;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ error: "Message not found" });
		}

		// Chỉ người nhận mới có thể đánh dấu đã đọc
		if (message.receiverId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Access denied" });
		}

		message.isRead = true;
		await message.save();

		res.status(200).json({ message: "Message marked as read" });
	} catch (error) {
		console.log("Error in markAsRead controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const deleteMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ error: "Message not found" });
		}

		// Chỉ người gửi mới có thể xóa tin nhắn
		if (message.senderId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "Access denied" });
		}

		await Message.findByIdAndDelete(messageId);

		res.status(200).json({ message: "Message deleted successfully" });
	} catch (error) {
		console.log("Error in deleteMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const canMessageUser = async (req, res) => {
	try {
		const { userId: targetUserId } = req.params;
		const currentUserId = req.user._id;

		// Kiểm tra target user có tồn tại
		const targetUser = await User.findById(targetUserId);
		if (!targetUser) {
			return res.status(404).json({ error: "User not found" });
		}

		// Kiểm tra current user
		const currentUser = await User.findById(currentUserId);
		if (!currentUser) {
			return res.status(404).json({ error: "Current user not found" });
		}

		// Kiểm tra xem cả hai có follow nhau không
		const currentUserFollowsTarget = currentUser.following.includes(targetUserId);
		const targetUserFollowsCurrent = targetUser.following.includes(currentUserId);

		const canMessage = currentUserFollowsTarget && targetUserFollowsCurrent;

		res.status(200).json({ 
			canMessage,
			message: canMessage 
				? "You can message this user" 
				: "You can only message users who follow you back"
		});
	} catch (error) {
		console.log("Error in canMessageUser controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
