import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { searchUsers, searchPosts, searchAll } from "../controllers/search.controller.js";

const router = express.Router();

router.get("/", protectRoute, searchAll);
router.get("/users", protectRoute, searchUsers);
router.get("/posts", protectRoute, searchPosts);

export default router;
