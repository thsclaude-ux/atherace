const crypto = require("crypto");

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function randomCode(length = CODE_LENGTH) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[crypto.randomInt(CHARSET.length)];
  }
  return code;
}

function normalizeCode(raw) {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

module.exports = { randomCode, normalizeCode, CODE_LENGTH };
