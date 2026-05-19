const crypto = require("crypto");

const DEFAULT_ADMIN_EMAIL = "admin@risk7.com";

function generatePassword(length = 20) {
  const chars =
    "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  const bytes = crypto.randomBytes(length);
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars[bytes[i] % chars.length];
  }
  return pwd;
}

async function countAdmins(rtdb) {
  const snap = await rtdb.ref("admins").once("value");
  if (!snap.exists()) return 0;
  return snap.numChildren();
}

/**
 * إنشاء أول مسؤول — يُستدعى مرة واحدة فقط (عندما /admins فارغ)
 */
async function createFirstAdmin({ auth, rtdb, email, password }) {
  const adminCount = await countAdmins(rtdb);
  if (adminCount > 0) {
    return { alreadyExists: true, adminCount };
  }

  const finalEmail =
    (email || process.env.FIREBASE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim();
  const envPassword = process.env.FIREBASE_ADMIN_PASSWORD;
  const generated = !password && !envPassword;
  const finalPassword = password || envPassword || generatePassword();

  const userRecord = await auth.createUser({
    email: finalEmail,
    password: finalPassword,
    emailVerified: true,
    disabled: false,
  });

  const createdAt = new Date().toISOString();
  await rtdb.ref(`admins/${userRecord.uid}`).set({
    email: finalEmail,
    createdAt,
    role: "admin",
  });

  return {
    alreadyExists: false,
    uid: userRecord.uid,
    email: finalEmail,
    createdAt,
    password: generated ? finalPassword : null,
    usedEnvPassword: Boolean(envPassword || password),
  };
}

module.exports = {
  DEFAULT_ADMIN_EMAIL,
  generatePassword,
  countAdmins,
  createFirstAdmin,
};
