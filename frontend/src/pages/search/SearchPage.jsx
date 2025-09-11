import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaSearch, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Post from "../../components/common/Post";

const SearchPage = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState("users"); // users, posts, all
	const [debouncedQuery, setDebouncedQuery] = useState("");

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchQuery);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Search users
	const { data: searchResults, isLoading } = useQuery({
		queryKey: ["search", debouncedQuery, activeTab],
		queryFn: async () => {
			if (!debouncedQuery.trim()) return null;
			
			const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${activeTab}`);
			const data = await res.json();
			
			if (!res.ok) {
				throw new Error(data.error || "Search failed");
			}
			
			return data;
		},
		enabled: !!debouncedQuery.trim(),
	});

	const clearSearch = () => {
		setSearchQuery("");
		setDebouncedQuery("");
	};

	return (
		<div className='flex-[4_4_0] mr-auto border-r border-gray-700 min-h-screen'>
			{/* Header */}
			<div className='flex w-full border-b border-gray-700 p-4 sticky top-0 bg-black z-10'>
				<div className='relative flex-1'>
					<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
						<FaSearch className='h-5 w-5 text-gray-400' />
					</div>
					<input
						type='text'
						className='block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-full bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						placeholder='Search for users, posts...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<button
							onClick={clearSearch}
							className='absolute inset-y-0 right-0 pr-3 flex items-center'
						>
							<FaTimes className='h-5 w-5 text-gray-400 hover:text-white' />
						</button>
					)}
				</div>
			</div>

			{/* Search Tabs */}
			<div className='flex border-b border-gray-700'>
				{["all", "users", "posts"].map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`flex-1 p-3 text-center capitalize hover:bg-gray-800 transition-colors relative ${
							activeTab === tab ? "text-white" : "text-gray-400"
						}`}
					>
						{tab}
						{activeTab === tab && (
							<div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-blue-500 rounded-full'></div>
						)}
					</button>
				))}
			</div>

			{/* Search Results */}
			<div className='p-4'>
				{!searchQuery && (
					<div className='text-center text-gray-400 mt-20'>
						<FaSearch className='h-16 w-16 mx-auto mb-4 opacity-50' />
						<h2 className='text-xl font-semibold mb-2'>Search K-Social</h2>
						<p>Find users, posts, and discover new content</p>
					</div>
				)}

				{searchQuery && !debouncedQuery && (
					<div className='text-center text-gray-400 mt-10'>
						<LoadingSpinner size='lg' />
					</div>
				)}

				{isLoading && debouncedQuery && (
					<div className='text-center text-gray-400 mt-10'>
						<LoadingSpinner size='lg' />
						<p className='mt-2'>Searching...</p>
					</div>
				)}

				{searchResults && !isLoading && (
					<div className='space-y-4'>
						{/* Users Results */}
						{(activeTab === "all" || activeTab === "users") && searchResults.users && (
							<div>
								{activeTab === "all" && <h3 className='text-lg font-semibold mb-3 text-white'>Users</h3>}
								<div className='space-y-3'>
									{searchResults.users.map((user) => (
										<Link
											key={user._id}
											to={`/profile/${user.username}`}
											className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors'
										>
											<div className='avatar'>
												<div className='w-12 h-12 rounded-full'>
													<img
														src={user.profileImg || "/avatar-placeholder.png"}
														alt={user.fullName}
													/>
												</div>
											</div>
											<div className='flex-1 min-w-0'>
												<p className='text-white font-semibold truncate'>
													{user.fullName}
												</p>
												<p className='text-gray-400 text-sm truncate'>
													@{user.username}
												</p>
												{user.bio && (
													<p className='text-gray-300 text-sm truncate mt-1'>
														{user.bio}
													</p>
												)}
											</div>
											<div className='text-gray-400 text-sm'>
												{user.followers?.length || 0} followers
											</div>
										</Link>
									))}
								</div>
							</div>
						)}

						{/* Posts Results */}
						{(activeTab === "all" || activeTab === "posts") && searchResults.posts && (
							<div className='mt-6'>
								{activeTab === "all" && <h3 className='text-lg font-semibold mb-3 text-white'>Posts</h3>}
								<div className='space-y-4'>
									{searchResults.posts.map((post) => (
										<Post key={post._id} post={post} />
									))}
								</div>
							</div>
						)}

						{/* No Results */}
						{searchResults && 
						 (!searchResults.users || searchResults.users.length === 0) && 
						 (!searchResults.posts || searchResults.posts.length === 0) && (
							<div className='text-center text-gray-400 mt-10'>
								<p className='text-lg'>No results found for "{debouncedQuery}"</p>
								<p className='text-sm mt-2'>Try different keywords</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default SearchPage;
