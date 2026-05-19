/**
 * إعدادات Firebase للعميل — Authentication للمسؤول فقط
 * الأولوية: firebase-config.local.js (تطوير) ← generated (Netlify build)
 */
let firebaseConfig = {
  apiKey: "YOUR_WEB_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

function isUsableConfig(cfg) {
  return cfg?.apiKey && !String(cfg.apiKey).includes("YOUR_");
}

try {
  const generated = await import("./firebase-config.generated.js");
  if (isUsableConfig(generated.firebaseConfig)) {
    firebaseConfig = generated.firebaseConfig;
  }
} catch {
  /* يُنشأ عند npm run build على Netlify */
}

try {
  const local = await import("./firebase-config.local.js");
  if (isUsableConfig(local.firebaseConfig)) {
    firebaseConfig = local.firebaseConfig;
  }
} catch {
  /* ملف محلي اختياري للتطوير */
}

export { firebaseConfig };
