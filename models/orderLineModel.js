module.exports = (sequelize, DataTypes) => {
  const OrderLine = sequelize.define("OrderLine", {
    orderinfo_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },

    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },

    quantity: {
      type: DataTypes.TINYINT,
      allowNull: true
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: "orderline",
    timestamps: false
  });

  OrderLine.associate = (models) => {
    OrderLine.belongsTo(models.OrderInfo, {
      foreignKey: "orderinfo_id",
      as: "order"
    });

    OrderLine.belongsTo(models.Item, {
      foreignKey: "item_id",
      as: "item"
    });
  };

  return OrderLine;
};