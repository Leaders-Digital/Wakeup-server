const express = require('express');
const router = express.Router();
const infoDataController = require('../Controllers/info.controller');

router.post('/', infoDataController.createInfoData);
router.get('/', infoDataController.getAllInfoData);
router.get('/:id', infoDataController.getInfoDataById);
router.put('/:id', infoDataController.updateInfoData);
router.delete('/:id', infoDataController.deleteInfoData);

module.exports = router;
