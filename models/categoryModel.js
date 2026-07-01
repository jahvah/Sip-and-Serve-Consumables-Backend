module.exports = (sequelize, DataTypes) => {

    const Category = sequelize.define("Category", {

        category_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },

        description: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }

    }, {
        tableName: "category",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        paranoid: true,
        deletedAt: "deleted_at"
    });

    return Category;
};