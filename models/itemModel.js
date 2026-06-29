module.exports = (sequelize, DataTypes) => {

    const Item = sequelize.define("Item", {

        item_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        item_name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        cost_price: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },

        sell_price: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },

        category_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },

        image: {
            type: DataTypes.STRING,
            allowNull: true
        }

    }, {

        tableName: "item",
        timestamps: false

    });

    Item.associate = (models) => {

        Item.hasMany(models.ItemImage, {
            foreignKey: "item_id",
            as: "images"
        });

        Item.hasOne(models.Stock, {
            foreignKey: "item_id",
            as: "stock"
        });

        Item.belongsTo(models.Category, {
            foreignKey: "category_id",
            as: "category"
        });

    };

    return Item;
};