/**
 * In-memory store. Used when MONGODB_URI is not configured so that the whole
 * app can be demoed with zero infrastructure. Data lives for the process
 * lifetime only; restarting the backend resets it.
 */
const crypto = require('crypto');
const { buildSeed } = require('../data/seed-data');

const newId = () => crypto.randomUUID();

function createMemoryStore() {
  const seed = buildSeed();
  const state = {
    knowledge: [...seed.knowledge],
    schemes: [...seed.schemes],
    scholarships: [...seed.scholarships],
    saved: [],
    reminders: [],
    sms: [],
    sessions: [],
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));

  return {
    mode: 'memory',

    knowledge: {
      async all() {
        return clone(state.knowledge);
      },
    },

    schemes: {
      async all() {
        return clone(state.schemes);
      },
      async get(id) {
        return clone(state.schemes.find((s) => s.id === id) || null);
      },
    },

    scholarships: {
      async all() {
        return clone(state.scholarships);
      },
      async get(id) {
        return clone(state.scholarships.find((s) => s.id === id) || null);
      },
    },

    saved: {
      async list(deviceId) {
        return clone(state.saved.filter((s) => s.deviceId === deviceId));
      },
      async add(deviceId, scholarshipId) {
        const existing = state.saved.find(
          (s) => s.deviceId === deviceId && s.scholarshipId === scholarshipId,
        );
        if (existing) return clone(existing);
        const row = { id: newId(), deviceId, scholarshipId, createdAt: new Date().toISOString() };
        state.saved.push(row);
        return clone(row);
      },
      async remove(deviceId, scholarshipId) {
        const before = state.saved.length;
        state.saved = state.saved.filter(
          (s) => !(s.deviceId === deviceId && s.scholarshipId === scholarshipId),
        );
        return before - state.saved.length;
      },
    },

    reminders: {
      async list(deviceId) {
        return clone(
          state.reminders
            .filter((r) => r.deviceId === deviceId)
            .sort((a, b) => String(a.remindAt).localeCompare(String(b.remindAt))),
        );
      },
      async create(deviceId, data) {
        const row = {
          id: newId(),
          deviceId,
          title: data.title,
          type: data.type || 'other',
          remindAt: data.remindAt,
          repeat: data.repeat || 'none',
          completed: false,
          clientId: data.clientId || null,
          notes: data.notes || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.reminders.push(row);
        return clone(row);
      },
      async update(deviceId, id, patch) {
        const row = state.reminders.find((r) => r.deviceId === deviceId && r.id === id);
        if (!row) return null;
        Object.assign(row, patch, { updatedAt: new Date().toISOString() });
        return clone(row);
      },
      async remove(deviceId, id) {
        const before = state.reminders.length;
        state.reminders = state.reminders.filter((r) => !(r.deviceId === deviceId && r.id === id));
        return before - state.reminders.length;
      },
    },

    sms: {
      async list(deviceId, limit = 25) {
        return clone(
          state.sms
            .filter((s) => s.deviceId === deviceId)
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
            .slice(0, limit),
        );
      },
      async create(deviceId, data) {
        const row = { id: newId(), deviceId, createdAt: new Date().toISOString(), ...data };
        state.sms.push(row);
        return clone(row);
      },
    },

    sessions: {
      async create(deviceId, data) {
        const row = {
          id: newId(),
          deviceId,
          status: 'active',
          turns: [],
          createdAt: new Date().toISOString(),
          endedAt: null,
          ...data,
        };
        state.sessions.push(row);
        return clone(row);
      },
      async get(id) {
        return clone(state.sessions.find((s) => s.id === id) || null);
      },
      async update(id, patch) {
        const row = state.sessions.find((s) => s.id === id);
        if (!row) return null;
        Object.assign(row, patch);
        return clone(row);
      },
      async remove(id) {
        const before = state.sessions.length;
        state.sessions = state.sessions.filter((s) => s.id !== id);
        return before - state.sessions.length;
      },
    },

    async close() {},
  };
}

module.exports = { createMemoryStore };
