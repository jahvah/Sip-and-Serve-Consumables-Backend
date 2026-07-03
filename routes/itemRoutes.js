const express = require("express");
const router = express.Router();

const controller = require("../controllers/itemController");
const uploadItem = require("../middlewares/uploadItem");

/* =========================
   CREATE ITEM
========================= */
router.post(
    "/create",
    uploadItem.fields([
        { name: "mainImage", maxCount: 1 },
        { name: "images", maxCount: 10 }
    ]),
    controller.createItem
);

/* =========================
   GET ITEMS
========================= */
router.get("/all", controller.getAllItems);

/* =========================
   UPDATE ITEM INFO
========================= */
router.put("/update", controller.updateItem);

/* =========================
   MAIN IMAGE ROUTES
========================= */
router.put(
    "/main-image/:item_id",
    uploadItem.single("image"),
    controller.updateMainImage
);

router.delete("/main-image/:item_id", controller.deleteMainImage);

/* =========================
   GALLERY IMAGE ROUTES
========================= */
router.post(
    "/add-images/:item_id",
    uploadItem.array("images", 10),
    controller.addImages
);

router.delete("/image/:id", controller.deleteImage);

/* =========================
   DELETE ITEM
========================= */
router.delete("/delete/:id", controller.deleteItem);

module.exports = router;