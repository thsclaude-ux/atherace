import { ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
import { getRtdb } from "./firebase-client.js";

/**
 * يستمع لتغيّرات النتائج عبر RTDB (مسار عام للقراءة فقط).
 * @param {boolean} demoMode
 * @param {(payload: { at?: string, type?: string, version?: number }) => void} onUpdate
 * @returns {() => void}
 */
export function watchResultsUpdates(demoMode, onUpdate) {
  const db = getRtdb();
  if (!db) {
    return () => {};
  }

  const path = demoMode ? "demo/meta/lastUpdate" : "meta/lastUpdate";
  const metaRef = ref(db, path);
  let skipFirst = true;

  const unsubscribe = onValue(metaRef, (snap) => {
    const val = snap.val();
    if (!val) return;
    if (skipFirst) {
      skipFirst = false;
      return;
    }
    onUpdate(val);
  });

  return unsubscribe;
}
