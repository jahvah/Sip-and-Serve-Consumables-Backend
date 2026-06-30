const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/all", userController.getAllUsers);
router.put("/update", userController.updateUser);
router.delete("/delete/:id", userController.deleteUser);
router.get("/customer/:userId", userController.getCustomerByUserId);
module.exports = router;