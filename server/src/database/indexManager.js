// src/database/indexManager.js

export async function ensureIndex(collection, keys, options = {}) {
  const indexes = await collection.indexes();

  const keyStr = JSON.stringify(keys);

  const existing = indexes.find(
    (idx) => JSON.stringify(idx.key) === keyStr
  );

  // ✅ Index exists → skip
  if (existing) {
    // Optional: warn if name mismatch
    if (options.name && existing.name !== options.name) {
      console.warn(
        `⚠️ Index key ${keyStr} exists as "${existing.name}", expected "${options.name}"`
      );
    }
    return;
  }

  // ✅ Safe create
  await collection.createIndex(keys, options);

  console.log(
    `➕ Index created on ${collection.collectionName}:`,
    keys,
    options.name ? `(${options.name})` : ""
  );
}
