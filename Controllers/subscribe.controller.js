// controllers/subscriptionController.js
const Subscription = require("../Models/subscribe.model");

exports.subscribeEmail = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if email already exists
    const existingSubscription = await Subscription.findOne({ email });
    if (existingSubscription) {
      return res.status(400).json({ message: "Cet e-mail est déjà abonné." }); // "Email already subscribed."
    }

    // Create a new subscription
    const newSubscription = new Subscription({ email });
    await newSubscription.save();

    res.status(201).json({ message: "Abonnement réussi !" }); // "Successfully subscribed!"
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." }); // "Server error."
  }
};

// New getAllSubscriptions function
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ createdAt: -1 });
    res.status(200).json({ data: subscriptions });
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnements:", error);
    res.status(500).json({ message: "Erreur serveur." }); // "Server error."
  }
};

