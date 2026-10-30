const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireDevice = require('../middleware/device');
const controller = require('../controllers/reminders.controller');

router.use(requireDevice);

router.get('/', asyncHandler(controller.list));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
