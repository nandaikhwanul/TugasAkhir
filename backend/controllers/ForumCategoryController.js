import ForumCategory from "../models/ForumCategory.js";
import ForumPost from "../models/ForumPost.js";

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    const existing = await ForumCategory.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }
    const category = new ForumCategory({
      name: name.trim(),
      description: description || "",
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await ForumCategory.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await ForumCategory.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;
    const category = await ForumCategory.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await ForumCategory.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await ForumCategory.deleteOne({ _id: categoryId });
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search categories (optional)
export const searchCategories = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const categories = await ForumCategory.find({
      name: { $regex: q, $options: "i" },
    }).sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get posts by category (optional)
export const getPostsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const posts = await ForumPost.find({ category: categoryId })
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
