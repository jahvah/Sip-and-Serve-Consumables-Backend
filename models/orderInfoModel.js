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
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    date_shipped: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },

    date_delivered: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },

    status: {
      type: DataTypes.ENUM("Pending", "Shipped", "Delivered", "Cancelled"),
      allowNull: false
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: "orderinfo",
    timestamps: false
  });

  OrderInfo.associate = (models) => {
    OrderInfo.belongsTo(models.Customer, {
      foreignKey: "customer_id",
      as: "customer"
    });

    OrderInfo.hasMany(models.OrderLine, {
      foreignKey: "orderinfo_id",
      as: "orderlines"
    });
  };

  return OrderInfo;
};