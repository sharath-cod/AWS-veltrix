const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/knowledge.controller');

/** GET /api/categories — every phase the assistant can answer, with counts. */
router.get('/', asyncHandler(controller.categories));

module.exports = router;
