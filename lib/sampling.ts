// Sorteio da rodada (PRD 3.2): 4 Iniciante → 3 Intermediário → 3 Avançado.
import type { Level } from "./question-schema";

export const ROUND_PLAN: ReadonlyArray<{ level: Level; count: number }> = [
  { level: "iniciante", count: 4 },
  { level: "intermediario", count: 3 },
  { level: "avancado", count: 3 },
];

export const ROUND_SIZE = ROUND_PLAN.reduce((sum, step) => sum + step.count, 0);

/** Máximo de respostas iguais (todas V ou todas F) numa rodada. */
export const MAX_SAME_ANSWER = 7;

const MAX_ATTEMPTS = 200;

export type Rng = () => number;

type Sampleable = { id: string; level: Level; answer: boolean };

export class InsufficientQuestionsError extends Error {
  constructor(level: Level, needed: number, available: number) {
    super(`Perguntas insuficientes no nível ${level}: precisa de ${needed}, há ${available}`);
    this.name = "InsufficientQuestionsError";
  }
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

function isBalanced(round: readonly Sampleable[]): boolean {
  const trues = round.filter((q) => q.answer).length;
  return trues <= MAX_SAME_ANSWER && round.length - trues <= MAX_SAME_ANSWER;
}

/**
 * Sorteia as perguntas de uma rodada na ordem por nível, sem repetição.
 * Sorteia de novo quando a rodada tem mais de 7 respostas iguais.
 */
export function sampleRound<T extends Sampleable>(bank: readonly T[], rng: Rng = Math.random): T[] {
  const byLevel = new Map<Level, T[]>();
  for (const step of ROUND_PLAN) {
    const pool = bank.filter((q) => q.level === step.level);
    if (pool.length < step.count) {
      throw new InsufficientQuestionsError(step.level, step.count, pool.length);
    }
    byLevel.set(step.level, pool);
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const round = ROUND_PLAN.flatMap((step) =>
      shuffle(byLevel.get(step.level) ?? [], rng).slice(0, step.count),
    );
    if (isBalanced(round)) return round;
  }
  throw new Error(
    `Não foi possível sortear uma rodada com no máximo ${MAX_SAME_ANSWER} respostas iguais; equilibre V/F no banco`,
  );
}
