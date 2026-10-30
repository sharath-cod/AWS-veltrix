const ok = (res, data = {}, status = 200) => res.status(status).json({ success: true, ...data });

// Mongo doc -> client JSON: id instead of _id/__v.
function toClient(doc) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc.toObject ? doc.toObject() : doc;
  return { id: _id ? String(_id) : rest.id, ...rest };
}
module.exports = { ok, toClient };
