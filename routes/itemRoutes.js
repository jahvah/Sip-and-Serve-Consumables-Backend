const express = require("express");
const router = express.Router();

const controller = require("../controllers/itemController");

router.get("/all", controller.getAllItems);
router.put("/update", controller.updateItem);
router.delete("/delete/:id", controller.deleteItem);

module.exports = router;