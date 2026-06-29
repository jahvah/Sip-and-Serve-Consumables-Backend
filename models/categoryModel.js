module.exports = (sequelize, DataTypes) => {

    const Category = sequelize.define("Category", {

        category_id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },

        description: {
            type: DataTypes.STRING,
            allowNull: false
        }

    }, {

        tableName: "category",
        timestamps: false

    });

    Category.associate = (models) => {

        Category.hasMany(models.Item, {
            foreignKey: "category_id",
            as: "items"
        });

    };

    return Category;
};