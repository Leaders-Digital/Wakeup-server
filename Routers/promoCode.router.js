const express = require("express");
const promoCodeController = require("../Controllers/promoCode.controller");

const router = express.Router();

router.post("/", promoCodeController.createPromoCode);
router.get("/", promoCodeController.getAllPromoCodes);
router.get("/:id", promoCodeController.getPromoCodeById);
router.put("/:id", promoCodeController.updatePromoCode);
router.delete("/:id", promoCodeController.deletePromoCode);
router.post("/:id/use", promoCodeController.incrementTimesUsed);
router.post('/applyPromoCode', promoCodeController.applyPromoCode);

module.exports = router;
