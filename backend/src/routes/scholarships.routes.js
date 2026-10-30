const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireDevice = require('../middleware/device');
const controller = require('../controllers/scholarships.controller');

// /saved routes must come before /:id
router.get('/saved', requireDevice, asyncHandler(controller.listSaved));
router.post('/saved', requireDevice, asyncHandler(controller.save));
router.delete('/saved/:id', requireDevice, asyncHandler(controller.unsave));

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));

module.exports = router;
