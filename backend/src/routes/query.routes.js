const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/query.controller');

router.post('/', asyncHandler(controller.ask));

module.exports = router;
