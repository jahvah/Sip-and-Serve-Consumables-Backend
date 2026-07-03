module.exports = (sequelize, DataTypes) => {
  const Stock = sequelize.define("Stock", {
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: "stock",
    timestamps: false
  });

  Stock.associate = (models) => {
    Stock.belongsTo(models.Item, {
      foreignKey: "item_id"
    });
  };

  return Stock;
};