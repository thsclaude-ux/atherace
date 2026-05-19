const API_BASE = (() => {
  const host = window.location.hostname;
  if (host.endsWith(".web.app") || host.endsWith(".firebaseapp.com")) {
    return "/api";
  }
  return "/.netlify/functions";
})();

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  } else if (options.sessionToken) {
    headers.Authorization = `Bearer ${options.sessionToken}`;
  }

  const res = await fetch(`${API_BASE}/${path}`, {
    headers,
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function generateCode(token, maxUses) {
  return api("generateCode", { method: "POST", token, body: { maxUses } });
}

export async function validateCode(code, userId) {
  const q = new URLSearchParams({ code, userId });
  return api(`validateCode?${q}`, { method: "GET" });
}

export async function checkSubmission(code, userId) {
  const q = new URLSearchParams({ code, userId });
  return api(`checkSubmission?${q}`, { method: "GET" });
}

export async function submitBets(payload, sessionToken) {
  return api("submitBets", {
    method: "POST",
    body: payload,
    sessionToken,
  });
}

export async function saveWinners(token, rounds) {
  return api("saveWinners", { method: "POST", token, body: { rounds } });
}

export async function getParticipants(token) {
  return api("getParticipants", { method: "GET", token });
}

export async function listCodes(token) {
  return api("listCodes", { method: "GET", token });
}

export async function deleteCode(token, code) {
  return api(`deleteCode?code=${encodeURIComponent(code)}`, {
    method: "DELETE",
    token,
  });
}

export async function deleteAllParticipants(token) {
  return api("deleteAllParticipants", { method: "POST", token });
}

/**
 * POST exportParticipants — يعيد Blob لملف Excel (مسؤول فقط).
 */
export async function exportParticipants(token) {
  const res = await fetch(`${API_BASE}/exportParticipants`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    throw err;
  }

  return res.blob();
}
