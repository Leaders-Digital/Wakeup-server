const express = require("express");
const { validateCnrpsForCart } = require("../Controllers/cnrps.controller");

const router = express.Router();

router.post("/validate", validateCnrpsForCart);

module.exports = router;
