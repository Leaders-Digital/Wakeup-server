const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: false,
    },
    views: {
        type: Number,
        default: 0,
    },
    isArchived: {
        type: Boolean,
        default: false,
    }

}, { timestamps: true });

const Blog = mongoose.model("blog", BlogSchema);
module.exports = Blog;
