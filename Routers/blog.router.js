const express = require('express');
const BlogRouter = express.Router();
const upload = require("../Middleware/upload");
const {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  mainPageArticle
} = require('../Controllers/Blog.controller');
const { uploadFile } = require('../Middleware/imageUpload');

// Routes for blog articles
BlogRouter.post('/create',uploadFile({
  folder: "blog",
  fieldName: "blogImage", // This should match the form field name
  multiple: false,
}), createArticle);
BlogRouter.get('/get', getArticles);
BlogRouter.get('/main', mainPageArticle);
BlogRouter.get('/get/article/:id', getArticleById);
BlogRouter.put('/update/article/:id', uploadFile({
  folder: "blog",
  fieldName: "blogImage", // This should match the form field name
  multiple: false,
}), updateArticle);
BlogRouter.delete('/delete/:id', deleteArticle);

module.exports = BlogRouter;