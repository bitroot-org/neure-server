const express = require("express");
const router = express.Router();
const { authorization } = require("../../../auth/tokenValidator");
const {
  createQna,
  getQnaList,
  getQnaById,
  updateQna,
  deleteQna,
} = require("../../controllers/qna/qnaController");

// Create a new QnA
router.post("/create", authorization, createQna);

// Get QnA list with pagination and search
router.get("/list", authorization, getQnaList);

// Get QnA by ID
router.get("/:id", authorization, getQnaById);

// Update QnA
router.put("/update", authorization, updateQna);

// Delete QnA
router.delete("/:id", authorization, deleteQna);

module.exports = router;