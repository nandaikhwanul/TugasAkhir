import ForumPost from "../models/ForumPost.js";
import ForumCategory from "../models/ForumCategory.js";
import ForumComment from "../models/ForumComment.js";
import User from "../models/User.js";

// Helper untuk pagination
const getPagination = (page = 1, limit = 10) => {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const skip = (page - 1) * limit;
  return { skip, limit };
};

// Helper untuk menentukan field author berdasarkan user
const getSenderFieldAndId = (user) => {
  if (!user) return { field: null, id: null };
  if (user.role === "alumni") return { field: "alumni", id: user._id };
  if (user.role === "admin") return { field: "admin", id: user._id };
  if (user.role === "perusahaan" || user.role === "company") return { field: "perusahaan", id: user._id };
  return { field: null, id: null };
};

// 1. Buat Forum Post
export const createForumPost = async (req, res) => {
  try {
    const { title, summary, content, tags, category } = req.body;
    const user = req.user;
    if (!user || !user.role) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Tentukan field author berdasarkan role
    let authorField = null;
    if (user.role === "alumni") authorField = "alumni";
    else if (user.role === "admin") authorField = "admin";
    else if (user.role === "perusahaan" || user.role === "company") authorField = "perusahaan";

    const authorId = user._id || user.id;

    if (!title || !summary || !content || !category || !authorField || !authorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const postData = {
      title,
      summary,
      content,
      tags,
      category,
      [authorField]: authorId,
      likes: 0,
      likedBy: [],
    };

    const post = await ForumPost.create(postData);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Ambil Semua Forum Post (filter, sort, pagination)
export const getAllForumPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      category,
      alumni,
      admin,
      perusahaan,
      tag,
      search,
      pinned,
      highlighted,
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (alumni) filter.alumni = alumni;
    if (admin) filter.admin = admin;
    if (perusahaan) filter.perusahaan = perusahaan;
    if (tag) filter.tags = tag;
    if (typeof pinned !== "undefined") filter.pinned = pinned === "true";
    if (typeof highlighted !== "undefined") filter.highlighted = highlighted === "true";
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const { skip, limit: lim } = getPagination(page, limit);

    let query = ForumPost.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(lim)
      .populate("alumni", "name email")
      .populate("admin", "name email")
      .populate("perusahaan", "name email")
      .populate("category", "name");

    const posts = await query;

    const total = await ForumPost.countDocuments(filter);

    res.json({
      data: posts,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Ambil Forum Post Berdasarkan Id (detail)
export const getForumPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await ForumPost.findById(id)
      .populate("alumni", "name email")
      .populate("admin", "name email")
      .populate("perusahaan", "name email")
      .populate("category", "name");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Update Forum Post
export const updateForumPost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      summary,
      content,
      tags,
      category,
      pinned,
      highlighted,
    } = req.body;

    const user = req.user;
    if (!user || !user.role) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const post = await ForumPost.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Cek kepemilikan: hanya author yang boleh update
    let isOwner = false;
    if (user.role === "alumni" && post.alumni && post.alumni.toString() === (user._id || user.id).toString()) {
      isOwner = true;
    } else if (user.role === "admin" && post.admin && post.admin.toString() === (user._id || user.id).toString()) {
      isOwner = true;
    } else if (
      (user.role === "perusahaan" || user.role === "company") &&
      post.perusahaan &&
      post.perusahaan.toString() === (user._id || user.id).toString()
    ) {
      isOwner = true;
    }

    if (!isOwner) {
      return res.status(403).json({ message: "You are not allowed to update this post" });
    }

    // Siapkan field yang boleh diupdate
    const updateFields = {};
    if (typeof title !== "undefined") updateFields.title = title;
    if (typeof summary !== "undefined") updateFields.summary = summary;
    if (typeof content !== "undefined") updateFields.content = content;
    if (typeof tags !== "undefined") updateFields.tags = tags;
    if (typeof category !== "undefined") updateFields.category = category;
    if (typeof pinned !== "undefined") updateFields.pinned = pinned;
    if (typeof highlighted !== "undefined") updateFields.highlighted = highlighted;

    const updatedPost = await ForumPost.findByIdAndUpdate(id, updateFields, {
      new: true,
    });
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Hapus Forum Post
export const deleteForumPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await ForumPost.findByIdAndDelete(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    await ForumComment.deleteMany({ post: id });
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6. Like Forum Post (cek jika sudah pernah like, tidak bisa like lagi)
export const likeForumPost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user || !user.role) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = (user._id || user.id) ? (user._id || user.id).toString() : null;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const post = await ForumPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!Array.isArray(post.likedBy)) {
      post.likedBy = [];
    }

    const alreadyLiked = post.likedBy.map(uid => uid.toString()).includes(userId);
    if (alreadyLiked) {
      return res.status(400).json({ message: "You have already liked this post" });
    }

    post.likes = (post.likes || 0) + 1;
    post.likedBy.push(userId);
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6b. Unlike Forum Post
export const unlikeForumPost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user || !user.role) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const userId = (user._id || user.id) ? (user._id || user.id).toString() : null;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const post = await ForumPost.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!Array.isArray(post.likedBy)) {
      post.likedBy = [];
    }

    const userIndex = post.likedBy.map(uid => uid.toString()).indexOf(userId);
    if (userIndex === -1) {
      return res.status(400).json({ message: "You have not liked this post" });
    }

    post.likedBy.splice(userIndex, 1);
    if (post.likes > 0) {
      post.likes -= 1;
    }
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 7. Simpan Forum Post (menggunakan savedBy di ForumPost)
export const saveForumPost = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const userId = (user._id || user.id) ? (user._id || user.id).toString() : null;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const { id } = req.params;

    const post = await ForumPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!Array.isArray(post.savedBy)) {
      post.savedBy = [];
    }

    // Validasi: jika user sudah pernah save, tidak bisa save lagi
    const alreadySaved = post.savedBy.map(uid => uid.toString()).includes(userId);
    if (alreadySaved) {
      return res.status(400).json({ message: "You have already saved this post" });
    }

    post.savedBy.push(userId);
    await post.save();

    res.json({ message: "Post saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 7b. Hapus Simpanan Forum Post
export const unsaveForumPost = async (req, res) => {
  try {
    // Samakan cara ambil userId dengan fungsi like
    const user = req.user;
    if (!user || !user.role) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const userId = (user._id || user.id) ? (user._id || user.id).toString() : null;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const { id } = req.params;

    const post = await ForumPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!Array.isArray(post.savedBy)) {
      post.savedBy = [];
    }

    const index = post.savedBy.map(uid => uid.toString()).indexOf(userId);
    if (index === -1) {
      return res.status(400).json({ message: "You have not saved this post" });
    }

    post.savedBy.splice(index, 1);
    await post.save();

    res.json({ message: "Post unsaved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 7c. Get Saved Forum Posts (only for the user themselves)
export const getSavedForumPosts = async (req, res) => {
  try {
    // Samakan cara ambil userId dengan fungsi like
    const user = req.user;
    if (!user || !user.role) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const userId = (user._id || user.id) ? (user._id || user.id).toString() : null;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Cari semua post yang disimpan oleh user ini
    const savedPosts = await ForumPost.find({ savedBy: userId });

    res.json({ savedPosts: savedPosts || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 8. Pin Forum Post (hanya admin yang bisa)
export const pinForumPost = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can pin posts" });
    }
    const { id } = req.params;
    const post = await ForumPost.findByIdAndUpdate(
      id,
      { pinned: true },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 8b. Unpin Forum Post (hanya admin yang bisa)
export const unpinForumPost = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can unpin posts" });
    }
    const { id } = req.params;
    const post = await ForumPost.findByIdAndUpdate(
      id,
      { pinned: false },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 9. Highlight Forum Post (hanya admin yang bisa)
export const highlightForumPost = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can highlight posts" });
    }
    const { id } = req.params;
    const post = await ForumPost.findByIdAndUpdate(
      id,
      { highlighted: true },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 9b. Unhighlight Forum Post (hanya admin yang bisa)
export const unhighlightForumPost = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can unhighlight posts" });
    }
    const { id } = req.params;
    const post = await ForumPost.findByIdAndUpdate(
      id,
      { highlighted: false },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 10. Ambil Post Berdasarkan Kategori
export const getPostsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);
    const posts = await ForumPost.find({ category: categoryId })
      .sort(sort)
      .skip(skip)
      .limit(lim)
      .populate("alumni", "name email")
      .populate("admin", "name email")
      .populate("perusahaan", "name email")
      .populate("category", "name");
    const total = await ForumPost.countDocuments({ category: categoryId });
    res.json({
      data: posts,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 11. Ambil Post Berdasarkan Author (alumni/admin/perusahaan)
export const getPostsByAuthor = async (req, res) => {
  try {
    const { authorId, type } = req.params;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);

    let filter = {};
    if (type === "alumni") filter.alumni = authorId;
    else if (type === "admin") filter.admin = authorId;
    else if (type === "perusahaan" || type === "company") filter.perusahaan = authorId;
    else return res.status(400).json({ message: "Invalid author type" });

    const posts = await ForumPost.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(lim)
      .populate("alumni", "name email")
      .populate("admin", "name email")
      .populate("perusahaan", "name email")
      .populate("category", "name");
    const total = await ForumPost.countDocuments(filter);
    res.json({
      data: posts,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 12. Cari Forum Post
export const searchForumPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10, sort = "-createdAt" } = req.query;
    if (!q) return res.status(400).json({ message: "Missing search query" });
    const filter = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { summary: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    };
    const { skip, limit: lim } = getPagination(page, limit);
    const posts = await ForumPost.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(lim)
      .populate("alumni", "name email")
      .populate("admin", "name email")
      .populate("perusahaan", "name email")
      .populate("category", "name");
    const total = await ForumPost.countDocuments(filter);
    res.json({
      data: posts,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 13. Tambah/Kurangi Jumlah Komentar
export const incrementCommentCount = async (postId) => {
  await ForumPost.findByIdAndUpdate(postId, { $inc: { comments: 1 } });
};

export const decrementCommentCount = async (postId) => {
  await ForumPost.findByIdAndUpdate(postId, { $inc: { comments: -1 } });
};

// 14. Ambil Trending Post (popularity, likes, comments, recent)
export const getTrendingPosts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const posts = await ForumPost.find()
      .sort({ popularity: -1, likes: -1, comments: -1, createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate("alumni", "name email")
      .populate("admin", "name email")
      .populate("perusahaan", "name email")
      .populate("category", "name");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 15. Ambil Post Populer (berdasarkan likes)
export const getPopularPosts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const posts = await ForumPost.find()
      .sort({ likes: -1, createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate("alumni", "name email")
      .populate("admin", "name email")
      .populate("perusahaan", "name email")
      .populate("category", "name");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 16. Ambil Post Terbaru
export const getRecentPosts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const posts = await ForumPost.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate("alumni", "name email")
      .populate("admin", "name email")
      .populate("perusahaan", "name email")
      .populate("category", "name");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
