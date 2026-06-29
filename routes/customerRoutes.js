const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");

router.put("/profile", customerController.updateCustomer);

module.exports = router;