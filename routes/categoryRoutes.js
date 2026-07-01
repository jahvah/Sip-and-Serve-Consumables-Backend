const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/categoryController");

router.get("/all", categoryController.getAllCategories);
router.post("/create", categoryController.createCategory);
router.put("/update", categoryController.updateCategory);
router.delete("/delete/:id", categoryController.deleteCategory);

module.exports = router;