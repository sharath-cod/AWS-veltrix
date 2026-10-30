const router = require('express').Router();

router.use('/health', require('./health.routes'));
router.use('/knowledge', require('./knowledge.routes'));
router.use('/query', require('./query.routes'));
router.use('/schemes', require('./schemes.routes'));
router.use('/scholarships', require('./scholarships.routes'));
router.use('/reminders', require('./reminders.routes'));
router.use('/scam-check', require('./scam-check.routes'));
router.use('/sync', require('./sync.routes'));

module.exports = router;
