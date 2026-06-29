module.exports = (sequelize, DataTypes) => {

    const OrderInfo = sequelize.define("OrderInfo", {

        orderinfo_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        date_placed: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },

        status: {
            type: DataTypes.ENUM("Pending", "Paid", "Cancelled"),
            defaultValue: "Pending"
        }

    }, {
        tableName: "orderinfo",
        timestamps: false
    });

    OrderInfo.associate = (models) => {

        OrderInfo.hasMany(models.OrderLine, {
            foreignKey: "orderinfo_id",
            as: "lines"
        });

    };

    return OrderInfo;
};