const express = require('express');
const router = express.Router();
const { authorization } = require('../../../auth/tokenValidator.js');


const { getArticles, getArticleById, createArticle,updateArticle, deleteArticle } = require('../../controllers/article/articleController');

router.get('/articles',authorization ,getArticles);  
router.get('/articles/:articleId', authorization, getArticleById); 
router.post('/createArticle', authorization,createArticle);  
router.put('/updateArticle', authorization,updateArticle);  
router.delete('/articles/:articleId', authorization, deleteArticle); 

module.exports = router;
