"use strict";

module.exports = (sequelize, DataTypes) => {

    const ItemImage = sequelize.define("ItemImage", {
        itemimg_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        item_id: DataTypes.INTEGER,
        image_path: DataTypes.STRING,
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: "item_images",
        timestamps: false
    });

    ItemImage.associate = (models) => {
        ItemImage.belongsTo(models.Item, {
            foreignKey: "item_id",
            as: "item"
        });
    };

    return ItemImage;
};