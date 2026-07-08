const db = require("../models");
const Item = db.Item;

/* =========================
   GET ALL ITEMS
========================= */
const getAllItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      include: [
        {
          model: db.Category,
          as: "category",
        },
        {
          model: db.ItemImages,
          as: "images",
        },

        {
          model: db.Stock,
          as: "stock",
        },
      ],
    });

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET ITEM DETAILS
========================= */
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByPk(id, {
      include: [
        {
          model: db.Category,
          as: "category",
        },
        {
          model: db.ItemImages,
          as: "images",
        },
        {
          model: db.Stock,
          as: "stock",
        },
        {
          model: db.Review,
          as: "reviews",
          include: [
            {
              model: db.Customer,
              as: "customer",
              attributes: ["fname", "lname"],
            },
            {
              model: db.ReviewImage,
              as: "review_images",
              attributes: ["image_path"],
            },
          ],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.json({
      item: {
        item_id: item.item_id,
        item_name: item.item_name,
        description: item.description,
        cost_price: item.cost_price,
        sell_price: item.sell_price,
        category_id: item.category_id,
        category: item.category || null,
        image: item.image,
        images: item.images || [],
        stock: item.stock || null,
        reviews: (item.reviews || []).map((review) => ({
          review_id: review.review_id,
          rating: review.rating,
          review_text: review.review_text,
          created_at: review.createdAt,
          customer: {
            name:
              `${review.customer?.fname || ""} ${review.customer?.lname || ""}`.trim() ||
              "Customer",
          },
          review_images: review.review_images || [],
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   CREATE ITEM
========================= */
const createItem = async (req, res) => {
  try {
    const {
      item_name,
      description,
      cost_price,
      sell_price,
      category_id,
      quantity,
    } = req.body;

    if (
      !item_name ||
      !description ||
      !cost_price ||
      !sell_price ||
      !category_id
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // MAIN IMAGE
    let mainImage = null;

    if (req.files && req.files.mainImage && req.files.mainImage.length > 0) {
      mainImage = "uploads/items/" + req.files.mainImage[0].filename;
    }

    const item = await Item.create({
      item_name: item_name.trim(),
      description: description.trim(),
      cost_price,
      sell_price,
      category_id,
      image: mainImage,
    });

    // =========================
    // STOCK CREATE (NEW)
    // =========================
    await db.Stock.create({
      item_id: item.item_id,
      quantity: quantity && quantity !== "" ? quantity : 0,
    });

    // GALLERY IMAGES
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        await db.ItemImages.create({
          item_id: item.item_id,
          image_path: "uploads/items/" + file.filename,
        });
      }
    }

    return res.json({
      message: "Item created successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   UPDATE ITEM (BASIC INFO + STOCK)
========================= */
const updateItem = async (req, res) => {
  try {
    const {
      item_id,
      item_name,
      description,
      cost_price,
      sell_price,
      category_id,
      quantity,
    } = req.body;

    const item = await Item.findByPk(item_id);

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    const newItemName =
      item_name && item_name.trim() !== "" ? item_name.trim() : item.item_name;

    const newDescription =
      description && description.trim() !== ""
        ? description.trim()
        : item.description;

    const newCostPrice =
      cost_price && cost_price !== "" ? cost_price : item.cost_price;

    const newSellPrice =
      sell_price && sell_price !== "" ? sell_price : item.sell_price;

    const newCategoryId =
      category_id && category_id !== "" ? category_id : item.category_id;

    // NO CHANGE CHECK (excluding stock for safety)
    const stock = await db.Stock.findOne({
      where: { item_id },
    });

    const currentQty = stock ? stock.quantity : 0;

    if (
      newItemName === item.item_name &&
      newDescription === item.description &&
      Number(newCostPrice) === Number(item.cost_price) &&
      Number(newSellPrice) === Number(item.sell_price) &&
      Number(newCategoryId) === Number(item.category_id) &&
      Number(quantity || currentQty) === Number(currentQty)
    ) {
      return res.status(400).json({
        message: "No changes were made.",
      });
    }

    // UPDATE ITEM
    await item.update({
      item_name: newItemName,
      description: newDescription,
      cost_price: newCostPrice,
      sell_price: newSellPrice,
      category_id: newCategoryId,
    });

    // =========================
    // STOCK UPDATE (NEW)
    // =========================
    if (stock) {
      await stock.update({
        quantity:
          quantity !== undefined && quantity !== "" ? quantity : stock.quantity,
      });
    } else {
      await db.Stock.create({
        item_id: item_id,
        quantity: quantity || 0,
      });
    }

    return res.json({
      message: "Item updated successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   REPLACE MAIN IMAGE
========================= */
const updateMainImage = async (req, res) => {
  try {
    const { item_id } = req.params;

    const item = await Item.findByPk(item_id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const newImagePath = "uploads/items/" + req.file.filename;

    await item.update({
      image: newImagePath,
    });

    return res.json({
      message: "Main image updated",
      image: newImagePath,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   DELETE MAIN IMAGE
========================= */
const deleteMainImage = async (req, res) => {
  try {
    const { item_id } = req.params;

    const item = await Item.findByPk(item_id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.update({
      image: null,
    });

    return res.json({ message: "Main image removed" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   ADD GALLERY IMAGES (LIVE)
========================= */
const addImages = async (req, res) => {
  try {
    const { item_id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    for (const file of req.files) {
      await db.ItemImages.create({
        item_id,
        image_path: "uploads/items/" + file.filename,
      });
    }

    return res.json({ message: "Images added" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   DELETE GALLERY IMAGE (LIVE)
========================= */
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await db.ItemImages.findByPk(id);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    await image.destroy();

    return res.json({ message: "Image deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   DELETE ITEM
========================= */
const deleteItem = async (req, res) => {
  try {
    await Item.destroy({
      where: { item_id: req.params.id },
    });

    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   SEARCH ITEMS
========================= */

const { Op } = require("sequelize");

const searchItems = async (req, res) => {

    try{

        const keyword = req.query.keyword || "";

        const items = await Item.findAll({

            where:{
                item_name:{
                    [Op.like]: `%${keyword}%`
                }
            },

            attributes:[
                "item_id",
                "item_name"
            ],

            limit:10

        });

        res.json({
            items
        });

    }

    catch(err){

        res.status(500).json({
            message:err.message
        });

    }

};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  updateMainImage,
  deleteMainImage,
  addImages,
  deleteImage,
  deleteItem,
  searchItems
};
