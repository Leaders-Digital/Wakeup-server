const express = require("express");
require("./Models/index");
const cors = require("cors");
const port = 7000;
const app = express();
app.use(express.json());
// Routers
const ProductRouter = require("./Routers/Product.router");
const OrderRouter = require("./Routers/Order.router");
app.use("/uploads", express.static("uploads"));
app.use(express.json());

app.use(cors());

// Routes
app.use("/api/product", ProductRouter);
app.use("/api/order", OrderRouter);

// server listening
app.listen(port, () => {
  console.log(`Our server is running on port ${port}`);
});
