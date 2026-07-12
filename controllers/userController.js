const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../models");
const { Op } = require("sequelize");
const crypto = require("crypto");

const sendEmail = require("../utils/sendEmail");
const { 
    emailVerificationTemplate,
    passwordResetTemplate
 } = require("../utils/emailTemplates");

const VERIFICATION_EXPIRATION_MS =
    24 * 60 * 60 * 1000;

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

        const verificationToken =
            crypto.randomBytes(32).toString("hex");

        const verificationExpires =
            new Date(Date.now() + VERIFICATION_EXPIRATION_MS);

        const user = await User.create({
            email,
            password: hashedPassword,
            role: "User",
            profile_image: "default.png",
            status: "Active",

            email_verified_at: null,
            verification_token: verificationToken,
            verification_expires_at: verificationExpires,

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

        const verifyUrl =
            `http://localhost:3000/api/users/verify-email/${verificationToken}`;

        await sendEmail({

            email: user.email,

            subject: "Verify your SipAndServe account",

            message: emailVerificationTemplate({

                verifyUrl

            })

        });

        await transaction.commit();

        return res.json({
            success: true,
            
            message:
                "Registration successful. Please check your email to verify your account."
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

        if (!user.email_verified_at) {

            return res.status(403).json({

                message:
                    "Please verify your email before logging in.",

                verified: false

            });

        }

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

const verifyEmail = async (req, res) => {

    const token = req.params.token;

    try {

        const user = await User.findOne({

            where: {

                verification_token: token
            }

        });

        if (!user) {

            return res.redirect(
                `${process.env.FRONTEND_URL}/html/emailInvalidVerification.html`
            );
        }

        if (

            user.verification_expires_at &&

            user.verification_expires_at < new Date()

        ) {

            return res.redirect(

        `${process.env.FRONTEND_URL}/html/emailExpiredVerification.html`

            );

        }

        // Already verified
        if (user.email_verified_at) {

            return res.redirect(
                `${process.env.FRONTEND_URL}/html/emailAlreadyVerified.html`
            );

        }

        user.email_verified_at = new Date();

        user.verification_expires_at = null;

        await user.save();

        // 5. Redirect to success page
        return res.redirect(
            `${process.env.FRONTEND_URL}/html/emailVerified.html`
        );

        user.email_verified_at = new Date();

        await user.save();

        return res.redirect(
            `${process.env.FRONTEND_URL}/html/emailVerified.html`
        );
    }

    catch (err) {

        return res.status(500).send(err.message);

    }

};

const resendVerificationEmail = async (req, res) => {

    try {

        const { email } = req.body;

        const user = await User.findOne({

            where: {
                email
            }

        });

        if (!user) {

            return res.status(404).json({

                message: "No account found with that email."

            });

        }

        if (user.email_verified_at) {

            return res.status(400).json({

                message: "This account has already been verified."

            });

        }

        const verificationToken =
            crypto.randomBytes(32).toString("hex");

        const verificationExpires =
            new Date(Date.now() + VERIFICATION_EXPIRATION_MS);

        user.verification_token =
            verificationToken;

        user.verification_expires_at =
            verificationExpires;

        await user.save();

        const verifyUrl =
            `${process.env.APP_URL}/api/users/verify-email/${verificationToken}`;

        await sendEmail({

            email: user.email,

            subject: "Verify your SipAndServe account",

            message: emailVerificationTemplate({

                verifyUrl

            })

        });

        return res.json({

            message:
                "A new verification email has been sent."

        });

    }

    catch (err) {

        return res.status(500).json({

            message: err.message

        });

    }

};

/* GET ADMIN PROFILE */
const getProfile = async (req, res) => {

    try {

        const user = await User.findByPk(req.user.id, {

            attributes: [
                "id",
                "email",
                "role",
                "status",
                "profile_image"
            ]

        });

        if (!user) {

            return res.status(404).json({
                message: "User not found."
            });

        }

        return res.json(user);

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });

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

/* GET USERS (PAGINATION / SEARCH) */
const getUsers = async (req, res) => {

    try {

        const draw = Number(req.query.draw) || 1;
        const start = Number(req.query.start) || 0;
        const length = Number(req.query.length) || 10;
        const search = req.query.search?.value || "";

        const where = {};

        if (search) {

            where[Op.or] = [

                {
                    email: {
                        [Op.like]: `%${search}%`
                    }
                },

                {
                    role: {
                        [Op.like]: `%${search}%`
                    }
                },

                {
                    status: {
                        [Op.like]: `%${search}%`
                    }
                },

                {
                    "$customer.fname$": {
                        [Op.like]: `%${search}%`
                    }
                },

                {
                    "$customer.lname$": {
                        [Op.like]: `%${search}%`
                    }
                },

                {
                    "$customer.phone$": {
                        [Op.like]: `%${search}%`
                    }
                },

                {
                    "$customer.addressline$": {
                        [Op.like]: `%${search}%`
                    }
                },

                {
                    "$customer.town$": {
                        [Op.like]: `%${search}%`
                    }
                }

            ];

        }

        const recordsTotal = await User.count();

        const recordsFiltered = await User.count({

            where,

            include: [

                {

                    model: Customer,

                    as: "customer"

                }

            ]

        });

        const users = await User.findAll({

            where,

            include: [

                {

                    model: Customer,

                    as: "customer"

                }

            ],

            offset: start,

            limit: length,

            order: [

                ["id", "DESC"]

            ]

        });

        return res.json({

            draw,

            recordsTotal,

            recordsFiltered,

            data: users

        });

    } catch (err) {

        return res.status(500).json({

            message: err.message

        });

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

/* CREATE CUSTOMER (ADMIN) */
const createCustomer = async (req, res) => {

    const transaction = await db.sequelize.transaction();

    try {

        const {
            email,
            password,
            fname,
            lname,
            phone,
            addressline,
            town,
            role,
            status
        } = req.body;

        const imagePath = req.file
            ? "/uploads/" + req.file.filename
            : null;

        const existing = await User.findOne({
            where: { email },
            transaction
        });

        if (existing) {
            await transaction.rollback();
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

        if (!gmailPattern.test(email)) {

            await transaction.rollback();

            return res.status(400).json({
                message: "Please enter a valid Gmail address."
            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken =
            crypto.randomBytes(32).toString("hex");

        const verificationExpires =
            new Date(Date.now() + VERIFICATION_EXPIRATION_MS);

        const user = await User.create({

            email,
            password: hashedPassword,
            role: role || "User",
            status: status || "Active",
            profile_image: "default.png",

            email_verified_at: null,
            verification_token: verificationToken,
            verification_expires_at: verificationExpires,

        }, { transaction });

        await Customer.create({

            user_id: user.id,
            fname,
            lname,
            phone,
            addressline,
            town,
            image_path: imagePath

        }, { transaction });

        const verifyUrl =
        `${process.env.APP_URL}/api/users/verify-email/${verificationToken}`;

        await sendEmail({

            email: user.email,

            subject: "Verify your SipAndServe account",

            message: emailVerificationTemplate({

                verifyUrl

            })

        });

        await transaction.commit();

        return res.json({

            success: true,

            message:
                "Customer created successfully. A verification email has been sent."

        });

    } catch (err) {

        await transaction.rollback();

        return res.status(500).json({
            message: err.message
        });

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

/* UPDATE ADMIN PROFILE */
const updateProfile = async (req, res) => {

    try {

        const {

            email,
            password

        } = req.body;

        const user = await User.findByPk(req.user.id);

        if (!user) {

            return res.status(404).json({

                message: "User not found."

            });

        }

        /* =========================
           EMAIL VALIDATION
        ========================= */

        const gmailPattern =
            /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

        if (
            email &&
            !gmailPattern.test(email)
        ) {

            return res.status(400).json({

                message:
                    "Please enter a valid Gmail address."

            });

        }

        /* =========================
           DUPLICATE EMAIL
        ========================= */

        if (email && email !== user.email) {

            const existing =
                await User.findOne({

                    where: {

                        email,

                        id: {

                            [Op.ne]: user.id

                        }

                    }

                });

            if (existing) {

                return res.status(400).json({

                    message:
                        "Email already exists."

                });

            }

        }

        /* =========================
           NO CHANGES
        ========================= */

        const emailChanged =
            email &&
            email !== user.email;

        const passwordChanged =
            password &&
            password.trim() !== "";

        const imageChanged =
            !!req.file;

        if (

            !emailChanged &&
            !passwordChanged &&
            !imageChanged

        ) {

            return res.status(400).json({

                message:
                    "No changes detected."

            });

        }

        /* =========================
           UPDATE
        ========================= */

        if (emailChanged) {

            const verificationToken =
                crypto.randomBytes(32).toString("hex");

            const verificationExpires =
                new Date(
                    Date.now() + VERIFICATION_EXPIRATION_MS
                );

            user.email = email;

            user.email_verified_at = null;

            user.verification_token =
                verificationToken;

            user.verification_expires_at =
                verificationExpires;

        }

        if (passwordChanged) {

            user.password =
                await bcrypt.hash(password, 10);

        }

        if (req.file) {

            user.profile_image =
                "uploads/profile/" +
                req.file.filename;

        }

        await user.save();

        if (emailChanged) {

            const verifyUrl =
        `${process.env.APP_URL}/api/users/verify-email/${user.verification_token}`;

            await sendEmail({

                email: user.email,

                subject: "Verify your new SipAndServe email address",

                message: emailVerificationTemplate({

                    verifyUrl

                })

            });

        }

        return res.json({

            success: true,

            emailChanged,

            message: emailChanged

                ? "Your email has been changed. Please verify your new email address before logging in again."

                : "Profile updated successfully."

        });

    }

    catch (err) {

        return res.status(500).json({

            message: err.message

        });

    }

};

const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        const user = await User.findOne({

            where: {
                email
            }

        });

        // Don't reveal whether the email exists
        if (!user) {

            return res.json({

                message:
                    "If an account with that email exists, a password reset email has been sent."

            });

        }

        const resetToken =
            crypto.randomBytes(32).toString("hex");

        const resetExpires =
            new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        user.password_reset_token =
            resetToken;

        user.password_reset_expires_at =
            resetExpires;

        await user.save();

        const resetUrl =
`${process.env.FRONTEND_URL}/html/resetPassword.html?token=${resetToken}`;

        await sendEmail({

            email: user.email,

            subject: "Reset your SipAndServe password",

            message: passwordResetTemplate({

                resetUrl

            })

        });

        return res.json({

            message:
                "If an account with that email exists, a password reset email has been sent."

        });

    }

    catch (err) {

        return res.status(500).json({

            message: err.message

        });

    }

};

const resetPassword = async (req, res) => {

    try {

        const token = req.params.token;

        const { password } = req.body;

        const user = await User.findOne({

            where: {

                password_reset_token: token

            }

        });

        if (!user) {

            return res.status(400).json({

                message:
                    "Invalid password reset link."

            });

        }

        if (

            user.password_reset_expires_at &&

            user.password_reset_expires_at < new Date()

        ) {

            return res.status(400).json({

                message:
                    "This password reset link has expired."

            });

        }

        user.password =
            await bcrypt.hash(password, 10);

        user.password_reset_token = null;

        user.password_reset_expires_at = null;

        await user.save();

        return res.json({

            message:
                "Password has been reset successfully."

        });

    }

    catch (err) {

        return res.status(500).json({

            message: err.message

        });

    }

};

module.exports = {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,

    getProfile,
    updateProfile,

    getUsers,
    getAllUsers,
    updateFullUser,
    deleteUser,
    createCustomer
};