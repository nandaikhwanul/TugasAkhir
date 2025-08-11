import mongoose from "mongoose";

const ContentSchema = new mongoose.Schema(
  {
    isi: {
      type: String,
      trim: true,
      default: "",
    },
    foto: {
      type: [String], // array of image URLs
      default: [],
    },
    video: {
      type: [String], // array of video URLs
      default: [],
    },
    perusahaan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Perusahaan",
      required: function () {
        // perusahaan wajib jika alumni tidak diisi
        return !this.alumni;
      },
    },
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alumni",
      required: function () {
        // alumni wajib jika perusahaan tidak diisi
        return !this.perusahaan;
      },
    },
    // Bisa tambahkan field lain seperti tags, likes, dsb jika perlu
  },
  {
    timestamps: true,
  }
);

const Content = mongoose.model("Content", ContentSchema);

export default Content;
