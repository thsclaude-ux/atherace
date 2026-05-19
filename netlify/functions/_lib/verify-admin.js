const { auth, rtdb } = require("./firebase-admin");

function adminRoleFromRecord(val) {
  if (val === true) return "admin";
  if (val === "viewer") return "viewer";
  if (val && typeof val === "object" && val.role === "viewer") return "viewer";
  return "admin";
}

/**
 * يتحقق من Firebase ID Token — المسؤولون في /admins/{uid}
 * Header: Authorization: Bearer <idToken>
 */
async function verifyAdmin(event) {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, error: "مطلوب تسجيل دخول المسؤول" };
  }

  try {
    const decoded = await auth().verifyIdToken(match[1]);
    const uid = decoded.uid;
    const adminSnap = await rtdb().ref(`admins/${uid}`).once("value");

    if (!adminSnap.exists()) {
      return { ok: false, status: 403, error: "ليس لديك صلاحية مسؤول" };
    }

    return {
      ok: true,
      uid,
      email: decoded.email || adminSnap.val()?.email || null,
      role: adminRoleFromRecord(adminSnap.val()),
    };
  } catch (err) {
    console.error("verifyAdmin:", err.message);
    return { ok: false, status: 401, error: "جلسة غير صالحة أو منتهية" };
  }
}

function requireWriteAdmin(admin) {
  if (!admin.ok) return admin;
  if (admin.role === "viewer") {
    return {
      ok: false,
      status: 403,
      error: "صلاحية القراءة فقط — لا يمكن تنفيذ هذا الإجراء",
    };
  }
  return admin;
}

module.exports = { verifyAdmin, requireWriteAdmin };
