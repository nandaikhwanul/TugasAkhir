import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ForumCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

export default mongoose.model("ForumCategory", ForumCategorySchema);
