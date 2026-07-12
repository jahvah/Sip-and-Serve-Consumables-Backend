const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const upload = require("../middlewares/upload");
const uploadProfile = require("../middlewares/uploadProfile");

const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");

/* =========================
   PUBLIC ROUTES
========================= */

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

/* =========================
   ACCOUNT PROFILE
========================= */

router.get(
    "/profile",
    auth,
    userController.getProfile
);

router.put(
    "/profile",
    auth,
    uploadProfile.single("profile_image"),
    userController.updateProfile
);

/* =========================
   ADMIN ONLY ROUTES
========================= */

router.get(
    "/",
    auth,
    admin,
    userController.getUsers
);

router.get(
    "/all",
    auth,
    admin,
    userController.getAllUsers
);

router.delete(
    "/delete/:id",
    auth,
    admin,
    userController.deleteUser
);

router.post(
    "/create",
    auth,
    admin,
    upload.single("image"),
    userController.createCustomer
);

/* =========================
   AUTHENTICATED USER ROUTES
========================= */

router.put(
    "/update-full",
    auth,
    upload.single("image"),
    userController.updateFullUser
);

module.exports = router;