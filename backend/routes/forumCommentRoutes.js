import express from "express";
import * as ForumCommentController from "../controllers/ForumCommentController.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

router.post("/", verifyUser, ForumCommentController.createComment);
router.get("/post/:postId", verifyUser, ForumCommentController.getCommentsByPost);
router.get("/author/:authorId", verifyUser, ForumCommentController.getCommentsByAuthor);
router.get("/recent", verifyUser, ForumCommentController.getRecentComments);
router.get("/popular", verifyUser, ForumCommentController.getPopularComments);
router.get("/search", verifyUser, ForumCommentController.searchComments);
router.get("/:commentId", verifyUser, ForumCommentController.getCommentById);
router.put("/:commentId", verifyUser, ForumCommentController.updateComment);
router.delete("/:commentId", verifyUser, ForumCommentController.deleteComment);
router.post("/:commentId/like", verifyUser, ForumCommentController.likeComment);
router.post("/:commentId/unlike", verifyUser, ForumCommentController.unlikeComment);
router.get("/:commentId/replies", verifyUser, ForumCommentController.getRepliesByComment);
router.post("/:commentId/pin", verifyUser, ForumCommentController.pinComment);
router.post("/:commentId/unpin", verifyUser, ForumCommentController.unpinComment);
router.post("/:commentId/highlight", verifyUser, ForumCommentController.highlightComment);
router.post("/:commentId/unhighlight", verifyUser, ForumCommentController.unhighlightComment);
router.post("/:commentId/increment-like", verifyUser, ForumCommentController.incrementLikeCount);
router.post("/:commentId/decrement-like", verifyUser, ForumCommentController.decrementLikeCount);

export default router;