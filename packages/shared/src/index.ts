export const ROUNDS = 7;
export const MIN_HORSE = 1;
export const MAX_HORSE = 10;
export const CODE_LENGTH = 8;

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessCode {
  code: string;
  maxUses: number;
  usedCount: number;
  createdAt: string;
  createdBy?: string;
  expiresAt?: string;
}

export interface CodeUsage {
  userId: string;
  validatedAt: string;
  submitted: boolean;
  submittedAt?: string;
}

export interface Prediction {
  id: string;
  userId: string;
  code: string;
  rounds: number[];
  name?: string;
  phone?: string;
  submittedAt: string;
  consentAt: string;
  privacyVersion: string;
}

export interface RaceResult {
  id: string;
  rounds: number[];
  savedAt: string;
  savedBy: string;
}

export interface Participant {
  userId: string;
  name?: string;
  score: number;
  registeredAt: string;
  lastScoredAt?: string;
}

export interface LeaderboardEntry extends Participant {
  rank: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export interface RaceEvent {
  id: string;
  name: string;
  nameAr?: string;
  status: "draft" | "open" | "closed" | "completed";
  rounds: number;
  horsesPerRound: number;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

export function calculateScore(bets: number[], winners: number[]): number {
  if (!Array.isArray(bets) || !Array.isArray(winners)) return 0;
  let score = 0;
  for (let i = 0; i < ROUNDS; i++) {
    const bet = Number(bets[i]);
    const win = Number(winners[i]);
    if (!Number.isNaN(bet) && !Number.isNaN(win) && bet === win) score += 1;
  }
  return score;
}

export function validateRounds(rounds: unknown[]): string | null {
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
