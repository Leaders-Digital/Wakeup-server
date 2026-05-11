const express = require("express");

const PaymentRouter = express.Router();

const { initPayment } = require("../Controllers/payment.controller");

PaymentRouter.post("/init", initPayment);

module.exports = PaymentRouter;
