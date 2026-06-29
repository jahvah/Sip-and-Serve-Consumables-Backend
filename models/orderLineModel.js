module.exports = (sequelize, DataTypes) => {

    const OrderLine = sequelize.define("OrderLine", {

        orderinfo_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        item_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        }

    }, {
        tableName: "orderline",
        timestamps: false
    });

    OrderLine.associate = (models) => {

        OrderLine.belongsTo(models.Item, {
            foreignKey: "item_id",
            as: "item"
        });

        OrderLine.belongsTo(models.OrderInfo, {
            foreignKey: "orderinfo_id",
            as: "order"
        });

    };

    return OrderLine;
};