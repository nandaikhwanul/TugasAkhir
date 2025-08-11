import express from "express";
import {
  createForumPost,
  getAllForumPosts,
  getForumPostById,
  updateForumPost,
  deleteForumPost,
  likeForumPost,
  unlikeForumPost,
  saveForumPost,
  unsaveForumPost,
  pinForumPost,
  unpinForumPost,
  highlightForumPost,
  unhighlightForumPost,
  getPostsByCategory,
  getPostsByAuthor,
  searchForumPosts,
  getTrendingPosts,
  getPopularPosts,
  getRecentPosts,
} from "../controllers/ForumPostController.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

// Pastikan verifyUser dipasang di route POST /forum/posts
router.post("/", verifyUser, createForumPost);

router.get("/", verifyUser, getAllForumPosts);
router.get("/search", verifyUser, searchForumPosts);
router.get("/trending", verifyUser, getTrendingPosts);
router.get("/popular", verifyUser, getPopularPosts);
router.get("/recent", verifyUser, getRecentPosts);
router.get("/category/:categoryId", verifyUser, getPostsByCategory);
router.get("/author/:authorId", verifyUser, getPostsByAuthor);
router.get("/:id", verifyUser, getForumPostById);
router.put("/:id", verifyUser, updateForumPost);
router.delete("/:id", verifyUser, deleteForumPost);
router.post("/:id/like", verifyUser, likeForumPost);
router.post("/:id/unlike", verifyUser, unlikeForumPost);
router.post("/:id/save", verifyUser, saveForumPost);
router.post("/:id/unsave", verifyUser, unsaveForumPost);
router.post("/:id/pin", verifyUser, pinForumPost);
router.post("/:id/unpin", verifyUser, unpinForumPost);
router.post("/:id/highlight", verifyUser, highlightForumPost);
router.post("/:id/unhighlight", verifyUser, unhighlightForumPost);

export default router;