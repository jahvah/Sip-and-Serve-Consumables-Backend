const db = require("../models");

const Cart = db.Cart;
const Item = db.Item;
const Stock = db.Stock;

// ======================
// ADD TO CART
// ======================
exports.addToCart = async (req, res) => {

    try {

        const { user_id, item_id, quantity } = req.body;

        const stock = await db.Stock.findOne({
            where: { item_id }
        });

        if (stock && quantity > stock.quantity) {
            return res.status(400).json({
                message: `Only ${stock.quantity} items available`
            });
        }

        const existing = await Cart.findOne({
            where: { user_id, item_id }
        });

        if (existing) {

            let newQty = existing.quantity + Number(quantity);

            if (newQty > stock.quantity) {
                return res.status(400).json({
                    message: `Only ${stock.quantity} items available`
                });
            }

            existing.quantity = newQty;
            await existing.save();

            return res.json({
                success: true,
                message: "Cart updated"
            });
        }

        await Cart.create({
            user_id,
            item_id,
            quantity
        });

        res.json({
            success: true,
            message: "Item added"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
};


// ======================
// GET USER CART
// ======================
exports.getCart = async (req, res) => {

    try {

        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "Missing user_id"
            });
        }

        const cart = await Cart.findAll({

            where: { user_id },

            include: [
                {
                    model: Item
                }
            ]

        });

        return res.json(cart);

    } catch (err) {

        console.log("GET CART ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });

    }
};

exports.updateCart = async (req, res) => {

    try {

        const { user_id, item_id, change } = req.body;

        // get stock
        const stock = await Stock.findOne({
            where: { item_id }
        });

        const cart = await Cart.findOne({
            where: { user_id, item_id }
        });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        let newQty = cart.quantity + change;

        // ❌ prevent going below 1
        if (newQty < 1) {
            await cart.destroy();
            return res.json({ message: "Item removed" });
        }

        // ❌ STOCK LIMIT CHECK
        if (stock && newQty > stock.quantity) {
            return res.status(400).json({
                message: `Only ${stock.quantity} items available in stock`
            });
        }

        cart.quantity = newQty;
        await cart.save();

        res.json({
            success: true,
            quantity: cart.quantity
        });

    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
};

// ======================
// REMOVE ITEM FROM CART
// ======================
exports.removeItem = async (req, res) => {
  try {
    const { item_id } = req.body;
    const user_id = req.body.user_id;

    await Cart.destroy({
      where: { user_id, item_id }
    });

    res.json({ success: true, message: "Removed" });

  } catch (err) {
    res.status(500).json(err);
  }
};