const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/knowledge.controller');

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));

module.exports = router;
