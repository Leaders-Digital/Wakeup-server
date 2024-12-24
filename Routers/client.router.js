const express = require("express");
const {
  getAllClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
} = require("../Controllers/client.controller");

const router = express.Router();

router.post("/", createClient);
router.get("/", getAllClients);
router.get("/:id", getClientById);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

module.exports = router;
