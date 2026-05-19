import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { auth } from "./firebase-client.js";

export function watchAdminAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const token = await user.getIdToken();
      callback({ user, token });
    } catch {
      callback(null);
    }
  });
}

export async function loginAdmin(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const token = await cred.user.getIdToken();
  return { user: cred.user, token };
}

export async function logoutAdmin() {
  await signOut(auth);
}

export async function refreshToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
}

/** إعادة تعيين كلمة المرور عبر بريد Firebase (يجب تفعيل القالب في Console) */
export async function sendAdminPasswordReset(email) {
  await sendPasswordResetEmail(auth, email.trim());
}
