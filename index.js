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
const subscribeRouter = require("./Routers/subscribe.router");
const dashboardRouter = require("./Routers/dashboard.router");
const achatRoutes = require("./Routers/achat.router");
const clientRoutes = require("./Routers/client.router");
const venteRoutes = require("./Routers/vente.router");

app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(cors());

require("./corn-tasks/updateEachHour");

const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"]; // API key from request headers
  const serverApiKey = process.env.API_KEY; // API key from environment variables

  if (!apiKey || apiKey !== serverApiKey) {
    return res.status(401).json({ message: "Unauthorized. Invalid API key." });
  }
  next(); // Proceed if API key is valid
};
app.use(apiKeyMiddleware);

// Routes
app.use("/api/product", ProductRouter);
app.use("/api/order", OrderRouter);
app.use("/api/review", reviewRouter);
app.use("/api/partenaire", PartenaireRouter);
app.use("/api/blog", BlogRouter);
app.use("/api/internUser", InternUserRouter);
app.use("/api/reclamation", reclamationRouter);
app.use("/api/promo", promoRouters);
app.use("/api/info", infoRouters);
app.use("/api/user", userRouter);
app.use("/api/banner", bannerRouter);
app.use("/api/subscribe", subscribeRouter);
app.use("/api/achat", achatRoutes);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/client", clientRoutes);
app.use("/api/vente", venteRoutes);

// server listening
app.listen(port, () => {
  console.log(`Our server is running on port ${port}`);
});
