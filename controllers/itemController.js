const db = require("../models");
const Item = db.Item;

/* GET ALL ITEMS */
const getAllItems = async (req, res) => {
    try {

        const items = await Item.findAll({
            
            include: [
                {
                    model: db.Category,
                    as: "category"
                },
                {
                    model: db.ItemImages,
                    as: "images"
                }
            ]
        });

        return res.json({ items });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/* UPDATE ITEM (SAFE: KEEP OLD IF EMPTY) */
/* UPDATE ITEM */
const updateItem = async (req, res) => {

    try {

        console.log(req.body);

        const {

            item_id,
            item_name,
            description,
            cost_price,
            sell_price,
            category_id

        } = req.body;

        const item = await Item.findByPk(item_id);

        if (!item) {

            return res.status(404).json({
                message: "Item not found"
            });

        }

        await item.update({

            item_name:
                item_name && item_name.trim() !== ""
                    ? item_name
                    : item.item_name,

            description:
                description && description.trim() !== ""
                    ? description
                    : item.description,

            cost_price:
                cost_price && cost_price !== ""
                    ? cost_price
                    : item.cost_price,

            sell_price:
                sell_price && sell_price !== ""
                    ? sell_price
                    : item.sell_price,

            category_id:
                category_id && category_id !== ""
                    ? category_id
                    : item.category_id

        });

        return res.json({

            message: "Item updated successfully"

        });

    }

    catch (err) {

        console.log(err);

        return res.status(500).json({

            message: err.message

        });

    }

};
/* DELETE */
const deleteItem = async (req, res) => {
    try {

        await Item.destroy({
            where: { item_id: req.params.id }
        });

        return res.json({ message: "Deleted" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllItems,
    updateItem,
    deleteItem
};