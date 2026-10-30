const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { getHealth } = require('../controllers/health.controller');

router.get('/', asyncHandler(getHealth));

module.exports = router;
