import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
    throw new Error("MONGODB_URI environment variable is not set. Please set it in your environment.");
}

const connectDB = async () => {
    try {
        await mongoose.connect(dbURI, {
            useUnifiedTopology: true
        });
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};

export default connectDB;