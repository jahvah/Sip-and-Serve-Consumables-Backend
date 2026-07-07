const db = require("../models");

const Cart = db.Cart;
const Item = db.Item;
const Stock = db.Stock;
const OrderInfo = db.OrderInfo;
const OrderLine = db.OrderLine;
const Customer = db.Customer;

// ======================
// CHECKOUT
// ======================
exports.checkout = async (req, res) => {

    try {

        const { user_id } = req.body;

        // 1. FIND CUSTOMER (IMPORTANT FIX)
        const customer = await Customer.findOne({
            where: { user_id }
        });

        if (!customer) {
            return res.status(400).json({
                message: "Customer not found"
            });
        }

        // 2. GET CART ITEMS
        const cartItems = await Cart.findAll({
            where: { user_id },
            include: [{ model: Item }]
        });

        if (!cartItems.length) {
            return res.status(400).json({
                message: "Cart is empty"
            });
        }

        // 3. CREATE ORDER HEADER (NO SHIPPING)
        const order = await OrderInfo.create({
            customer_id: customer.customer_id,
            date_placed: new Date(),
            status: "Pending"
        });

        // 4. PROCESS ITEMS
        for (let c of cartItems) {

            const item = c.Item;

            // check stock
            const stock = await Stock.findOne({
                where: { item_id: item.item_id }
            });

            if (!stock || stock.quantity < c.quantity) {
                return res.status(400).json({
                    message: `Not enough stock for ${item.item_name}`
                });
            }

            // create order line
            await OrderLine.create({
                orderinfo_id: order.orderinfo_id,
                item_id: item.item_id,
                quantity: c.quantity
            });
        }

        // 5. CLEAR CART
        await Cart.destroy({
            where: { user_id }
        });

        res.json({
            message: "Checkout successful",
            order_id: order.orderinfo_id
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Checkout error",
            error: err.message
        });
    }
};