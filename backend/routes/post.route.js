import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { 
    getAllPosts ,
    createPost, 
    deletePost, 
    likeUnlikePost, 
    getLikedPosts, 
    getFollowingPosts, 
    commentOnPost,
    getUserPosts,
    repostPost
 } from '../controllers/post.controller.js';

const router = express.Router();

router.get("/all", protectRoute, getAllPosts);
router.get("/likes/:id", protectRoute, getLikedPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/repost/:id", protectRoute, repostPost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletePost);

export default router;  