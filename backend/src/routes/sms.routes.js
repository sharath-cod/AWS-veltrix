const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireDevice = require('../middleware/device');
const controller = require('../controllers/sms.controller');

router.post('/preview', requireDevice, asyncHandler(controller.preview));
router.post('/send', requireDevice, asyncHandler(controller.send));
router.get('/', requireDevice, asyncHandler(controller.history));

module.exports = router;
