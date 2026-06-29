module.exports = (sequelize, DataTypes) => {

    const Stock = sequelize.define("Stock", {

        item_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }

    }, {

        tableName: "stock",
        timestamps: false

    });

    Stock.associate = (models) => {

        Stock.belongsTo(models.Item, {
            foreignKey: "item_id",
            as: "item"
        });

    };

    return Stock;
};