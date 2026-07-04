const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/categoryController");

const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");

/* =========================
   PUBLIC - GET CATEGORIES (HOME / DROPDOWN)
========================= */
router.get("/all", categoryController.getAllCategories);

/* =========================
   ADMIN ONLY - CREATE CATEGORY
========================= */
router.post(
    "/create",
    auth,
    admin,
    categoryController.createCategory
);

/* =========================
   ADMIN ONLY - UPDATE CATEGORY
========================= */
router.put(
    "/update",
    auth,
    admin,
    categoryController.updateCategory
);

/* =========================
   ADMIN ONLY - DELETE CATEGORY
========================= */
router.delete(
    "/delete/:id",
    auth,
    admin,
    categoryController.deleteCategory
);

module.exports = router;