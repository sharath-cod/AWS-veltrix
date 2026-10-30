const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/schemes.controller');

// /check must be registered before /:id so it is not treated as an id
router.post('/check', asyncHandler(controller.check));
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));

module.exports = router;
