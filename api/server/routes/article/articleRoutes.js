const express = require('express');
const router = express.Router();
const { authorization } = require('../../../auth/tokenValidator.js');


const { getArticles, getArticleById, createArticle,updateArticle, deleteArticle } = require('../../controllers/article/articleController');

router.get('/articles', getArticles);  
router.get('/articles/:articleId', getArticleById); 
router.post('/articles', createArticle);  
router.put('/articles/:articleId', updateArticle);  
router.delete('/articles/:articleId', deleteArticle); 

module.exports = router;
