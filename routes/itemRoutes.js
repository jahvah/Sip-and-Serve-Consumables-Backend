const express = require("express");
const router = express.Router();

const controller = require("../controllers/itemController");
const uploadItem = require("../middlewares/uploadItem");

const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");

/* =========================
   PUBLIC - GET ITEMS (HOME PAGE)
========================= */
router.get("/all", controller.getAllItems);

/* =========================
   ADMIN ONLY - CREATE ITEM
========================= */
router.post(
    "/create",
    auth,
    admin,
    uploadItem.fields([
        { name: "mainImage", maxCount: 1 },
        { name: "images", maxCount: 10 }
    ]),
    controller.createItem
);

/* =========================
   ADMIN ONLY - UPDATE ITEM
========================= */
router.put(
    "/update",
    auth,
    admin,
    controller.updateItem
);

/* =========================
   ADMIN ONLY - MAIN IMAGE
========================= */
router.put(
    "/main-image/:item_id",
    auth,
    admin,
    uploadItem.single("image"),
    controller.updateMainImage
);

router.delete(
    "/main-image/:item_id",
    auth,
    admin,
    controller.deleteMainImage
);

/* =========================
   ADMIN ONLY - GALLERY IMAGES
========================= */
router.post(
    "/add-images/:item_id",
    auth,
    admin,
    uploadItem.array("images", 10),
    controller.addImages
);

router.delete(
    "/image/:id",
    auth,
    admin,
    controller.deleteImage
);

/* =========================
   ADMIN ONLY - DELETE ITEM
========================= */
router.delete(
    "/delete/:id",
    auth,
    admin,
    controller.deleteItem
);

module.exports = router;