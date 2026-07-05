module.exports = (sequelize, DataTypes) => {

    const Review = sequelize.define("Review", {
        review_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        orderinfo_id: DataTypes.INTEGER,
        customer_id: DataTypes.INTEGER,
        item_id: DataTypes.INTEGER,
        rating: DataTypes.TINYINT,
        review_text: DataTypes.TEXT
    }, {
        tableName: "reviews",
        timestamps: true,
        paranoid: true,
        underscored: true
    });

Review.associate = (models) => {

    Review.belongsTo(models.Item, {
        foreignKey: "item_id",
        as: "item"
    });

    Review.hasMany(models.ReviewImage, {
        foreignKey: "review_id",
        as: "review_images"
    });
};

    return Review;
};