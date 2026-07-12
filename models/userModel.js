module.exports = (sequelize, DataTypes) => {

    const User = sequelize.define("User", {

        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
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

        verification_token: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        verification_expires_at: {
            type: DataTypes.DATE,
            allowNull: true
        },

        password_reset_token: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        password_reset_expires_at: {
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
            allowNull: true
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

        tableName: "users",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        paranoid: false

    });

    User.associate = (models) => {

        User.hasOne(models.Customer, {
            foreignKey: "user_id",
            as: "customer"
        });

        User.hasMany(models.Cart, {
            foreignKey: "user_id",
            as: "cartItems"
        });

    };

    return User;
};