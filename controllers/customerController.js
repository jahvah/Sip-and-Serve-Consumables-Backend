const db = require("../models");

const Customer = db.Customer;
const User = db.User;

/* =========================
   GET PROFILE
========================= */
const getProfile = async (req, res) => {

    try {

        const user_id = Number(req.query.user_id);

        const customer = await Customer.findOne({
            where: { user_id }
        });

        const user = await User.findOne({
            where: { id: user_id }
        });

        if (!customer || !user) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        return res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            profile_image: user.profile_image,

            title: customer.title,
            fname: customer.fname,
            lname: customer.lname,
            addressline: customer.addressline,
            town: customer.town
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

/* =========================
   UPDATE PROFILE (CUSTOMER ONLY)
========================= */
const updateCustomer = async (req, res) => {

    try {

        const user_id = Number(req.body.user_id);

        const customer = await Customer.findOne({
            where: { user_id }
        });

        const user = await User.findOne({
            where: { id: user_id }
        });

        if (!customer || !user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // =========================
        // CURRENT DATA
        // =========================
        const oldData = {
            title: customer.title,
            fname: customer.fname,
            lname: customer.lname,
            addressline: customer.addressline,
            town: customer.town,
            profile_image: user.profile_image
        };

        // =========================
        // NEW IMAGE (IF ANY)
        // =========================
        const newImage = req.file
            ? "uploads/profile/" + req.file.filename
            : oldData.profile_image;

        // =========================
        // NEW DATA (ONLY CUSTOMER FIELDS)
        // =========================
        const newData = {
            title: req.body.title || oldData.title,
            fname: req.body.fname || oldData.fname,
            lname: req.body.lname || oldData.lname,
            addressline: req.body.addressline || oldData.addressline,
            town: req.body.town || oldData.town,
            profile_image: newImage
        };

        // =========================
        // NO CHANGE CHECK
        // =========================
        const isSame =
            oldData.title === newData.title &&
            oldData.fname === newData.fname &&
            oldData.lname === newData.lname &&
            oldData.addressline === newData.addressline &&
            oldData.town === newData.town &&
            oldData.profile_image === newData.profile_image;

        if (isSame) {
            return res.status(400).json({
                message: "No changes happened"
            });
        }

        // =========================
        // UPDATE CUSTOMER TABLE
        // =========================
        await customer.update({
            title: newData.title,
            fname: newData.fname,
            lname: newData.lname,
            addressline: newData.addressline,
            town: newData.town
        });

        // =========================
        // UPDATE USER TABLE (ONLY IMAGE)
        // =========================
        await user.update({
            profile_image: newData.profile_image
        });

        return res.json({
            message: "Profile updated successfully"
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

module.exports = {
    getProfile,
    updateCustomer
};