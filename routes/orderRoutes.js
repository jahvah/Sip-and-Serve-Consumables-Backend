const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");

/* =====================================================
   AUTH REQUIRED FOR ALL ORDER ROUTES
===================================================== */
router.use(auth);

/* =====================================================
   CUSTOMER ROUTES
   (Authenticated customers can access these)
===================================================== */

// View own orders
router.get(
    "/customer/:user_id",
    orderController.getCustomerOrders
);

// Cancel own pending order
router.put(
    "/customer/:user_id/cancel/:order_id",
    orderController.cancelCustomerOrder
);

/* =====================================================
   ADMIN ROUTES
===================================================== */
router.use(admin);

// Get all orders
router.get(
    "/",
    orderController.getOrders
);

// Search customers
router.get(
    "/customers/search",
    orderController.searchCustomers
);

// Search items
router.get(
    "/items/search",
    orderController.searchItems
);

// Get single order
router.get(
    "/:id",
    orderController.getSingleOrder
);

// Create order
router.post(
    "/",
    orderController.createOrder
);

// Update order
router.put(
    "/:id",
    orderController.updateOrder
);

// Delete order
router.delete(
    "/:id",
    orderController.deleteOrder
);

module.exports = router;