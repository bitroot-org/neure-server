const express = require("express");
const multer = require("multer");
const router = express.Router();
const { authorization } = require("../../../auth/tokenValidator.js");

const articleUpload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024 }, // 8 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type!"));
    }
  },
});

const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
} = require("../../controllers/article/articleController");

router.get("/getArticles", authorization, getArticles);
router.get("/articles/:articleId", authorization, getArticleById);
router.post(
  "/createArticle",
  authorization,
  articleUpload.single("file"),
  createArticle
);
router.put("/updateArticle", authorization, articleUpload.single("file"), updateArticle);
router.delete("/deleteArticle/:articleId", authorization, deleteArticle);

module.exports = router;
