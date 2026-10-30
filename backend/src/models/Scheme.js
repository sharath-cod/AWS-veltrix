const mongoose = require('mongoose');

// Flexible schema: matches whatever fields your seeded data already has.
const schema = new mongoose.Schema({ active: { type: Boolean, default: true } }, { strict: false, timestamps: true, collection: 'Schemes'.toLowerCase() });
module.exports = mongoose.models.Scheme || mongoose.model('Scheme', schema);
