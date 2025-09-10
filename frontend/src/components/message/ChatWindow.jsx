import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IoSend } from "react-icons/io5";
import { MdCancel } from 'react-icons/md';
import { FiImage } from 'react-icons/fi';
import toast from "react-hot-toast";
import { useSocketContext } from "../../context/SocketContext";

const ChatWindow = ({ conversation }) => {
	const [message, setMessage] = useState("");
	const [selectedImage, setSelectedImage] = useState(null);
	const [selectedFile, setSelectedFile] = useState(null);
	const [isUserScrolling, setIsUserScrolling] = useState(false);
	const messagesEndRef = useRef(null);
	const messagesContainerRef = useRef(null);
	const imageInputRef = useRef(null);
	const queryClient = useQueryClient();
	const { socket } = useSocketContext();

	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const { data: messages, isLoading } = useQuery({
		queryKey: ["messages", conversation._id],
		queryFn: async () => {
			const res = await fetch(`/api/messages/${conversation._id}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to fetch messages");
			return data;
		},
		enabled: !!conversation._id,
	});

	const { mutate: sendMessage, isPending } = useMutation({
		mutationFn: async ({ messageText, imageData }) => {
			const otherUser = conversation.participants.find(p => p._id !== authUser._id);
			const res = await fetch(`/api/messages/send/${otherUser._id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ 
					message: messageText,
					image: imageData 
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				// Kiểm tra nếu lỗi do không follow nhau
				if (res.status === 403) {
					throw new Error("You can only message users who follow you back");
				}
				throw new Error(data.error || "Failed to send message");
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["messages", conversation._id] });
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
			setMessage("");
			removeSelectedImage();
			// Force scroll to bottom after sending message
			setTimeout(() => {
				messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
			}, 100);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Listen for new messages via socket
	useEffect(() => {
		if (socket) {
			socket.on("newMessage", (newMessage) => {
				// Check if the message belongs to this conversation
				const isMessageForThisConversation = 
					conversation.participants.some(p => p._id === newMessage.senderId._id);

				if (isMessageForThisConversation) {
					queryClient.invalidateQueries({ queryKey: ["messages", conversation._id] });
					queryClient.invalidateQueries({ queryKey: ["conversations"] });
				}
			});

			return () => socket.off("newMessage");
		}
	}, [socket, conversation, queryClient]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if ((message.trim() || selectedFile) && !isPending) {
			let messageText = message.trim();
			
			if (selectedFile) {
				// Convert file to base64
				const reader = new FileReader();
				reader.onload = () => {
					const imageData = reader.result;
					sendMessage({ 
						messageText: messageText || "", 
						imageData 
					});
				};
				reader.readAsDataURL(selectedFile);
			} else if (messageText) {
				sendMessage({ 
					messageText, 
					imageData: null 
				});
			}
		}
	};

	const handleImageClick = () => {
		imageInputRef.current?.click();
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			if (file.type.startsWith('image/')) {
				setSelectedFile(file);
				const reader = new FileReader();
				reader.onload = () => {
					setSelectedImage(reader.result);
				};
				reader.readAsDataURL(file);
			} else {
				toast.error("Please select an image file");
			}
		}
	};

	const removeSelectedImage = () => {
		setSelectedImage(null);
		setSelectedFile(null);
		if (imageInputRef.current) {
			imageInputRef.current.value = '';
		}
	};

	const scrollToBottom = () => {
		if (messagesContainerRef.current && messagesEndRef.current) {
			const container = messagesContainerRef.current;
			const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 1;
			
			// Chỉ scroll nếu user đang ở cuối hoặc vừa gửi tin nhắn
			if (isScrolledToBottom || !isUserScrolling) {
				messagesEndRef.current.scrollIntoView({ behavior: "auto" });
			}
		}
	};

	const handleScroll = () => {
		if (messagesContainerRef.current) {
			const container = messagesContainerRef.current;
			const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 1;
			setIsUserScrolling(!isScrolledToBottom);
		}
	};

	useEffect(() => {
		// Scroll to bottom when messages change, but only if user is at bottom
		const timeoutId = setTimeout(scrollToBottom, 100);
		return () => clearTimeout(timeoutId);
	}, [messages]);

	useEffect(() => {
		// Always scroll to bottom when conversation changes
		if (conversation) {
			setTimeout(() => {
				messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
			}, 100);
		}
	}, [conversation._id]);

	const formatTime = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	const otherUser = conversation.participants.find(p => p._id !== authUser._id);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full">
				<div className="loading loading-spinner loading-lg"></div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full max-h-screen">
			{/* Header */}
			<div className="p-4 border-b border-gray-700 flex items-center space-x-3 flex-shrink-0">
				<div className="avatar">
					<div className="w-10 h-10 rounded-full">
						<img
							src={otherUser?.profileImg || "/avatar-placeholder.png"}
							alt={otherUser?.fullName}
						/>
					</div>
				</div>
				<div>
					<p className="font-semibold">{otherUser?.fullName}</p>
					<p className="text-sm text-gray-500">@{otherUser?.username}</p>
				</div>
			</div>

			{/* Messages */}
			<div 
				ref={messagesContainerRef}
				className="flex-1 overflow-y-auto p-4 space-y-4"
				onScroll={handleScroll}
			>
				{messages?.map((msg) => {
					const isOwnMessage = msg.senderId._id === authUser._id;
					return (
						<div
							key={msg._id}
							className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
						>
							{msg.messageType === "image" && msg.image ? (
								// Image message without background
								<div className="max-w-xs lg:max-w-md">
									<img 
										src={msg.image} 
										alt="Message image" 
										className="max-w-full rounded-lg cursor-pointer hover:opacity-80 transition-opacity shadow-lg"
										onClick={() => window.open(msg.image, '_blank')}
									/>
									<p className="text-xs mt-1 opacity-70 text-gray-400">
										{formatTime(msg.createdAt)}
									</p>
								</div>
							) : (
								// Text message with background
								<div
									className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
										isOwnMessage
											? "bg-blue-600 text-white"
											: "bg-gray-700 text-white"
									}`}
								>
									<p className="text-sm">{msg.message}</p>
									<p className="text-xs mt-1 opacity-70">
										{formatTime(msg.createdAt)}
									</p>
								</div>
							)}
						</div>
					);
				})}
				<div ref={messagesEndRef} />
			</div>

			{/* Message Input */}
			<form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 flex-shrink-0">
				{/* Image Preview */}
				{selectedImage && (
					<div className="mb-3 relative">
						<img 
							src={selectedImage} 
							alt="Preview" 
							className="max-w-xs max-h-32 rounded-lg"
						/>
						<button
							type="button"
							onClick={removeSelectedImage}
							className="absolute -top-2 -right-2 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
						>
							<MdCancel />
						</button>
					</div>
				)}
				
				<div className="flex space-x-2">
					{/* Image Upload Button */}
					<button
						type="button"
						onClick={handleImageClick}
						className="btn btn-ghost btn-sm px-2"
						title="Upload Image"
					>
						<FiImage className="w-5 h-5" />
					</button>
					
					{/* Hidden File Input */}
					<input
						type="file"
						ref={imageInputRef}
						onChange={handleImageChange}
						accept="image/*"
						className="hidden"
					/>
					
					<input
						type="text"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder="Type a message..."
						className="flex-1 input input-bordered bg-gray-800 border-gray-600"
						disabled={isPending}
					/>
					<button
						type="submit"
						disabled={(!message.trim() && !selectedImage) || isPending}
						className="btn btn-primary"
					>
						{isPending ? (
							<div className="loading loading-spinner loading-sm"></div>
						) : (
							<IoSend className="w-5 h-5" />
						)}
					</button>
				</div>
			</form>
		</div>
	);
};

export default ChatWindow;
