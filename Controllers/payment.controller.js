const axios = require("axios");
const Order = require("../Models/orders.model");

const KONNECT_API_URL =
  process.env.KONNECT_API_URL ||
  "https://api.konnect.network/api/v2/payments/init-payment";
const KONNECT_API_KEY = process.env.KONNECT_API_KEY;
const KONNECT_WALLET_ID = process.env.KONNECT_WALLET_ID;
const KONNECT_FAIL_URL =
  process.env.KONNECT_FAIL_URL ||
  "https://gateway.sandbox.konnect.network/payment-failure";
const KONNECT_WEBHOOK =
  process.env.KONNECT_WEBHOOK ||
  "https://merchant.tech/api/notification_payment";

const SHIPPING_FEE_TND = Number(process.env.SHIPPING_FEE_TND || 8);

const initPayment = async (req, res) => {
  try {
    if (!KONNECT_API_KEY || !KONNECT_WALLET_ID) {
      return res.status(500).json({
        message:
          "Payment provider is not configured. Set KONNECT_API_KEY and KONNECT_WALLET_ID on the server.",
      });
    }

    const { orderId, baseUrl } = req.body;
    if (!orderId || !baseUrl) {
      return res
        .status(400)
        .json({ message: "orderId and baseUrl are required." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (order.payed) {
      return res
        .status(400)
        .json({ message: "This order has already been paid." });
    }

    const merchandiseTotal = Number(order.prixTotal || 0);
    const amountInMillimes = Math.round((merchandiseTotal + SHIPPING_FEE_TND) * 1000);

    const paymentData = {
      receiverWalletId: KONNECT_WALLET_ID,
      token: "TND",
      amount: amountInMillimes,
      type: "immediate",
      description: `Payment for order ${order.orderCode || order._id}`,
      acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
      lifespan: 10,
      checkoutForm: true,
      addPaymentFeesToAmount: true,
      firstName: order.prenom,
      lastName: order.nom,
      phoneNumber: order.numTelephone,
      email: order.email,
      orderId: String(order._id),
      webhook: KONNECT_WEBHOOK,
      silentWebhook: true,
      successUrl: `${baseUrl}/success?orderId=${order._id}`,
      failUrl: KONNECT_FAIL_URL,
      theme: "light",
    };

    const response = await axios.post(KONNECT_API_URL, paymentData, {
      headers: { "x-api-key": KONNECT_API_KEY },
    });

    if (!response.data?.payUrl) {
      return res
        .status(502)
        .json({ message: "Payment provider did not return a payment URL." });
    }

    if (response.data.paymentRef) {
      order.paymentRef = response.data.paymentRef;
      await order.save();
    }

    return res.status(200).json({
      payUrl: response.data.payUrl,
      paymentRef: response.data.paymentRef,
    });
  } catch (error) {
    const status = error?.response?.status || 500;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to initiate payment.";
    return res.status(status).json({ message });
  }
};

module.exports = {
  initPayment,
};
