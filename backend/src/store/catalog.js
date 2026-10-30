/**
 * Read-through cache for the content collections.
 *
 * Why this exists: every question used to call store.knowledge.all(), and in
 * MongoDB mode that is a full collection read; in memory mode it is a deep
 * clone of all 83 entries (JSON stringify + parse of every trilingual
 * document). A single /api/query hit that path up to three times — once for
 * retrieval, once inside buildManifest, once more for the pack version — so the
 * same unchanged data was fetched and copied several times per request.
 *
 * The catalogue is read-only at runtime: it only changes when someone re-seeds
 * the database. So it is safe to hold one snapshot and hand the same array to
 * every caller, refreshing it on a short timer.
 *
 * Two things come out of this:
 *   - one fetch per collection per TTL instead of one per request;
 *   - the returned arrays keep their identity between requests, which is what
 *     lets services/search-index.js keep the inverted index built against them.
 */
const DEFAULT_TTL_MS = Number(process.env.CATALOG_CACHE_TTL_MS) || 60000;

function createCatalogCache(store, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const slots = {
    knowledge: { value: null, at: 0, inflight: null },
    schemes: { value: null, at: 0, inflight: null },
    scholarships: { value: null, at: 0, inflight: null },
  };
  const state = { version: 0, refreshes: 0, hits: 0 };

  function fresh(slot) {
    return slot.value !== null && Date.now() - slot.at < ttlMs;
  }

  function read(kind) {
    const slot = slots[kind];
    if (fresh(slot)) {
      state.hits += 1;
      return Promise.resolve(slot.value);
    }
    // One fetch per collection even if ten requests arrive together.
    if (slot.inflight) return slot.inflight;
    slot.inflight = store[kind]
      .all()
      .then((value) => {
        slot.value = Array.isArray(value) ? value : [];
        slot.at = Date.now();
        state.refreshes += 1;
        state.version += 1;
        slot.inflight = null;
        return slot.value;
      })
      .catch((err) => {
        slot.inflight = null;
        // Serve the last good snapshot rather than failing the request: a stale
        // answer that is flagged as stale beats no answer for a rural user.
        if (slot.value) return slot.value;
        throw err;
      });
    return slot.inflight;
  }

  function invalidate(kind) {
    const kinds = kind ? [kind] : Object.keys(slots);
    for (const key of kinds) {
      slots[key].value = null;
      slots[key].at = 0;
      slots[key].inflight = null;
    }
    state.version += 1;
  }

  const cached = {
    knowledge: { all: () => read('knowledge') },
    schemes: {
      all: () => read('schemes'),
      get: async (id) => {
        const list = await read('schemes');
        return list.find((s) => s.id === id) || null;
      },
    },
    scholarships: {
      all: () => read('scholarships'),
      get: async (id) => {
        const list = await read('scholarships');
        return list.find((s) => s.id === id) || null;
      },
    },
  };

  return {
    mode: store.mode,
    status: store.status,
    // Everything that is not content is passed straight through: reminders,
    // saved scholarships, SMS logs and voice sessions must never be cached.
    saved: store.saved,
    reminders: store.reminders,
    sms: store.sms,
    sessions: store.sessions,
    knowledge: cached.knowledge,
    schemes: cached.schemes,
    scholarships: cached.scholarships,
    close: store.close ? () => store.close() : async () => {},
    invalidate,
    catalogStats: () => ({
      ttlMs,
      version: state.version,
      refreshes: state.refreshes,
      cacheHits: state.hits,
    }),
    get catalogVersion() {
      return state.version;
    },
  };
}

module.exports = { createCatalogCache, DEFAULT_TTL_MS };
