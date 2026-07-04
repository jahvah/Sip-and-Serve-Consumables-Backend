const express = require("express");
const router = express.Router();

const controller = require("../controllers/customerController");
const uploadProfile = require("../middlewares/uploadProfile");

// GET PROFILE
router.get("/profile", controller.getProfile);

// UPDATE PROFILE + IMAGE
router.put(
    "/profile",
    uploadProfile.single("profile_image"),
    controller.updateCustomer
);

module.exports = router;