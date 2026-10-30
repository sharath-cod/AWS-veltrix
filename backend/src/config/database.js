const mongoose = require('mongoose');

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

mongoose.set('strictQuery', true);
// Fail fast instead of buffering queries forever when the DB is down.
mongoose.set('bufferCommands', false);

function getDatabaseStatus() {
  return STATES[mongoose.connection.readyState] || 'unknown';
}

async function connectDatabase(uri) {
  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));
  mongoose.connection.on('reconnected', () => console.log('[db] reconnected'));
  mongoose.connection.on('error', (err) => console.error('[db] error:', err.message));

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('[db] connected');
    return true;
  } catch (err) {
    // Never log the URI: it contains credentials.
    console.error('[db] initial connection failed:', err.message);
    return false;
  }
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase, getDatabaseStatus };
