const db = require("../models");
const { Sequelize } = require("sequelize");

// ===============================
// BAR CHART
// Items Per Category
// ===============================
exports.itemsPerCategory = async (req, res) => {
    try {

        const rows = await db.Category.findAll({
            attributes: [
                "category",
                [
                    Sequelize.fn("COUNT", Sequelize.col("Items.item_id")),
                    "total"
                ]
            ],

            include: [
                {
                    association: "Items",
                    attributes: []
                }
            ],

            group: ["Category.category_id"],

            order: [["category", "ASC"]]
        });

        res.json({ rows });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: err.message
        });
    }
};

// ===============================
// LINE CHART
// Orders Per Month
// ===============================
exports.ordersPerMonth = async (req, res) => {

    try {

        const rows = await db.OrderInfo.findAll({

            attributes: [

                [
                    Sequelize.fn(
                        "MONTHNAME",
                        Sequelize.col("date_placed")
                    ),
                    "month"
                ],

                [
                    Sequelize.fn(
                        "COUNT",
                        Sequelize.col("orderinfo_id")
                    ),
                    "total"
                ]

            ],

            group: [
                Sequelize.fn(
                    "MONTH",
                    Sequelize.col("date_placed")
                )
            ],

            order: [
                [
                    Sequelize.fn(
                        "MONTH",
                        Sequelize.col("date_placed")
                    ),
                    "ASC"
                ]
            ]

        });

        res.json({ rows });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });

    }

};

// ===============================
// PIE CHART
// Order Status
// ===============================
exports.orderStatus = async (req, res) => {

    try {

        const rows = await db.OrderInfo.findAll({

            attributes: [

                "status",

                [
                    Sequelize.fn(
                        "COUNT",
                        Sequelize.col("status")
                    ),
                    "total"
                ]

            ],

            group: ["status"]

        });

        res.json({ rows });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });

    }

};


exports.dashboardSummary = async (req, res) => {

    try {

        const totalUsers = await db.User.count();

        const totalItems = await db.Item.count();

        const totalOrders = await db.OrderInfo.count();

        const sales = await db.OrderLine.findAll({

            attributes: [[
                Sequelize.fn(
                    "SUM",
                    Sequelize.literal("quantity * item.sell_price")
                ),
                "totalSales"
            ]],

            include: [{
                model: db.Item,
                as: "item",
                attributes: []
            }],

            raw: true

        });

        res.json({

            totalUsers,

            totalItems,

            totalOrders,

            totalSales: Number(sales[0].totalSales || 0)

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });

    }

};