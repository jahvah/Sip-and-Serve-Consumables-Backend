'use strict';

module.exports = (sequelize, DataTypes) => {

    const Customer = sequelize.define("Customer", {

        customer_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: DataTypes.STRING,
        fname: DataTypes.STRING,
        lname: {
            type: DataTypes.STRING,
            defaultValue: ""
        },
        addressline: DataTypes.TEXT,
        town: DataTypes.STRING,
        phone: DataTypes.STRING,
        user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false
        },
        image_path: DataTypes.STRING
    }, {
        tableName: "customer",
        timestamps: false
    });

    Customer.associate = (models) => {
        Customer.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user"
        });
    };
    return Customer;

};