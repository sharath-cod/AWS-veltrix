const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/scamCheck.controller');

router.post('/', asyncHandler(controller.check));

module.exports = router;
