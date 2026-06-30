const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require("../middlewares/upload");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/all", userController.getAllUsers);
router.delete("/delete/:id", userController.deleteUser);
router.put("/update-full",upload.single("image"),userController.updateFullUser);
module.exports = router;
