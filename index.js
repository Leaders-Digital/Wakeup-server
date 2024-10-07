const express = require("express");
require("./Models/index");
const cors = require("cors");
const port = 7000;
const app = express();
app.use(express.json());
// Routers
const ProductRouter = require("./Routers/Product.router");
const OrderRouter = require("./Routers/Order.router");
const reviewRouter = require("./Routers/Review.router");
const PartenaireRouter = require("./Routers/Partenaire.router");
const BlogRouter = require("./Routers/blog.router");
const InternUserRouter = require("./Routers/InternUser.router");
const reclamationRouter = require("./Routers/Reclamation.router");
const promoRouters = require("./Routers/promoCode.router");
const infoRouters = require("./Routers/info.router");
const userRouter = require("./Routers/user.router");
const bannerRouter = require("./Routers/banner.router");

app.use("/uploads", express.static("uploads"));
app.use(express.json());

app.use(cors());

// Routes
app.use("/api/product", ProductRouter);
app.use("/api/order", OrderRouter);
app.use("/api/review", reviewRouter);
app.use("/api/partenaire", PartenaireRouter);
app.use("/api/blog" , BlogRouter)
app.use ("/api/internUser", InternUserRouter)
app.use("/api/reclamation", reclamationRouter);
app.use("/api/promo", promoRouters);
app.use("/api/info", infoRouters);
app.use("/api/user", userRouter);
app.use("/api/banner", bannerRouter);
// server listening
app.listen(port, () => {
  console.log(`Our server is running on port ${port}`);
});
