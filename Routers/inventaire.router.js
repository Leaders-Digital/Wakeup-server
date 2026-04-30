const express = require("express");
const {
  createInventaireSession,
  getInventaireSessions,
  getInventaireSessionById,
  deleteInventaireSession,
  deleteAllInventaireSessions,
  applySessionQuantitiesToVariants
} = require("../Controllers/inventaire.controller");

const router = express.Router();

router.post("/session", createInventaireSession);
router.get("/session", getInventaireSessions);
router.get("/session/:id", getInventaireSessionById);
router.patch("/session/:id/apply-quantities", applySessionQuantitiesToVariants);
router.delete("/session/:id", deleteInventaireSession);
router.delete("/session", deleteAllInventaireSessions);

module.exports = router;
