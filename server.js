const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../SipAndServeFrontend")));

const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");

app.use("/api/users", userRoutes);
app.use("/api/customer", customerRoutes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});