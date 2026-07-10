const db = require("../models");

const Review = db.Review;
const ReviewImage = db.ReviewImage;
const Customer = db.Customer;
const OrderInfo = db.OrderInfo;
const OrderLine = db.OrderLine;
const Item = db.Item;
const sequelize = db.sequelize;

/* =========================
   ADMIN GET ALL REVIEWS
========================= */
const getAllReviews = async (req, res) => {

    try {

        const limit = Number(req.query.limit) || 10;
        const offset = Number(req.query.offset) || 0;


        const reviews = await Review.findAll({

            include: [

                {
                    model: Customer,
                    as: "customer",
                    attributes:[
                        "fname",
                        "lname"
                    ]
                },

                {
                    model: Item,
                    as:"item",
                    attributes:[
                        "item_name",
                        "image"
                    ]
                },

                {
                    model: ReviewImage,
                    as:"review_images",
                    attributes:[
                        "image_path"
                    ]
                }

            ],

            limit,
            offset,

            order:[
                ["review_id","DESC"]
            ]

        });


        const total = await Review.count();


        const data = reviews.map(review => ({

            review_id: review.review_id,

            customer_name:
            `${review.customer?.fname || ""} ${review.customer?.lname || ""}`,

            item_name:
            review.item?.item_name || "",

            item_image:
            review.item?.image || null,

            rating:
            review.rating,

            review_text:
            review.review_text,

            review_images:
            review.review_images || [],

            created_at:
            review.createdAt

        }));


        return res.json({

            reviews:data,

            total

        });


    }
    catch(err){

        return res.status(500).json({
            message:err.message
        });

    }

};

/* =========================
   GET CUSTOMER BY USER ID
========================= */
const getCustomerByUserId = async (req, res) => {
  try {
    const { user_id } = req.query;

    const customer = await Customer.findOne({
      where: { user_id },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.json({
      customer_id: customer.customer_id,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET PENDING REVIEWS
========================= */
const getPendingReviews = async (req, res) => {
  try {
    const { user_id } = req.query;

    const customer = await Customer.findOne({
      where: { user_id },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const orders = await OrderInfo.findAll({
      where: {
        customer_id: customer.customer_id,
        status: "Delivered",
      },
      include: [
        {
          model: OrderLine,
          as: "orderlines",
          include: [
            {
              model: Item,
              as: "item",
              include: [
                {
                  model: db.ItemImages,
                  as: "images",
                },
              ],
            },
          ],
        },
      ],
      order: [["orderinfo_id", "DESC"]],
    });

    const reviews = await Review.findAll({
      where: { customer_id: customer.customer_id },
    });

    const reviewedSet = new Set(
      reviews.map((r) => `${r.orderinfo_id}-${r.item_id}`),
    );

    let pending = [];

    orders.forEach((order) => {
      order.orderlines.forEach((line) => {
        const key = `${order.orderinfo_id}-${line.item_id}`;

        if (!reviewedSet.has(key)) {
          pending.push({
            orderinfo_id: order.orderinfo_id,
            item_id: line.item_id,
            item_name: line.item?.item_name || "",
            image: line.item?.image
              ? line.item.image
              : line.item?.images?.length > 0
                ? line.item.images[0].image_path
                : "no-image.png",
            quantity: line.quantity,
            date_delivered: order.date_delivered,
          });
        }
      });
    });

    return res.json({ pending });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET REVIEW HISTORY (FIXED ALIAS)
========================= */
const getReviewHistory = async (req, res) => {
  try {
    const { user_id } = req.query;

    const customer = await Customer.findOne({
      where: { user_id },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const reviews = await Review.findAll({
      where: { customer_id: customer.customer_id },

      include: [
        {
          model: Item,
          as: "item", // MUST MATCH reviewModel.js alias
        },
        {
          model: ReviewImage,
          as: "review_images", // MUST MATCH reviewModel.js alias
        },
      ],

      order: [["review_id", "DESC"]],
    });

    return res.json({ reviews });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   CREATE REVIEW
========================= */
const createReview = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { customer_id, orderinfo_id, item_id, rating, review_text } =
      req.body;

    const existing = await Review.findOne({
      where: { customer_id, orderinfo_id, item_id },
    });

    if (existing) {
      await transaction.rollback();
      return res.status(400).json({ message: "Already reviewed" });
    }

    const review = await Review.create(
      {
        customer_id,
        orderinfo_id,
        item_id,
        rating,
        review_text,
      },
      { transaction },
    );

    if (req.files?.length) {
      const images = req.files.slice(0, 5).map((file) => ({
        review_id: review.review_id,
        image_path: file.filename,
      }));

      await ReviewImage.bulkCreate(images, { transaction });
    }

    await transaction.commit();

    return res.json({ message: "Review created successfully" });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   UPDATE REVIEW
========================= */
const updateReview = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      await transaction.rollback();
      return res.status(404).json({ message: "Review not found" });
    }

    await review.update(
      {
        rating: req.body.rating,
        review_text: req.body.review_text,
      },
      { transaction },
    );

    if (req.body.delete_images) {
      const ids = JSON.parse(req.body.delete_images);

      await ReviewImage.destroy({
        where: { reviewimg_id: ids },
        transaction,
      });
    }

    if (req.files?.length) {
      const images = req.files.map((file) => ({
        review_id: review.review_id,
        image_path: file.filename,
      }));

      await ReviewImage.bulkCreate(images, { transaction });
    }

    await transaction.commit();

    return res.json({ message: "Review updated successfully" });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET SINGLE REVIEW
========================= */
const getReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id, {
      include: [
        {
          model: Item,
          as: "item",
        },
        {
          model: ReviewImage,
          as: "review_images",
        },
        {
          model: Customer,
          as: "customer",
        },
      ],
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    return res.json({ review });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   EXPORTS
========================= */
module.exports = {
  getCustomerByUserId,
  getPendingReviews,
  getReviewHistory,
  createReview,
  updateReview,
  getReview,
  getAllReviews,
};
