'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    remember_token: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('User', 'Admin'),
      allowNull: false
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Active', 'Deactivated'),
      allowNull: false,
      defaultValue: 'Active'
    },
    token: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false
  });

  //associations
  User.associate = (models) => {
    User.hasOne(models.Customer, {
        foreignKey: "user_id",
        as: "customer"
    });
};

  return User;
};