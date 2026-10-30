const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/query.controller');

router.post('/', asyncHandler(controller.ask));
// Release an answer that was held for number/date read-back.
router.post('/confirm', asyncHandler(controller.confirm));

module.exports = router;
