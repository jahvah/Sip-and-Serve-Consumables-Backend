const db = require("../models");
const Customer = db.Customer;

// update customer row in completeInformation
const updateCustomer = async (req, res) => {

    try {

        const user_id = Number(req.body.user_id);

        const customer = await Customer.findOne({
            where: { user_id }
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        await customer.update({
            title: req.body.title,
            fname: req.body.fname,
            lname: req.body.lname,
            addressline: req.body.addressline,
            town: req.body.town,
            phone: req.body.phone
        });

        return res.json({
            success: true,
            message: "Profile Updated"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = { updateCustomer };