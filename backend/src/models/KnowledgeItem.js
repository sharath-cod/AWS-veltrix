const mongoose = require('mongoose');

// Flexible schema: matches whatever fields your seeded data already has.
const schema = new mongoose.Schema({ active: { type: Boolean, default: true } }, { strict: false, timestamps: true, collection: 'KnowledgeItems'.toLowerCase() });
module.exports = mongoose.models.KnowledgeItem || mongoose.model('KnowledgeItem', schema);
