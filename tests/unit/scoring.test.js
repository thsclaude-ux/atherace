const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateScore,
  validateWinnerRounds,
  ROUNDS,
} = require("../../netlify/functions/_lib/scoring");

describe("scoring", () => {
  it("calculateScore counts matching rounds", () => {
    const bets = [1, 2, 3, 4, 5, 6, 7];
    const winners = [1, 9, 3, 8, 5, 1, 7];
    assert.equal(calculateScore(bets, winners), 4);
  });

  it("calculateScore returns 0 for invalid input", () => {
    assert.equal(calculateScore(null, [1, 2, 3, 4, 5, 6, 7]), 0);
    assert.equal(calculateScore([1, 2, 3], null), 0);
  });

  it("validateWinnerRounds accepts 7 numbers", () => {
    const rounds = [1, 2, 3, 4, 5, 6, 7];
    assert.equal(validateWinnerRounds(rounds), null);
  });

  it("validateWinnerRounds rejects wrong length", () => {
    assert.match(validateWinnerRounds([1, 2, 3]), /7/);
  });

  it("validateWinnerRounds rejects non-numeric", () => {
    const rounds = Array(ROUNDS).fill(1);
    rounds[2] = "x";
    assert.match(validateWinnerRounds(rounds), /الشوط 3/);
  });
});
