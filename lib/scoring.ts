// Pontuação e ranking (PRD 3.3). 1 ponto por acerto, sem peso por nível.
// ATENÇÃO: a regra de isBetterRound também existe em SQL, na função submit_round
// (supabase/migrations). As duas precisam ficar iguais.
import type { Level } from "./question-schema";
import { LEVELS } from "./question-schema";

export type Tier = "Explorador" | "Praticante" | "Especialista" | "Mestre do Claude Code";

export function tierFor(correctCount: number): Tier {
  if (correctCount >= 10) return "Mestre do Claude Code";
  if (correctCount >= 8) return "Especialista";
  if (correctCount >= 5) return "Praticante";
  return "Explorador";
}

/** [acertos, total] por nível. */
export type LevelScore = Record<Level, [correct: number, total: number]>;

export function byLevel(
  questions: ReadonlyArray<{ id: string; level: Level }>,
  answers: ReadonlyArray<{ questionId: string; correct: boolean }>,
): LevelScore {
  const score = Object.fromEntries(LEVELS.map((level) => [level, [0, 0]])) as LevelScore;
  const correctById = new Map(answers.map((a) => [a.questionId, a.correct]));
  for (const q of questions) {
    const entry = score[q.level];
    entry[1] += 1;
    if (correctById.get(q.id)) entry[0] += 1;
  }
  return score;
}

export type RankedRound = {
  correctCount: number;
  durationMs: number;
  finishedAt: Date | string;
};

/** `a` é melhor que `b`: mais acertos, depois menor tempo, depois terminou antes. */
export function isBetterRound(a: RankedRound, b: RankedRound): boolean {
  if (a.correctCount !== b.correctCount) return a.correctCount > b.correctCount;
  if (a.durationMs !== b.durationMs) return a.durationMs < b.durationMs;
  return new Date(a.finishedAt).getTime() < new Date(b.finishedAt).getTime();
}

/** Formata milissegundos como mm:ss (ou h:mm:ss acima de uma hora). */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}
