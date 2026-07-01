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

/* CREATE */
const createCategory = async (req, res) => {

    try {

        const { category } = req.body;

        if (!category || category.trim() === "") {
            return res.status(400).json({
                message: "category is required."
            });
        }

        await Category.create({
            category: category.trim()
        });

        return res.json({
            message: "Category created successfully."
        });

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });

    }

};

/* UPDATE */
/* UPDATE */
const updateCategory = async (req, res) => {

    try {

        const { category_id, category } = req.body;

        const existingCategory = await Category.findByPk(category_id);

        if (!existingCategory) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        if (!category || category.trim() === "") {
            return res.status(400).json({
                message: "Category is required."
            });
        }

        if (existingCategory.category === category.trim()) {
            return res.status(400).json({
                message: "No changes were made."
            });
        }

        await existingCategory.update({
            category: category.trim()
        });

        return res.json({
            message: "Category updated successfully."
        });

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });

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
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
};