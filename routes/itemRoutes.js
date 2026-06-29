const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");

// GET all items (for homepage)
router.get("/", itemController.getAllProducts);


module.exports = router;