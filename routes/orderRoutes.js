const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");

router.get("/", orderController.getOrders);

router.get("/customers/search", orderController.searchCustomers);
router.get("/items/search", orderController.searchItems);

router.get("/:id", orderController.getSingleOrder);
router.post("/", orderController.createOrder);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);

module.exports = router;