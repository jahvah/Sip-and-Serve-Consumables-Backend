const db = require("../models");

const Item = db.Item;
const Category = db.Category;
const ItemImage = db.ItemImage;
const Stock = db.Stock;

const getAllProducts = async (req, res) => {

    try {

        const items = await Item.findAll({
            include: [
                {
                    model: ItemImage,
                    as: "images"
                },
                {
                    model: Stock,
                    as: "stock"
                },
                {
                    model: Category,
                    as: "category"
                }
            ]
        });

        res.json(items);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }

};

module.exports = {
    getAllProducts
};