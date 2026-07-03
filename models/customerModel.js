module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define("Customer", {
    customer_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    title: {
      type: DataTypes.STRING,
      allowNull: true
    },

    fname: {
      type: DataTypes.STRING,
      allowNull: true
    },

    lname: {
      type: DataTypes.STRING,
      defaultValue: ""
    },

    addressline: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    town: {
      type: DataTypes.STRING,
      allowNull: true
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },

    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },

    image_path: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: "customer",
    timestamps: false
  });

  Customer.associate = (models) => {
    Customer.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user"
    });

    Customer.hasMany(models.OrderInfo, {
      foreignKey: "customer_id",
      as: "orders"
    });
  };

  return Customer;
};