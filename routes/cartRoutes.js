const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

router.post("/add", cartController.addToCart);
router.get("/:user_id", cartController.getCart);
router.post("/update", cartController.updateCart);
router.post("/remove", cartController.removeItem);

module.exports = router;