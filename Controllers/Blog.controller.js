const Blog = require("../Models/blog.model");

module.exports = {
  createArticle: async (req, res) => {
    try {
      const { title, content , description } = req.body;
      const blogImage = req.file ? req.file.path : null;

      if (!title || !content) {
        return res.status(400).json({
          message: "Product title, content are required",
        });
      }

      const newBlog = new Blog({
        title,
        content,
        description, 
        blogImage: blogImage,
      });
      await newBlog.save();

      res
        .status(201)
        .json({ message: "Blog created successfully", newBlog });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  getArticles: async (req, res) => {
    try {
      // Fetch all blog articles
      const response = await Blog.find()
      return res
        .status(200)
        .json({ data: response, message: "List of articles" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "An error occurred while fetching articles" });
    }
  },
  mainPageArticle: async (req, res) => {
    try {
      // Fetch all blog articles
      const response = await Blog.find().limit(4).sort({ createdAt: -1 });
      return res
        .status(200)
        .json({ data: response, message: "List of articles" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "An error occurred while fetching articles" });
    }
  },

  getArticleById: async (req, res) => {
    const { id } = req.params;

    try {
      // Fetch article by ID
      const response = await Blog.findById(id);
      if (!response) {
        return res.status(404).json({ message: "Article not found" });
      }
      return res
        .status(200)
        .json({ data: response, message: "Article details" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "An error occurred while fetching the article" });
    }
  },

  updateArticle: async (req, res) => {
    const { id } = req.params;
  console.log(req.body);
  
    const { title, content, isArchived } = req.body;
    const blog = await Blog.findById(id);
    if (!blog){
      return res.status(404).json({ message: "Article not found" });
    }
    const blogImage = req.file ? req.file.path : blog.blogImage;
    console.log(blogImage,"here");
    
    try {
      // Update the blog article
      const response = await Blog.findByIdAndUpdate(
        id,
        {
          title,
          content,
          blogImage,
          isArchived,
        },
        { new: true }
      );

      if (!response) {
        return res.status(404).json({ message: "Article not found" });
      }

      return res
        .status(200)
        .json({ message: "Article updated successfully", data: response });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "An error occurred while updating the article" });
    }
  },

  deleteArticle: async (req, res) => {
    const { id } = req.params;

    try {
      // Delete the blog article
      const response = await Blog.findByIdAndDelete(id);

      if (!response) {
        return res.status(404).json({ message: "Article not found" });
      }

      return res.status(200).json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "An error occurred while deleting the article" });
    }
  },
};
