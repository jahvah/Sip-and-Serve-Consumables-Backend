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

        const { name, email, password } = req.body;

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
            name,
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

module.exports = { registerUser, loginUser };