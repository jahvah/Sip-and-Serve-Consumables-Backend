const db = require("../models");
const sendEmail = require("../utils/sendEmail");
const { orderConfirmationTemplate } = require("../utils/emailTemplates");
const { generateReceiptPDF } = require("../utils/generateReceipt");

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

    const transaction = await db.sequelize.transaction();

    try {

        const { 
            user_id,
            item_id,
            quantity = 1
        } = req.body;

        // 1. FIND CUSTOMER (IMPORTANT FIX)
        const customer = await Customer.findOne({
            where: { user_id },
            include: [{ model: db.User, as: "user" }],
            transaction
        });

        if (!customer) {
            await transaction.rollback();
            return res.status(400).json({
                message: "Customer not found"
            });
        }

        // 2. GET CART ITEMS
        let cartItems = [];

        /*
        |--------------------------------------------------------------------------
        | BUY NOW
        |--------------------------------------------------------------------------
        */
        if (item_id) {

            const item = await Item.findByPk(item_id, {
                transaction
            });

            if (!item) {
                await transaction.rollback();

                return res.status(404).json({
                    message: "Item not found"
                });
            }

            cartItems.push({
                quantity,
                Item: item
            });

        }

        /*
        |--------------------------------------------------------------------------
        | CART CHECKOUT
        |--------------------------------------------------------------------------
        */
        else {

            cartItems = await Cart.findAll({

                where: {
                    user_id
                },

                include: [{
                    model: Item
                }],

                transaction

            });

            if (!cartItems.length) {

                await transaction.rollback();

                return res.status(400).json({
                    message: "Cart is empty"
                });

            }

        }

        // 3. CREATE ORDER HEADER (NO SHIPPING)
        const order = await OrderInfo.create({
            customer_id: customer.customer_id,
            date_placed: new Date(),
            status: "Pending"
        }, { transaction });

        // Collect item details for the confirmation email as we go
        const emailItems = [];

        // 4. PROCESS ITEMS
        for (let c of cartItems) {

            const item = c.Item;

            // lock the stock row so concurrent checkouts can't both pass this check
            const stock = await Stock.findOne({
                where: { item_id: item.item_id },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!stock || stock.quantity < c.quantity) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `Not enough stock for ${item.item_name}`
                });
            }

            // create order line
            await OrderLine.create({
                orderinfo_id: order.orderinfo_id,
                item_id: item.item_id,
                quantity: c.quantity
            }, { transaction });

            // ✅ ACTUALLY DECREMENT STOCK
            await stock.update({
                quantity: stock.quantity - c.quantity
            }, { transaction });

            emailItems.push({
                name: item.item_name,
                quantity: c.quantity,
                price: item.sell_price
            });
        }

        // 5. CLEAR CART
        if (!item_id) {

            await Cart.destroy({

                where: {
                    user_id
                },

                transaction

            });

        }

        await transaction.commit();

        // 6. GENERATE PDF RECEIPT + SEND ORDER CONFIRMATION EMAIL (runs after commit; never blocks checkout response on failure)
        let receiptUrl = null;

        try {
            const recipientEmail = customer.user?.email;
            const customerName = `${customer.fname || ""} ${customer.lname || ""}`.trim() || "Customer";

            const receiptDate = order.date_placed.toDateString ? order.date_placed.toDateString() : new Date(order.date_placed).toDateString();

            const receipt = await generateReceiptPDF({
                orderId: order.orderinfo_id,
                customerName,
                customerEmail: recipientEmail,
                date: receiptDate,
                items: emailItems
            });

            // Since /uploads is served statically in server.js, the receipt is downloadable at this URL
            // (kept in the JSON response for a future frontend "download receipt" button; not linked in the email
            // body itself since the PDF is already attached and directly downloadable from the email client)
            receiptUrl = `${req.protocol}://${req.get("host")}/uploads/receipts/${receipt.fileName}`;

            if (recipientEmail) {
                await sendEmail({
                    email: recipientEmail,
                    subject: `Order Confirmation - #${order.orderinfo_id}`,
                    message: orderConfirmationTemplate({
                        customerName,
                        orderId: order.orderinfo_id,
                        date: receiptDate,
                        items: emailItems,
                        receiptUrl
                    }),
                    attachments: [
                        {
                            filename: receipt.fileName,
                            content: receipt.buffer,
                            contentType: "application/pdf"
                        }
                    ]
                });
            } else {
                console.warn(`No email found for customer_id ${customer.customer_id}; skipping confirmation email.`);
            }
        } catch (emailErr) {
            console.error("Failed to send order confirmation email or generate receipt:", emailErr.message);
        }

        res.json({
            message: "Checkout successful",
            order_id: order.orderinfo_id,
            receipt_url: receiptUrl
        });

    } catch (err) {
        console.log(err);

        if (!transaction.finished) {
            await transaction.rollback();
        }

        res.status(500).json({
            message: "Checkout error",
            error: err.message
        });
    }
};