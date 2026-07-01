module.exports = (sequelize, DataTypes) => {

const ItemImages = sequelize.define("ItemImages", {
    itemimg_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    item_id: DataTypes.INTEGER,
    image_path: DataTypes.STRING
}, {
    tableName: "item_images",
    timestamps: true,
    paranoid: true,
    underscored: true
});

ItemImages.associate = (models) => {

    ItemImages.belongsTo(models.Item, {
        foreignKey: "item_id",
        as: "item"
    });

};

return ItemImages;
};