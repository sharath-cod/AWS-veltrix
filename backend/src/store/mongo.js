/**
 * MongoDB store (Mongoose). Same interface as the in-memory store, so the
 * controllers and services do not care which one is active.
 */
const mongoose = require('mongoose');
const { getDatabaseStatus } = require('../config/database');

const localisedField = { en: String, hi: String, kn: String };

/**
 * Freshness metadata shared by every content document.
 *
 * These fields were being written by the seed and then silently dropped here,
 * because a Mongoose schema in strict mode discards paths it does not declare.
 * That broke hurdle 1 in MongoDB mode only: /api/knowledge/changes had no asOf
 * to compare against, and the per-answer recheck block came back empty. They
 * are now declared explicitly.
 */
const freshnessFields = {
  asOf: { type: String, index: true },
  volatile: { type: Boolean, default: false },
  volatileFacts: [String],
  verifyUrl: { type: String, default: null },
  verifyAt: String,
  contentHash: String,
  // The date the content was checked, not the date the row was written, so it
  // is a plain string and is not touched by Mongoose.
  updatedAt: String,
};

/**
 * `timestamps` is limited to createdAt on purpose: the seed carries a
 * deterministic updatedAt (the day the fact was reviewed), and letting
 * Mongoose overwrite it with "now" would make every phone think every answer
 * had just changed.
 */
const contentOptions = {
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
};

const knowledgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    key: String,
    type: { type: String, default: 'knowledge' },
    category: { type: String, index: true },
    tags: [String],
    question: localisedField,
    answer: localisedField,
    sources: [{ name: String }],
    verified: { type: Boolean, default: false },
    ...freshnessFields,
  },
  contentOptions,
);
// The two queries the app actually makes: a whole shelf, and the change feed
// (newest checked first).
knowledgeSchema.index({ category: 1, asOf: -1 });
knowledgeSchema.index({ volatile: 1, asOf: -1 });
knowledgeSchema.index({ tags: 1 });

const schemeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    key: String,
    type: { type: String, default: 'scheme' },
    category: { type: String, index: true },
    tags: [String],
    name: localisedField,
    description: localisedField,
    eligibility: localisedField,
    apply: localisedField,
    source: { name: String, verified: Boolean },
    verified: { type: Boolean, default: false },
    ...freshnessFields,
  },
  contentOptions,
);
schemeSchema.index({ category: 1, asOf: -1 });
schemeSchema.index({ tags: 1 });

const scholarshipSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    key: String,
    type: { type: String, default: 'scholarship' },
    provider: String,
    open: { type: Boolean, default: true },
    deadline: String,
    amount: String,
    tags: [String],
    name: localisedField,
    description: localisedField,
    eligibility: localisedField,
    apply: localisedField,
    source: { name: String, verified: Boolean },
    verified: { type: Boolean, default: false },
    ...freshnessFields,
  },
  contentOptions,
);
// The list endpoint shows open scholarships soonest deadline first.
scholarshipSchema.index({ open: 1, deadline: 1 });

const savedSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    scholarshipId: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);
savedSchema.index({ deviceId: 1, scholarshipId: 1 }, { unique: true });

const reminderSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    type: { type: String, default: 'other' },
    remindAt: { type: String, required: true },
    repeat: { type: String, default: 'none' },
    completed: { type: Boolean, default: false },
    clientId: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);
// The list is always "this device, soonest first".
reminderSchema.index({ deviceId: 1, remindAt: 1 });
// One reminder per client id, so an offline retry cannot create a duplicate.
reminderSchema.index(
  { deviceId: 1, clientId: 1 },
  { unique: true, partialFilterExpression: { clientId: { $type: 'string' } } },
);

const smsSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    to: String,
    toMasked: String,
    message: String,
    language: String,
    category: String,
    status: String,
    statusLabel: String,
    simulated: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);
// The SMS screen shows the newest messages for one device.
smsSchema.index({ deviceId: 1, createdAt: -1 });

const sessionSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    language: { type: String, default: 'en' },
    status: { type: String, default: 'active' },
    turns: [
      {
        transcript: String,
        answer: String,
        provider: String,
        createdAt: String,
      },
    ],
    endedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);
sessionSchema.index({ deviceId: 1, createdAt: -1 });

const Models = {
  knowledge: mongoose.model('Knowledge', knowledgeSchema),
  schemes: mongoose.model('Scheme', schemeSchema),
  scholarships: mongoose.model('Scholarship', scholarshipSchema),
  saved: mongoose.model('SavedScholarship', savedSchema),
  reminders: mongoose.model('Reminder', reminderSchema),
  sms: mongoose.model('SmsLog', smsSchema),
  sessions: mongoose.model('VoiceSession', sessionSchema),
};

/** Convert a Mongoose document to the plain shape the API returns. */
function plain(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  if (obj.id && typeof obj.id !== 'string') obj.id = String(obj.id);
  return obj;
}

function createMongoStore() {
  return {
    mode: 'mongo',
    status: getDatabaseStatus,

    knowledge: {
      async all() {
        return (await Models.knowledge.find().lean()).map(plain);
      },
    },

    schemes: {
      async all() {
        return (await Models.schemes.find().lean()).map(plain);
      },
      async get(id) {
        return plain(await Models.schemes.findOne({ id }).lean());
      },
    },

    scholarships: {
      async all() {
        return (await Models.scholarships.find().lean()).map(plain);
      },
      async get(id) {
        return plain(await Models.scholarships.findOne({ id }).lean());
      },
    },

    saved: {
      async list(deviceId) {
        return (await Models.saved.find({ deviceId }).lean()).map((doc) => {
          const row = plain(doc);
          return { id: String(doc._id), ...row };
        });
      },
      async add(deviceId, scholarshipId) {
        try {
          const doc = await Models.saved.findOneAndUpdate(
            { deviceId, scholarshipId },
            { $setOnInsert: { deviceId, scholarshipId } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );
          return { id: String(doc._id), deviceId, scholarshipId, createdAt: doc.createdAt };
        } catch (err) {
          if (err && err.code === 11000) {
            const doc = await Models.saved.findOne({ deviceId, scholarshipId });
            return { id: String(doc._id), deviceId, scholarshipId, createdAt: doc.createdAt };
          }
          throw err;
        }
      },
      async remove(deviceId, scholarshipId) {
        const res = await Models.saved.deleteOne({ deviceId, scholarshipId });
        return res.deletedCount || 0;
      },
    },

    reminders: {
      async list(deviceId) {
        return (await Models.reminders.find({ deviceId }).sort({ remindAt: 1 }).lean()).map(
          (doc) => ({ id: String(doc._id), ...plain(doc) }),
        );
      },
      async create(deviceId, data) {
        const doc = await Models.reminders.create({ deviceId, ...data });
        return { id: String(doc._id), ...plain(doc) };
      },
      async update(deviceId, id, patch) {
        if (!mongoose.isValidObjectId(id)) return null;
        const doc = await Models.reminders.findOneAndUpdate(
          { _id: id, deviceId },
          { $set: patch },
          { new: true },
        );
        return doc ? { id: String(doc._id), ...plain(doc) } : null;
      },
      async remove(deviceId, id) {
        if (!mongoose.isValidObjectId(id)) return 0;
        const res = await Models.reminders.deleteOne({ _id: id, deviceId });
        return res.deletedCount || 0;
      },
    },

    sms: {
      async list(deviceId, limit = 25) {
        return (await Models.sms.find({ deviceId }).sort({ createdAt: -1 }).limit(limit).lean()).map(
          (doc) => ({ id: String(doc._id), ...plain(doc) }),
        );
      },
      async create(deviceId, data) {
        const doc = await Models.sms.create({ deviceId, ...data });
        return { id: String(doc._id), ...plain(doc) };
      },
    },

    sessions: {
      async create(deviceId, data) {
        const doc = await Models.sessions.create({ deviceId, ...data });
        return { id: String(doc._id), ...plain(doc) };
      },
      async get(id) {
        if (!mongoose.isValidObjectId(id)) return null;
        const doc = await Models.sessions.findById(id).lean();
        return doc ? { id: String(doc._id), ...plain(doc) } : null;
      },
      async update(id, patch) {
        if (!mongoose.isValidObjectId(id)) return null;
        const doc = await Models.sessions.findByIdAndUpdate(id, { $set: patch }, { new: true });
        return doc ? { id: String(doc._id), ...plain(doc) } : null;
      },
      async remove(id) {
        if (!mongoose.isValidObjectId(id)) return 0;
        const res = await Models.sessions.deleteOne({ _id: id });
        return res.deletedCount || 0;
      },
    },

    async close() {
      await mongoose.connection.close();
    },
  };
}

module.exports = { createMongoStore, Models };
