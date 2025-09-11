import User from "../models/user.model.js";
import Post from "../models/post.model.js";

export const searchAll = async (req, res) => {
	try {
		const { q, type = "all" } = req.query;
		
		if (!q || q.trim().length === 0) {
			return res.status(400).json({ error: "Search query is required" });
		}

		const searchQuery = q.trim();
		let results = {};

		if (type === "all" || type === "users") {
			// Search users by username, full name, or bio
			const users = await User.find({
				$or: [
					{ username: { $regex: searchQuery, $options: "i" } },
					{ fullName: { $regex: searchQuery, $options: "i" } },
					{ bio: { $regex: searchQuery, $options: "i" } }
				]
			})
			.select("-password -email")
			.limit(10)
			.sort({ followers: -1 }); // Sort by follower count

			results.users = users;
		}

		if (type === "all" || type === "posts") {
			// Search posts by text content
			const posts = await Post.find({
				text: { $regex: searchQuery, $options: "i" }
			})
			.populate({
				path: "user",
				select: "-password"
			})
			.populate({
				path: "comments.user",
				select: "-password"
			})
			.sort({ createdAt: -1 })
			.limit(20);

			results.posts = posts;
		}

		res.status(200).json(results);
	} catch (error) {
		console.log("Error in searchAll controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const searchUsers = async (req, res) => {
	try {
		const { q } = req.query;
		
		if (!q || q.trim().length === 0) {
			return res.status(400).json({ error: "Search query is required" });
		}

		const searchQuery = q.trim();

		const users = await User.find({
			$or: [
				{ username: { $regex: searchQuery, $options: "i" } },
				{ fullName: { $regex: searchQuery, $options: "i" } },
				{ bio: { $regex: searchQuery, $options: "i" } }
			]
		})
		.select("-password -email")
		.limit(20)
		.sort({ followers: -1 });

		res.status(200).json({ users });
	} catch (error) {
		console.log("Error in searchUsers controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const searchPosts = async (req, res) => {
	try {
		const { q } = req.query;
		
		if (!q || q.trim().length === 0) {
			return res.status(400).json({ error: "Search query is required" });
		}

		const searchQuery = q.trim();

		const posts = await Post.find({
			text: { $regex: searchQuery, $options: "i" }
		})
		.populate({
			path: "user",
			select: "-password"
		})
		.populate({
			path: "comments.user",
			select: "-password"
		})
		.sort({ createdAt: -1 })
		.limit(30);

		res.status(200).json({ posts });
	} catch (error) {
		console.log("Error in searchPosts controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
