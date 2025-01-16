const express = require('express');
const router = express.Router();
const articleController = require('../../controllers/article/articleController');

router.get('/articles', articleController.getArticles);  // Fetch all articles
router.get('/articles/:articleId', articleController.getArticleById);  // Fetch article by ID
router.post('/articles', articleController.createArticle);  // Create a new article
router.put('/articles/:articleId', articleController.updateArticle);  // Update an article
router.delete('/articles/:articleId', articleController.deleteArticle);  // Delete an article

module.exports = router;
