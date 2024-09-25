const express = require('express');
const BlogRouter = express.Router();

const {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle
} = require('../Controllers/Blog.controller');
const { uploadFile } = require('../Middleware/imageUpload');

// Routes for blog articles
BlogRouter.post('/create',uploadFile({
  folder: "./uploads/products",
  acceptedTypes: [".png", ".jpeg", ".jpg"],
  fieldName: "blogImage", // This should match the form field name
  multiple: false,
}), createArticle);
BlogRouter.get('/get', getArticles);
BlogRouter.get('/get/article/:id', getArticleById);
BlogRouter.put('/update/article/:id', updateArticle);
BlogRouter.delete('/delete/article/:id', deleteArticle);

module.exports = BlogRouter;