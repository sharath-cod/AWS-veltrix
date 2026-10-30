const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireDevice = require('../middleware/device');
const controller = require('../controllers/call.controller');

// A call is per device, like every other personal resource.
router.use(requireDevice);

router.post('/', asyncHandler(controller.start));
router.get('/:id', asyncHandler(controller.get));
router.post('/:id/turns', asyncHandler(controller.turn));
router.delete('/:id', asyncHandler(controller.end));

module.exports = router;
