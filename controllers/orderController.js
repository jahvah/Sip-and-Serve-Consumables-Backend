const db = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const sendEmail = require("../utils/sendEmail");
const { orderStatusUpdateTemplate } = require("../utils/emailTemplates");

const OrderInfo = db.OrderInfo;
const OrderLine = db.OrderLine;
const Item = db.Item;
const Stock = db.Stock;
const Customer = db.Customer;
const sequelize = db.sequelize;

/* =========================
   GET ALL ORDERS
========================= */
const getOrders = async (req, res) => {
  try {
    const draw = Number(req.query.draw) || 1;
    const start = Number(req.query.start) || 0;
    const length = Number(req.query.length) || 10;
    const search = req.query.search?.value || "";

    const where = {
      deleted_at: null,
    };

    if (search) {
      where[Op.or] = [
        { status: { [Op.like]: `%${search}%` } },
        { "$customer.fname$": { [Op.like]: `%${search}%` } },
        { "$customer.lname$": { [Op.like]: `%${search}%` } },
      ];
    }

    const recordsTotal = await OrderInfo.count({
      where: { deleted_at: null },
    });

    const recordsFiltered = await OrderInfo.count({
      where,
      include: [
        {
          model: Customer,
          as: "customer",
        },
      ],
    });

    const orders = await OrderInfo.findAll({
      where,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customer_id", "fname", "lname", "phone"],
        },
        {
          model: OrderLine,
          as: "orderlines",
          where: { deleted_at: null },
          required: false,
          include: [
            {
              model: Item,
              as: "item",
              attributes: ["item_id", "item_name", "sell_price"],
            },
          ],
        },
      ],
      offset: start,
      limit: length,
      order: [["orderinfo_id", "DESC"]],
    });

    return res.json({
      draw,
      recordsTotal,
      recordsFiltered,
      data: orders,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   GET SINGLE ORDER
========================= */
const getSingleOrder = async (req, res) => {
  try {
    const order = await OrderInfo.findOne({
      where: {
        orderinfo_id: req.params.id,
        deleted_at: null,
      },
      include: [
        {
          model: Customer,
          as: "customer",
        },
        {
          model: OrderLine,
          as: "orderlines",
          where: { deleted_at: null },
          required: false,
          include: [
            {
              model: Item,
              as: "item",
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   CREATE ORDER
========================= */

const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { customer_id, date_placed, orderlines } = req.body;

    if (!customer_id || !date_placed) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Customer ID and date placed are required",
      });
    }

    if (!Array.isArray(orderlines) || orderlines.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "At least one order item is required",
      });
    }

    /* =========================
      VALIDATE QUANTITIES
    ========================= */

    for (const line of orderlines) {

        if (!line.item_id) {
            continue;
        }

        if (
            line.quantity === undefined ||
            line.quantity === null ||
            line.quantity === "" ||
            Number(line.quantity) <= 0
        ) {

            await transaction.rollback();

            return res.status(400).json({
                message: "Please set a valid quantity for every selected item."
            });

        }

    }

    /* =========================
        STOCK VALIDATION (OPTION A FIX)
    ========================= */
    for (const line of orderlines) {
      if (!line.item_id) continue;

      const stock = await Stock.findOne({
        where: { item_id: line.item_id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!stock) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Stock record not found for item ID ${line.item_id}`,
        });
      }

      if (Number(line.quantity) > (stock.quantity || 0)) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Quantity exceeded stock for item ID ${line.item_id}`,
        });
      }
    }

    /* =========================
       CREATE ORDER HEADER
    ========================= */
    const order = await OrderInfo.create(
      {
        customer_id,
        date_placed,
        date_shipped: null,
        date_delivered: null,
        status: "Pending",
      },
      { transaction },
    );

    /* =========================
       CREATE ORDER LINES
    ========================= */
    for (const line of orderlines) {
      if (!line.item_id) continue;

      await OrderLine.create(
        {
          orderinfo_id: order.orderinfo_id,
          item_id: line.item_id,
          quantity: Number(line.quantity),
        },
        { transaction },
      );
    }

    await transaction.commit();

    return res.json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    await transaction.rollback();

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   UPDATE ORDER
========================= */
const updateOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await OrderInfo.findOne({
      where: {
        orderinfo_id: req.params.id,
        deleted_at: null,
      },
      include: [
        {
          model: Customer,
          as: "customer",
          include: [
            {
              model: db.User,
              as: "user",
            },
          ],
        },
      ],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const oldStatus = order.status;

    const {
      customer_id,
      date_placed,
      date_shipped,
      date_delivered,
      status,
      orderlines,
    } = req.body;

    const newCustomerId =
      customer_id && customer_id !== "" ? customer_id : order.customer_id;

    const newDatePlaced =
      date_placed && date_placed !== "" ? date_placed : order.date_placed;

    const newDateShipped =
      date_shipped && date_shipped !== "" ? date_shipped : order.date_shipped;

    const newDateDelivered =
      date_delivered && date_delivered !== ""
        ? date_delivered
        : order.date_delivered;

    const newStatus = status && status !== "" ? status : order.status;

    await order.update(
      {
        customer_id: order.customer_id,
        date_placed: order.date_placed,
        date_shipped: newDateShipped,
        date_delivered: newDateDelivered,
        status: newStatus,
      },
      { transaction },
    );

    if (Array.isArray(orderlines) && orderlines.length > 0) {
      for (const line of orderlines) {
        if (!line.item_id) {
          continue;
        }

        const existingLine = await OrderLine.findOne({
          where: {
            orderinfo_id: order.orderinfo_id,
            item_id: line.item_id,
          },
          transaction,
        });

        if (existingLine) {
          const newQuantity =
            line.quantity && line.quantity !== ""
              ? line.quantity
              : existingLine.quantity;

          await existingLine.update(
            {
              quantity: newQuantity,
              deleted_at: null,
            },
            { transaction },
          );
        } else {
          await OrderLine.create(
            {
              orderinfo_id: order.orderinfo_id,
              item_id: line.item_id,
              quantity: Number(line.quantity),
            },
            { transaction },
          );
        }
      }
    }

    if (oldStatus !== "Shipped" && newStatus === "Shipped") {
      await reduceStock(order.orderinfo_id, transaction);
    }

    await transaction.commit();

    // SEND STATUS UPDATE EMAIL (only if the status actually changed; never blocks the response)
    if (oldStatus !== newStatus) {
      try {
        const recipientEmail = order.customer?.user?.email;

        if (recipientEmail) {
          const customerName =
            `${order.customer.fname || ""} ${order.customer.lname || ""}`.trim() ||
            "Customer";

          await sendEmail({
            email: recipientEmail,
            subject: `Order #${order.orderinfo_id} Status Update`,
            message: orderStatusUpdateTemplate({
              customerName,
              orderId: order.orderinfo_id,
              oldStatus,
              newStatus,
            }),
          });
        } else {
          console.warn(
            `No email found for order ${order.orderinfo_id}; skipping status update email.`,
          );
        }
      } catch (emailErr) {
        console.error(
          "Failed to send order status update email:",
          emailErr.message,
        );
      }
    }

    return res.json({
      message: "Order updated successfully",
    });
  } catch (err) {
    await transaction.rollback();

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   DELETE ORDER
========================= */
const deleteOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await OrderInfo.findOne({
      where: {
        orderinfo_id: req.params.id,
        deleted_at: null,
      },
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Order not found",
      });
    }

    await order.update(
      {
        deleted_at: new Date(),
      },
      { transaction },
    );

    await OrderLine.update(
      {
        deleted_at: new Date(),
      },
      {
        where: {
          orderinfo_id: order.orderinfo_id,
        },
        transaction,
      },
    );

    await transaction.commit();

    return res.json({
      message: "Order deleted successfully",
    });
  } catch (err) {
    await transaction.rollback();

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   REDUCE STOCK WHEN SHIPPED
========================= */
const reduceStock = async (orderinfo_id, transaction) => {
  const orderlines = await OrderLine.findAll({
    where: {
      orderinfo_id,
      deleted_at: null,
    },
    transaction,
  });

  for (const line of orderlines) {
    const stock = await Stock.findOne({
      where: {
        item_id: line.item_id,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!stock) {
      throw new Error(`Stock record not found for item ID ${line.item_id}`);
    }

    if ((stock.quantity || 0) < (line.quantity || 0)) {
      throw new Error(`Not enough stock for item ID ${line.item_id}`);
    }

    await stock.update(
      {
        quantity: stock.quantity - line.quantity,
      },
      { transaction },
    );
  }
};

/* =========================
   DOWNLOAD ORDER RECEIPT (PDF) - ADMIN
========================= */
const downloadReceipt = async (req, res) => {
  try {
    const order = await OrderInfo.findOne({
      where: {
        orderinfo_id: req.params.id,
        deleted_at: null,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const fileName = `receipt-order-${order.orderinfo_id}.pdf`;
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "receipts",
      fileName,
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message:
          "Receipt not found for this order. It may not have been generated yet.",
      });
    }

    return res.download(filePath, fileName);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   DOWNLOAD ORDER RECEIPT (PDF) - CUSTOMER (own orders only)
========================= */
const downloadReceiptForCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: {
        user_id: req.params.user_id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const order = await OrderInfo.findOne({
      where: {
        orderinfo_id: req.params.order_id,
        customer_id: customer.customer_id,
        deleted_at: null,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const fileName = `receipt-order-${order.orderinfo_id}.pdf`;
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "receipts",
      fileName,
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message:
          "Receipt not found for this order. It may not have been generated yet.",
      });
    }

    return res.download(filePath, fileName);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const searchCustomers = async (req, res) => {
  try {
    const search = req.query.term || "";

    const customers = await Customer.findAll({
      where: {
        [Op.or]: [
          { fname: { [Op.like]: `%${search}%` } },
          { lname: { [Op.like]: `%${search}%` } },
        ],
      },
      attributes: ["customer_id", "fname", "lname", "phone"],
      limit: 20,
      order: [["customer_id", "DESC"]],
    });

    return res.json({ customers });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const searchItems = async (req, res) => {
  try {
    const search = req.query.term || "";

    const items = await Item.findAll({
      where: {
        item_name: {
          [Op.like]: `%${search}%`,
        },
      },
      attributes: ["item_id", "item_name", "sell_price"],
      include: [
        {
          model: Stock,
          as: "stock",
          attributes: ["quantity"],
        },
      ],
      limit: 20,
      order: [["item_name", "ASC"]],
    });

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET CUSTOMER ORDERS
========================= */
const getCustomerOrders = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: {
        user_id: req.params.user_id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const orders = await OrderInfo.findAll({
      where: {
        customer_id: customer.customer_id,
        deleted_at: null,
      },

      include: [
        {
          model: OrderLine,
          as: "orderlines",
          where: {
            deleted_at: null,
          },
          required: false,
          include: [
            {
              model: Item,
              as: "item",
              attributes: ["item_id", "item_name", "sell_price"],
            },
          ],
        },
      ],

      order: [["orderinfo_id", "DESC"]],
    });

    return res.json({
      orders,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   CUSTOMER CANCEL ORDER
========================= */
const cancelCustomerOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const customer = await Customer.findOne({
      where: {
        user_id: req.params.user_id,
      },
      transaction,
    });

    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const order = await OrderInfo.findOne({
      where: {
        orderinfo_id: req.params.order_id,
        customer_id: customer.customer_id,
        deleted_at: null,
      },
      include: [
        {
          model: OrderLine,
          as: "orderlines",
          where: { deleted_at: null },
          required: false,
        },
      ],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.status !== "Pending") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Only pending orders can be cancelled.",
      });
    }

    // =========================
    // 🔁 RESTORE STOCK
    // =========================
    for (const line of order.orderlines) {
      const stock = await Stock.findOne({
        where: { item_id: line.item_id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (stock) {
        stock.quantity += line.quantity;
        await stock.save({ transaction });
      }
    }

    // =========================
    // CANCEL ORDER
    // =========================
    await order.update(
      {
        status: "Cancelled",
      },
      { transaction },
    );

    await transaction.commit();

    return res.json({
      message: "Order cancelled and stock restored successfully.",
    });
  } catch (err) {
    await transaction.rollback();

    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  getOrders,
  getSingleOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  downloadReceipt,
  downloadReceiptForCustomer,
  searchCustomers,
  searchItems,
  getCustomerOrders,
  cancelCustomerOrder,
};
