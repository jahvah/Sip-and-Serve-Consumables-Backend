module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define("Item", {
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    item_name: DataTypes.STRING,
    description: DataTypes.TEXT,
    cost_price: DataTypes.DECIMAL(7, 2),
    sell_price: DataTypes.DECIMAL(7, 2),
    category_id: DataTypes.BIGINT,
    image: DataTypes.STRING
  }, {
    tableName: "item",
    timestamps: true,
    paranoid: true,
    underscored: true
  });

  Item.associate = (models) => {
    Item.belongsTo(models.Category, {
      foreignKey: "category_id",
      as: "category"
    });

    Item.hasMany(models.ItemImages, {
      foreignKey: "item_id",
      as: "images"
    });

    Item.hasMany(models.OrderLine, {
      foreignKey: "item_id",
      as: "orderlines"
    });

    Item.hasOne(models.Stock, {
      foreignKey: "item_id",
      as: "stock"
    });
  };

  return Item;
};