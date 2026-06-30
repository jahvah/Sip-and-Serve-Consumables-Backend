const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../models");

const User = db.User;
const Customer = db.Customer;

/* REGISTER */
const registerUser = async (req, res) => {

    const transaction = await db.sequelize.transaction();

    try {

        const { email, password } = req.body;

        const existing = await User.findOne({
            where: { email },
            transaction
        });

        if (existing) {
            await transaction.rollback();
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashedPassword,
            role: "User",
            profile_image: "default.png",
            status: "Active"
        }, { transaction });

        await Customer.create({
            user_id: user.id,
            fname: "",
            lname: "",
            phone: "",
            addressline: "",
            town: "",
            image_path: null
        }, { transaction });

        await transaction.commit();

        return res.json({
            success: true,
            user_id: user.id
        });

    } catch (err) {
        await transaction.rollback();
        return res.status(500).json({ message: err.message });
    }
};

/* LOGIN */
const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(401).json({ message: "Invalid login" });

        const match = await bcrypt.compare(password, user.password);

        if (!match) return res.status(401).json({ message: "Invalid login" });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        await user.update({ token });

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/* GET ALL USERS (WITH CUSTOMER) */
const getAllUsers = async (req, res) => {

    try {

        const users = await User.findAll({
            include: [
                {
                    model: db.Customer,
                    as: "customer"
                }
            ]
        });

        return res.json({ users });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/* UPDATE FULL USER */
const updateFullUser = async (req, res) => {

    const imagePath = req.file ? "/uploads/" + req.file.filename : undefined;
    const transaction = await db.sequelize.transaction();

    try {

        const {
            user_id,
            email,
            role,
            status,
            fname,
            lname,
            phone,
            addressline,
            town
        } = req.body;

        const user = await User.findByPk(user_id);

        if (!user) return res.status(404).json({ message: "User not found" });

        await user.update({ email, role, status }, { transaction });

        const customer = await Customer.findOne({
            where: { user_id }
        });

        await customer.update({
    fname: fname ?? customer.fname,
    lname: lname ?? customer.lname,
    phone: phone ?? customer.phone,
    addressline: addressline ?? customer.addressline,
    town: town ?? customer.town,

    image_path: imagePath ?? customer.image_path

        }, { transaction });

        await transaction.commit();

        return res.json({ message: "Updated successfully" });

    } catch (err) {

        await transaction.rollback();

        return res.status(500).json({ message: err.message });
    }
};

/* DELETE USER */
const deleteUser = async (req, res) => {

    try {

        await User.destroy({ where: { id: req.params.id } });

        return res.json({ message: "Deleted" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    updateFullUser,
    deleteUser
};