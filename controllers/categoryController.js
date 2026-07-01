const db = require("../models");

const Category = db.Category;

/* GET ALL */
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        return res.json({ categories });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/* UPDATE */
const updateCategory = async (req, res) => {
    try {

        const { category_id, description } = req.body;

        const category = await Category.findByPk(category_id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await category.update({
            description: description ?? category.description
        });

        return res.json({ message: "Updated successfully" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/* DELETE */
const deleteCategory = async (req, res) => {
    try {

        await Category.destroy({
            where: { category_id: req.params.id }
        });

        return res.json({ message: "Deleted" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllCategories,
    updateCategory,
    deleteCategory
};