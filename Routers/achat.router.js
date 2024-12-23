const express = require("express");
const {
  createAchat,
  getAllAchats,
  getAchatById,
  editAchat,
  validateAchat,
} = require("../Controllers/achat.controller");
const { get } = require("mongoose");
const router = express.Router();

router.post("/create", createAchat);
router.get("/one/:id", getAchatById);
router.put("/:id", editAchat);
router.put("/validate/:id", validateAchat);
router.get("/", getAllAchats);
module.exports = router;
