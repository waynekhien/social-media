import { useQuery } from "@tanstack/react-query";

const ConversationList = ({ conversations, selectedConversation, onSelectConversation }) => {
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const getOtherParticipant = (participants) => {
		return participants.find(p => p._id !== authUser._id);
	};

	const formatTime = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now - date);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 1) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else if (diffDays <= 7) {
			return date.toLocaleDateString([], { weekday: 'short' });
		} else {
			return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
		}
	};

	return (
		<div className="h-full flex flex-col">
			<div className="p-4 border-b border-gray-700 flex-shrink-0">
				<h2 className="text-xl font-bold">Messages</h2>
			</div>

			<div className="flex-1 overflow-y-auto">
				{conversations?.map((conversation) => {
					const otherUser = getOtherParticipant(conversation.participants);
					const isSelected = selectedConversation?._id === conversation._id;

					return (
						<div
							key={conversation._id}
							onClick={() => onSelectConversation(conversation)}
							className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors ${
								isSelected ? "bg-gray-800" : ""
							}`}
						>
							<div className="flex items-center space-x-3">
								<div className="avatar">
									<div className="w-12 h-12 rounded-full">
										<img
											src={otherUser?.profileImg || "/avatar-placeholder.png"}
											alt={otherUser?.fullName}
										/>
									</div>
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex justify-between items-center">
										<p className="font-semibold truncate">{otherUser?.fullName}</p>
										{conversation.lastMessageTime && (
											<span className="text-xs text-gray-500">
												{formatTime(conversation.lastMessageTime)}
											</span>
										)}
									</div>
									<p className="text-sm text-gray-500 truncate">@{otherUser?.username}</p>
									{conversation.lastMessage && (
										<p className="text-sm text-gray-400 truncate mt-1">
											{conversation.lastMessage.message}
										</p>
									)}
								</div>
							</div>
						</div>
					);
				})}

				{conversations?.length === 0 && (
					<div className="p-8 text-center text-gray-500">
						<p>No conversations yet</p>
						<p className="text-sm mt-2">Start a conversation by visiting someone's profile</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ConversationList;
