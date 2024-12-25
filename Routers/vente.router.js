const express = require("express");
const {
  createVente,
  updateVenteStatus,
  updateVente,
  getAllVentes,
} = require("../Controllers/vente.controller");

const router = express.Router();

// Route to create a new Vente
router.post("/", createVente);

// Update a Vente's status
router.put("/update-status/:id", updateVenteStatus);

// Update a Vente's details
router.put("/update/:id", updateVente);

// Get all Ventes
router.get("/all", getAllVentes);

module.exports = router;
