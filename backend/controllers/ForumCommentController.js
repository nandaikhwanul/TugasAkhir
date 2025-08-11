import ForumComment from "../models/ForumComment.js";
import ForumPost from "../models/ForumPost.js";
import User from "../models/User.js";

// Helper to determine author field and id based on user role
const getAuthorFieldAndId = (user) => {
  if (!user || !user.role) return { field: null, id: null };
  if (user.role === "alumni") return { field: "alumni", id: user._id };
  if (user.role === "admin") return { field: "admin", id: user._id };
  if (user.role === "perusahaan" || user.role === "company") return { field: "perusahaan", id: user._id };
  return { field: null, id: null };
};

// Create a new comment (authorId diambil dari req.user, abaikan authorId di body)
export const createComment = async (req, res) => {
  try {
    const { post, postId, content, parent } = req.body;
    const user = req.user;

    // Pastikan user dan role tersedia dari token
    if (!user || !user.role) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Tentukan authorField berdasarkan role
    let authorField = null;
    if (user.role === "alumni") authorField = "alumni";
    else if (user.role === "admin") authorField = "admin";
    else if (user.role === "perusahaan" || user.role === "company") authorField = "perusahaan";

    const authorId = user._id || user.id;

    // Validasi field wajib
    const postRef = post || postId;
    if (!postRef || !content || !authorField || !authorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Siapkan data komentar, set author sesuai role, abaikan authorId dari body
    const commentData = {
      post: postRef,
      content,
      parent: parent || null,
      [authorField]: authorId,
    };

    const newComment = await ForumComment.create(commentData);

    // Tambahkan jumlah komentar pada post (optional)
    await ForumPost.findByIdAndUpdate(postRef, { $inc: { comments: 1 } });

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all comments for a post (optionally paginated)
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await ForumComment.find({ post: postId, parent: null })
      .populate([
        { path: "alumni", select: "name" },
        { path: "admin", select: "name" },
        { path: "perusahaan", select: "name" }
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single comment by ID
export const getCommentById = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await ForumComment.findById(commentId).populate([
      { path: "alumni", select: "name" },
      { path: "admin", select: "name" },
      { path: "perusahaan", select: "name" }
    ]);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const comment = await ForumComment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Only author can update
    const user = req.user;
    const { field: authorField, id: authorId } = getAuthorFieldAndId(user);
    if (!authorField || !authorId || String(comment[authorField]) !== String(authorId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    comment.content = content;
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await ForumComment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Only author or admin can delete
    const user = req.user;
    const { field: authorField, id: authorId } = getAuthorFieldAndId(user);
    const isAuthor = authorField && authorId && String(comment[authorField]) === String(authorId);
    if (!isAuthor && user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await ForumComment.deleteOne({ _id: commentId });

    // Optionally, decrement comment count on post
    await ForumPost.findByIdAndUpdate(comment.post, { $inc: { comments: -1 } });

    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Like a comment
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    // You may want to track which users liked which comments in a separate collection
    const comment = await ForumComment.findByIdAndUpdate(
      commentId,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Unlike a comment
export const unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await ForumComment.findByIdAndUpdate(
      commentId,
      { $inc: { likes: -1 } },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get replies to a comment
export const getRepliesByComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const replies = await ForumComment.find({ parent: commentId })
      .populate([
        { path: "alumni", select: "name" },
        { path: "admin", select: "name" },
        { path: "perusahaan", select: "name" }
      ])
      .sort({ createdAt: 1 });
    res.json(replies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get comments by author (for all roles)
export const getCommentsByAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Find comments where any of the author fields match authorId
    const comments = await ForumComment.find({
      $or: [
        { alumni: authorId },
        { admin: authorId },
        { perusahaan: authorId }
      ]
    })
      .populate("post", "title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search comments by content
export const searchComments = async (req, res) => {
  try {
    const { q } = req.query;
    const { page = 1, limit = 20 } = req.query;
    const comments = await ForumComment.find({
      content: { $regex: q, $options: "i" },
    })
      .populate([
        { path: "alumni", select: "name" },
        { path: "admin", select: "name" },
        { path: "perusahaan", select: "name" }
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Pin a comment (requires a "pinned" field in schema)
export const pinComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await ForumComment.findByIdAndUpdate(
      commentId,
      { pinned: true },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Unpin a comment
export const unpinComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await ForumComment.findByIdAndUpdate(
      commentId,
      { pinned: false },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Highlight a comment (requires a "highlighted" field in schema)
export const highlightComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await ForumComment.findByIdAndUpdate(
      commentId,
      { highlighted: true },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Unhighlight a comment
export const unhighlightComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await ForumComment.findByIdAndUpdate(
      commentId,
      { highlighted: false },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Increment like count (for admin or system use)
export const incrementLikeCount = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await ForumComment.findByIdAndUpdate(
      commentId,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Decrement like count
export const decrementLikeCount = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await ForumComment.findByIdAndUpdate(
      commentId,
      { $inc: { likes: -1 } },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get recent comments (optionally paginated)
export const getRecentComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const comments = await ForumComment.find()
      .populate([
        { path: "alumni", select: "name" },
        { path: "admin", select: "name" },
        { path: "perusahaan", select: "name" }
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get popular comments (by like count, optionally paginated)
export const getPopularComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const comments = await ForumComment.find()
      .populate([
        { path: "alumni", select: "name" },
        { path: "admin", select: "name" },
        { path: "perusahaan", select: "name" }
      ])
      .sort({ likes: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
