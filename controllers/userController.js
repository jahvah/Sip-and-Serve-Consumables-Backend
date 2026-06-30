const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../models");

const User = db.User;
const Customer = db.Customer;

/* =========================
   REGISTER USER
   Creates a new user account and corresponding customer record inside a transaction
========================= */
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
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
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
            lname: ""
        }, { transaction });

        await transaction.commit();

        return res.json({
            success: true,
            message: "Registration Successful",
            user_id: user.id
        });

    } catch (err) {

        await transaction.rollback();
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/* =========================
   LOGIN USER
   Authenticates user credentials and returns JWT token with user details
========================= */
const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        await user.update({ token });

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/* =========================
   UPDATE USER ROLE (ADMIN)
========================= */
const updateUser = async (req, res) => {

    try {

        const { user_id, role, status } = req.body;

        const user = await User.findByPk(user_id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.update({ role, status });

        return res.json({ message: "User updated" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

//delete user (admin)
const deleteUser = async (req, res) => {

    try {

        const { id } = req.params;

        await User.destroy({
            where: { id }
        });

        return res.json({ message: "User deleted" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
//fetch all users (admin )
const getAllUsers = async (req, res) => {

    try {

        const users = await User.findAll();

        return res.json({ users });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

//for header
const getCustomerByUserId = async (req, res) => {

    try {

        const { userId } = req.params;

        const customer = await Customer.findOne({
            where: { user_id: userId }
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        return res.json(customer);

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    updateUser,
    deleteUser,
    getCustomerByUserId
};