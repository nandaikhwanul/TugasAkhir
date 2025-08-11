import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  searchCategories,
  getPostsByCategory,
} from "../controllers/ForumCategoryController.js";

const router = express.Router();

router.post("/", createCategory);
router.get("/", getAllCategories);
router.get("/search", searchCategories);
router.get("/:categoryId", getCategoryById);
router.put("/:categoryId", updateCategory);
router.delete("/:categoryId", deleteCategory);
router.get("/:categoryId/posts", getPostsByCategory);

export default router;