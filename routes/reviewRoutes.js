const express = require("express");
const router = express.Router();
const controller = require("../controllers/reviewController");
const upload = require("../middlewares/uploadReview"); // if you use multer

router.get("/customer", controller.getCustomerByUserId);
router.get("/pending", controller.getPendingReviews);
router.get("/history", controller.getReviewHistory);
router.get("/:id", controller.getReview);

router.post("/", upload.array("images", 5), controller.createReview);
router.put("/:id", upload.array("images", 5), controller.updateReview);

module.exports = router;