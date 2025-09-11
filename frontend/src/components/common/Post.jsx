import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
	const [comment, setComment] = useState("");
	const [isAnimatingLike, setIsAnimatingLike] = useState(false);
	const [currentPost, setCurrentPost] = useState(post);

	const {data:authUser} = useQuery({queryKey: ["authUser"]});
	const {data: posts} = useQuery({queryKey: ["posts"]});
	const queryClient = useQueryClient();

	// Update currentPost khi posts thay đổi
	useEffect(() => {
		if (posts) {
			const updatedPost = posts.find(p => p._id === post._id);
			if (updatedPost) {
				setCurrentPost(updatedPost);
			}
		}
	}, [posts, post._id]);

	const {mutate:deletePost, isPending:isDeleting} = useMutation({
		mutationFn: async() => {
			try {
				const res = await fetch(`/api/posts/${currentPost._id}`, {
					method : "DELETE",
				});

				const data = await res.json();

				if(!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}

				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess : () => {
			toast.success("Post deleted successfully");
			queryClient.invalidateQueries({queryKey: ["posts"]});
		}
	});

	const {mutate:likePost, isPending:isLiking} = useMutation({
		mutationFn: async() => {
			const targetPostId = displayPost?._id || currentPost._id;
			try {
				const res = await fetch(`/api/posts/like/${targetPostId}`, {
					method : "POST",
				});

				const data = await res.json();

				if(!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}

				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess : (data) => {
			// Trigger animation
			setIsAnimatingLike(true);
			setTimeout(() => setIsAnimatingLike(false), 600);
			
			// Update currentPost immediately
			setCurrentPost(prev => ({
				...prev,
				likes: data.likes
			}));
			
			// Also update query cache
			queryClient.setQueryData(["posts"], (old) => {
				if (!old || !Array.isArray(old)) return old;
				return old.map(p => {
					if (p._id === currentPost._id) {
						return {
							...p,
							likes: data.likes,
						};
					}
					return p;
				});
			});
		},
		onError : (error) => {
			toast.error(error.message);
		}
	});

	const {mutate:commentPost, isPending:isCommenting} = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/comment/${currentPost._id}`, {
					method : "POST",
					headers : {
						"Content-Type": "application/json"
					},
					body : JSON.stringify({text: comment})
				});
				const data = await res.json();
				if(!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess : () => {
			toast.success("Comment posted successfully");
			setComment("");
			queryClient.invalidateQueries({queryKey: ["posts"]});
		},
		onError : (error) => {
			toast.error(error.message);
		}
	});

	const {mutate:repostPost, isPending:isReposting} = useMutation({
		mutationFn: async () => {
			const targetPostId = displayPost?._id || currentPost._id;
			try {
				const res = await fetch(`/api/posts/repost/${targetPostId}`, {
					method : "POST",
					headers : {
						"Content-Type": "application/json"
					},
					body : JSON.stringify({repostComment: ""})
				});
				
				if(!res.ok) {
					const errorText = await res.text();
					throw new Error(errorText || "Something went wrong");
				}
				
				const data = await res.json();
				return data;
			} catch (error) {
				console.error("Repost error:", error);
				throw new Error(error.message || error);
			}
		},
		onSuccess : (data) => {
			// Update currentPost immediately
			setCurrentPost(prev => ({
				...prev,
				reposts: data.reposts
			}));
			
			// Also update query cache  
			queryClient.setQueryData(["posts"], (old) => {
				if (!old || !Array.isArray(old)) return old;
				return old.map(p => {
					if (p._id === currentPost._id) {
						return {
							...p,
							reposts: data.reposts,
						};
					}
					return p;
				});
			});
		},
		onError : (error) => {
			toast.error(error.message);
		}
	});

	// Xác định post để hiển thị (original hoặc repost)
	const displayPost = currentPost.isRepost ? currentPost.originalPost : currentPost;
	const repostUser = currentPost.isRepost ? currentPost.user : null;
	
	const postOwner = displayPost?.user || currentPost.user;
	const isLiked = (displayPost?.likes || currentPost.likes).includes(authUser?._id || "");
	const isReposted = (displayPost?.reposts || currentPost.reposts)?.includes(authUser?._id || "") || false;

	const isMyPost = authUser?._id === postOwner?._id;

	const formattedDate = formatPostDate(displayPost?.createdAt || currentPost.createdAt);


	const handleDeletePost = () => {
		if(isDeleting) return;
		deletePost();
	};

	const handlePostComment = (e) => {
		e.preventDefault();
		if(isCommenting) return;
		commentPost();
	};

	const handleLikePost = () => {
		if (isLiking) return;
		
		const targetPostId = displayPost?._id || currentPost._id;
		const targetPost = displayPost || currentPost;
		
		// Optimistic update for immediate UI feedback
		const isCurrentlyLiked = targetPost.likes.includes(authUser._id);
		const newLikes = isCurrentlyLiked 
			? targetPost.likes.filter(id => id !== authUser._id)
			: [...targetPost.likes, authUser._id];
		
		setCurrentPost(prev => {
			if (prev.isRepost) {
				return {
					...prev,
					originalPost: {
						...prev.originalPost,
						likes: newLikes
					}
				};
			}
			return {
				...prev,
				likes: newLikes
			};
		});
		
		// Trigger animation
		setIsAnimatingLike(true);
		setTimeout(() => setIsAnimatingLike(false), 600);
		
		// Then call the mutation
		likePost();
	};

	const handleRepost = () => {
		if (isReposting) return;
		const targetPostId = displayPost?._id || currentPost._id;
		repostPost();
	};

	return (
		<div className='border-b border-gray-700'>
			{/* Repost Header */}
			{repostUser && (
				<div className='flex items-center gap-2 px-4 pt-3 pb-2 text-gray-500 text-sm'>
					<div className='ml-10'> {/* Align with avatar below */}
						<BiRepost className='w-4 h-4 inline mr-2' />
						<Link to={`/profile/${repostUser.username}`} className='hover:text-white font-semibold'>
							{repostUser.fullName}
						</Link>
						<span className='ml-1'>reposted</span>
					</div>
				</div>
			)}
			
			{/* Main Post Content */}
			<div className='flex gap-2 items-start p-4'>
				<div className='avatar'>
					<Link to={`/profile/${postOwner.username}`} className='w-8 rounded-full overflow-hidden'>
						<img src={postOwner.profileImg || "/avatar-placeholder.png"} />
					</Link>
				</div>
				<div className='flex flex-col flex-1'>
					<div className='flex gap-2 items-center'>
						<Link to={`/profile/${postOwner.username}`} className='font-bold'>
							{postOwner.fullName}
						</Link>
						<span className='text-gray-700 flex gap-1 text-sm'>
							<Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
							<span>·</span>
							<span>{formattedDate}</span>
						</span>
						{isMyPost && (
							<span className='flex justify-end flex-1'>
								{!isDeleting && <FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />}
								{isDeleting && (
									<LoadingSpinner size="sm" />
								)}
							</span>
						)}
					</div>
					<div className='flex flex-col gap-3 overflow-hidden'>
						{/* Repost comment */}
						{currentPost.isRepost && currentPost.repostComment && (
							<span className='text-gray-300 mb-2'>{currentPost.repostComment}</span>
						)}
						
						<span>{displayPost?.text || currentPost.text}</span>
						{(displayPost?.img || currentPost.img) && (
							<img
								src={displayPost?.img || currentPost.img}
								className='h-80 object-contain rounded-lg border border-gray-700'
								alt=''
							/>
						)}
					</div>
					<div className='flex justify-between mt-3'>
						<div className='flex gap-4 items-center w-2/3 justify-between'>
							<div
								className='flex gap-1 items-center cursor-pointer group'
								onClick={() => document.getElementById("comments_modal" + currentPost._id).showModal()}
							>
								<FaRegComment className='w-4 h-4  text-slate-500 group-hover:text-sky-400' />
								<span className='text-sm text-slate-500 group-hover:text-sky-400'>
									{(displayPost?.comments || currentPost.comments).length}
								</span>
							</div>
							{/* We're using Modal Component from DaisyUI */}
							<dialog id={`comments_modal${currentPost._id}`} className='modal border-none outline-none'>
								<div className='modal-box rounded border border-gray-600'>
									<h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
									<div className='flex flex-col gap-3 max-h-60 overflow-auto'>
										{currentPost.comments.length === 0 && (
											<p className='text-sm text-slate-500'>
												No comments yet 🤔 Be the first one 😉
											</p>
										)}
										{currentPost.comments.map((comment) => (
											<div key={comment._id} className='flex gap-2 items-start'>
												<div className='avatar'>
													<div className='w-8 rounded-full'>
														<img
															src={comment.user.profileImg || "/avatar-placeholder.png"}
														/>
													</div>
												</div>
												<div className='flex flex-col'>
													<div className='flex items-center gap-1'>
														<span className='font-bold'>{comment.user.fullName}</span>
														<span className='text-gray-700 text-sm'>
															@{comment.user.username}
														</span>
													</div>
													<div className='text-sm'>{comment.text}</div>
												</div>
											</div>
										))}
									</div>
									<form
										className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
										onSubmit={handlePostComment}
									>
										<textarea
											className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800'
											placeholder='Add a comment...'
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>
										<button className='btn btn-primary rounded-full btn-sm text-white px-4'>
											{isCommenting ? (
												<LoadingSpinner size="md" />
											) : (
												"Post"
											)}
										</button>
									</form>
								</div>
								<form method='dialog' className='modal-backdrop'>
									<button className='outline-none'>close</button>
								</form>
							</dialog>
							<div className='flex gap-1 items-center group cursor-pointer' onClick={handleRepost}>
								{isReposting && <LoadingSpinner size="sm" />}
								{!isReposting && (
									<BiRepost className={`w-6 h-6 text-slate-500 group-hover:text-green-500 transition-colors ${
										isReposted ? 'text-green-500' : ''
									}`} />
								)}
								<span className={`text-sm text-slate-500 group-hover:text-green-500 ${
									isReposted ? 'text-green-500' : ''
								}`}>
									{(displayPost?.reposts || currentPost.reposts)?.length || 0}
								</span>
							</div>
							<div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
								{isLiking && <LoadingSpinner size="sm" />}
								{!isLiked && !isLiking && (
									<FaRegHeart className={`w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500 transition-all duration-200 ${
										isAnimatingLike ? 'animate-[like-bounce_600ms_var(--ease-spring-snappy)]' : ''
									}`} />
								)}
								{isLiked && !isLiking && (
									<FaRegHeart className={`w-4 h-4 cursor-pointer text-pink-500 transition-all duration-200 ${
										isAnimatingLike ? 'animate-[heart-beat_400ms_var(--ease-spring)]' : ''
									}`} />
								)}

								<span
									className={`text-sm text-slate-500 group-hover:text-pink-500 ${
										isLiked ? "text-pink-500" : ""
									}`}
								>
									{(displayPost?.likes || currentPost.likes).length}
								</span>
							</div>
						</div>
						<div className='flex w-1/3 justify-end gap-2 items-center'>
							<FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer' />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
export default Post;