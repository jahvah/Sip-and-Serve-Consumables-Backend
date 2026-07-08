const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/dashboardController");

router.get("/items-category", dashboardController.itemsPerCategory);

router.get("/orders-month", dashboardController.ordersPerMonth);

router.get("/order-status", dashboardController.orderStatus);

router.get("/summary", dashboardController.dashboardSummary);

module.exports = router;