const router = require('express').Router();
const { notImplemented } = require('../controllers/placeholder.controller');

// Placeholder: implemented in a later phase.
router.use(notImplemented('Reminders'));

module.exports = router;
