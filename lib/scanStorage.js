// lib/scanStorage.js
// Uses IndexedDB instead of localStorage — supports hundreds of MB vs 5MB limit

const DB_NAME = "analog-archive-db";
const DB_VERSION = 1;
const STORE = "scans";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveScans(rollScans) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put({ key: "rollScans", value: rollScans });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadScans() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get("rollScans");
    req.onsuccess = () => resolve(req.result?.value || {});
    req.onerror = () => resolve({});
  });
}
