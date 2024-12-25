const Client = require("../Models/Client.model");
const Partenaire = require("../Models/Partenaire.model");
const Variant = require("../Models/variant.model");
const Vente = require("../Models/Vente");

const generateNumFacture = async () => {
  const count = await Vente.countDocuments();
  const nextNum = count + 1;
  return `FACT-${String(nextNum).padStart(6, "0")}`;
};

const createVente = async (req, res) => {
  try {
    const {
      products,
      clientType,
      client,
      entreprise,
      priceType,
      totalPrice,
    } = req.body;

    // Validate required fields
    if (!products || !clientType || !priceType || !totalPrice) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Generate unique numFacture
    const numFacture = await generateNumFacture();

    // Handle clientType conditions
    let clientData;
    if (clientType === "individual") {
      // Validate individual client
      clientData = await Client.findById(client);
      if (!clientData) {
        return res.status(404).json({ error: "Client not found." });
      }
    } else if (clientType === "enterprise") {
      // Validate enterprise client
      clientData = await Partenaire.findById(entreprise);
      if (!clientData) {
        return res.status(404).json({ error: "Enterprise not found." });
      }
    } else {
      return res.status(400).json({ error: "Invalid clientType." });
    }

    // Validate product variants and calculate total quantities

    // Create new Vente
    const vente = new Vente({
      numFacture,
      products,
      status: "en attente", // Default status in French
      clientType,
      client: clientType === "individual" ? client : undefined,
      entreprise: clientType === "enterprise" ? entreprise : undefined,
      priceType,
      totalPrice,
    });

    const savedVente = await vente.save();
    res
      .status(201)
      .json({ message: "Vente created successfully.", vente: savedVente });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the vente." });
  }
};

const updateVenteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["en attente", "terminé", "annulé"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const vente = await Vente.findById(id);
    if (!vente) {
      return res.status(404).json({ error: "Vente not found." });
    }

    vente.status = status;
    const updatedVente = await vente.save();

    res
      .status(200)
      .json({
        message: "Vente status updated successfully.",
        vente: updatedVente,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the vente status." });
  }
};

const updateVente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      products,
      clientType,
      client,
      entreprise,
      priceType,
      totalPrice,
    } = req.body;

    const vente = await Vente.findById(id);
    if (!vente) {
      return res.status(404).json({ error: "Vente not found." });
    }

    // Update fields if provided
    if (products) vente.products = products;
    if (clientType) vente.clientType = clientType;
    if (clientType === "individual" && client) vente.client = client;
    if (clientType === "enterprise" && entreprise)
      vente.entreprise = entreprise;
    if (priceType) vente.priceType = priceType;
    if (totalPrice) vente.totalPrice = totalPrice;

    const updatedVente = await vente.save();

    res
      .status(200)
      .json({ message: "Vente updated successfully.", vente: updatedVente });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the vente." });
  }
};

const getAllVentes = async (req, res) => {
  try {
    const ventes = await Vente.find()
      .populate("client", "name")
      .populate("entreprise", "name")
      .populate("products.variantId", "name price");

    res.status(200).json({ ventes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching ventes." });
  }
};

const getVenteById = async (req, res) => {
  try {
    const { id } = req.params;
    const vente = await Vente.findById(id).populate({
      path: "products.variantId",
      populate: {
        path: "product",
        model: "Product", // Replace 'Product' with the actual name of your Product model
      },
    });

    if (!vente) {
      return res.status(404).json({ error: "Vente not found." });
    }

    res.status(200).json({ vente });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching the vente." });
  }
};

module.exports = {
  createVente,
  updateVenteStatus,
  updateVente,
  getAllVentes,
  getVenteById,
};
