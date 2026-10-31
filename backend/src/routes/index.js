const router = require('express').Router();

router.use('/health', require('./health.routes'));
router.use('/knowledge', require('./knowledge.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/query', require('./query.routes'));
router.use('/schemes', require('./schemes.routes'));
router.use('/scholarships', require('./scholarships.routes'));
router.use('/reminders', require('./reminders.routes'));
router.use('/scam-check', require('./scam-check.routes'));
router.use('/sms', require('./sms.routes'));
router.use('/voice-sessions', require('./voice-sessions.routes'));
router.use('/calls', require('./calls.routes'));
router.use('/transcribe', require('./transcribe.routes'));
router.use('/numbers', require('./numbers.routes'));
router.use('/sync', require('./sync.routes'));

module.exports = router;
