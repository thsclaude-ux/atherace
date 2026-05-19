export const ROUNDS = 7;
export const MIN_HORSE = 1;
export const MAX_HORSE = 10;
export const CODE_LENGTH = 8;
export function calculateScore(bets, winners) {
    if (!Array.isArray(bets) || !Array.isArray(winners))
        return 0;
    let score = 0;
    for (let i = 0; i < ROUNDS; i++) {
        const bet = Number(bets[i]);
        const win = Number(winners[i]);
        if (!Number.isNaN(bet) && !Number.isNaN(win) && bet === win)
            score += 1;
    }
    return score;
}
export function validateRounds(rounds) {
    if (!Array.isArray(rounds) || rounds.length !== ROUNDS) {
        return `Must provide exactly ${ROUNDS} round selections`;
    }
    for (let i = 0; i < ROUNDS; i++) {
        const n = Number(rounds[i]);
        if (!Number.isInteger(n) || n < MIN_HORSE || n > MAX_HORSE) {
            return `Round ${i + 1}: select a number between ${MIN_HORSE} and ${MAX_HORSE}`;
        }
    }
    return null;
}
export const PRIVACY_POLICY_VERSION = "2026-05-18";
