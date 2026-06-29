const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// serve frontend
app.use(express.static(path.join(__dirname, "../SipAndServeFrontend")));

// routes
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
const itemRoutes = require("./routes/itemRoutes");
const cartRoutes = require("./routes/cartRoutes");

app.use("/api/users", userRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/cart", cartRoutes);

// sequelize db
const db = require("./models");

// port
const PORT = 3000;

// connect DB + sync models + start server
db.sequelize.authenticate()
  .then(() => {
    console.log("Database connected");

    return db.sequelize.sync();
  })
  .then(() => {
    console.log("Models synced");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });