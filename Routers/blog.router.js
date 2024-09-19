const express = require('express');
const BlogRouter = express.Router();

const {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle
} = require('../Controllers/Blog.controller');

// Routes for blog articles
BlogRouter.post('/create/article', createArticle);
BlogRouter.get('/get/articles', getArticles);
BlogRouter.get('/get/article/:id', getArticleById);
BlogRouter.put('/update/article/:id', updateArticle);
BlogRouter.delete('/delete/article/:id', deleteArticle);

module.exports = BlogRouter;