module.exports = (sequelize, DataTypes) => {

  const Cart = sequelize.define("Cart", {

    cart_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },

    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }

  }, {
    tableName: "cart",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });

  Cart.associate = (models) => {

    Cart.belongsTo(models.User, {
      foreignKey: "user_id"
    });

    Cart.belongsTo(models.Item, {
      foreignKey: "item_id"
    });

  };

  return Cart;
};