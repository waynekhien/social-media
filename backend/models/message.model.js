import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		message: {
			type: String,
			required: function() {
				return this.messageType === "text";
			},
		},
		image: {
			type: String,
		},
		messageType: {
			type: String,
			enum: ["text", "image", "file"],
			default: "text",
		},
		isRead: {
			type: Boolean,
			default: false,
		},
		isEdited: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
