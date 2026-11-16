import { describe, expect, it } from "vitest";
import { byLevel, formatDuration, isBetterRound, tierFor } from "@/lib/scoring";

describe("tierFor", () => {
  it.each([
    [0, "Explorador"],
    [4, "Explorador"],
    [5, "Praticante"],
    [7, "Praticante"],
    [8, "Especialista"],
    [9, "Especialista"],
    [10, "Mestre do Claude Code"],
  ])("%i acertos → %s", (correct, tier) => {
    expect(tierFor(correct)).toBe(tier);
  });
});

describe("byLevel", () => {
  it("conta acertos e total por nível", () => {
    const questions = [
      { id: "a", level: "iniciante" as const },
      { id: "b", level: "iniciante" as const },
      { id: "c", level: "intermediario" as const },
      { id: "d", level: "avancado" as const },
    ];
    const answers = [
      { questionId: "a", correct: true },
      { questionId: "b", correct: false },
      { questionId: "c", correct: true },
    ];
    expect(byLevel(questions, answers)).toEqual({
      iniciante: [1, 2],
      intermediario: [1, 1],
      avancado: [0, 1],
    });
  });
});

describe("isBetterRound", () => {
  const base = { correctCount: 7, durationMs: 120_000, finishedAt: "2026-11-16T10:00:00Z" };

  it("mais acertos vence, mesmo sendo mais lento", () => {
    expect(isBetterRound({ ...base, correctCount: 8, durationMs: 999_999 }, base)).toBe(true);
    expect(isBetterRound(base, { ...base, correctCount: 8, durationMs: 999_999 })).toBe(false);
  });

  it("com os mesmos acertos, menor tempo vence", () => {
    expect(isBetterRound({ ...base, durationMs: 100_000 }, base)).toBe(true);
    expect(isBetterRound({ ...base, durationMs: 130_000 }, base)).toBe(false);
  });

  it("empate total: quem terminou antes vence", () => {
    expect(isBetterRound({ ...base, finishedAt: "2026-11-16T09:00:00Z" }, base)).toBe(true);
    expect(isBetterRound({ ...base, finishedAt: "2026-11-16T11:00:00Z" }, base)).toBe(false);
  });

  it("uma rodada não é melhor que ela mesma", () => {
    expect(isBetterRound(base, base)).toBe(false);
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "00:00"],
    [59_400, "00:59"],
    [184_000, "03:04"],
    [3_661_000, "1:01:01"],
  ])("%i ms → %s", (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});
