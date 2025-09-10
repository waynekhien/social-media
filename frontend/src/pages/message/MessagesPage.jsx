import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import ConversationList from "../../components/message/ConversationList";
import ChatWindow from "../../components/message/ChatWindow";
import { AiFillMessage } from "react-icons/ai";
import toast from "react-hot-toast";

const MessagesPage = () => {
	const [selectedConversation, setSelectedConversation] = useState(null);
	const location = useLocation();
	const queryClient = useQueryClient();

	const { data: conversations, isLoading } = useQuery({
		queryKey: ["conversations"],
		queryFn: async () => {
			const res = await fetch("/api/messages/conversations");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to fetch conversations");
			return data;
		},
	});

	// Handle starting conversation from profile page
	useEffect(() => {
		const startConversationWith = location.state?.startConversationWith;
		if (startConversationWith && conversations) {
			// Tìm conversation với user này
			const existingConversation = conversations.find(conv =>
				conv.participants.some(p => p._id === startConversationWith)
			);
			
			if (existingConversation) {
				setSelectedConversation(existingConversation);
			} else {
				// Tạo conversation mock để hiển thị chat window
				// User data sẽ được load trong ChatWindow
				setSelectedConversation({
					_id: 'new',
					participants: [{ _id: startConversationWith }]
				});
			}
		}
	}, [location.state, conversations]);

	if (isLoading) {
		return (
			<div className="flex-[4_4_0] mr-auto border-r border-gray-700 min-h-screen">
				<div className="flex justify-center items-center h-full">
					<div className="loading loading-spinner loading-lg"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-[4_4_0] mr-auto border-r border-gray-700 min-h-screen max-h-screen">
			<div className="flex h-full">
				{/* Conversation List */}
				<div className="w-1/3 border-r border-gray-700 flex flex-col">
					<ConversationList
						conversations={conversations}
						selectedConversation={selectedConversation}
						onSelectConversation={setSelectedConversation}
					/>
				</div>

				{/* Chat Window */}
				<div className="flex-1 flex flex-col">
					{selectedConversation ? (
						<ChatWindow conversation={selectedConversation} />
					) : (
						<div className="flex items-center justify-center h-full">
							<div className="text-center">
								<AiFillMessage className="w-16 h-16 mx-auto mb-4 text-gray-500" />
								<p className="text-gray-500">Select a conversation to start messaging</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default MessagesPage;
