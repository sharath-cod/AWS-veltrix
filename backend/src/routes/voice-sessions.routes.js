const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireDevice = require('../middleware/device');
const controller = require('../controllers/voice.controller');

router.post('/', requireDevice, asyncHandler(controller.start));
router.post('/:id/turns', requireDevice, asyncHandler(controller.turn));
router.delete('/:id', requireDevice, asyncHandler(controller.end));

module.exports = router;
