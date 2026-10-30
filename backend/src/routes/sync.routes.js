const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireDevice = require('../middleware/device');
const controller = require('../controllers/sync.controller');

router.get('/', requireDevice, asyncHandler(controller.status));
router.post('/', requireDevice, asyncHandler(controller.push));

module.exports = router;
