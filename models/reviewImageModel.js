module.exports = (sequelize, DataTypes) => {

    const ReviewImage = sequelize.define("ReviewImage", {
        reviewimg_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        review_id: DataTypes.BIGINT,
        image_path: DataTypes.STRING
    }, {
        tableName: "review_images",
        timestamps: false,
        paranoid: true
    });

    ReviewImage.associate = (models) => {

        ReviewImage.belongsTo(models.Review, {
            foreignKey: "review_id",
            as: "review"
        });
    };

    return ReviewImage;
};