const { rtdb } = require("./firebase-admin");

function dataRoot() {
  return rtdb().ref();
}

module.exports = { dataRoot };
