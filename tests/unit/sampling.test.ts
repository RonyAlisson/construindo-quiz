import { describe, expect, it } from "vitest";
import {
  InsufficientQuestionsError,
  MAX_SAME_ANSWER,
  ROUND_SIZE,
  sampleRound,
  shuffle,
} from "@/lib/sampling";
import { makeBank, seededRng } from "../helpers/fixtures";

describe("sampleRound", () => {
  const bank = makeBank(20);

  it("sorteia 10 perguntas na ordem 4 iniciante, 3 intermediário, 3 avançado", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const round = sampleRound(bank, seededRng(seed));
      expect(round).toHaveLength(ROUND_SIZE);
      expect(round.map((q) => q.level)).toEqual([
        "iniciante",
        "iniciante",
        "iniciante",
        "iniciante",
        "intermediario",
        "intermediario",
        "intermediario",
        "avancado",
        "avancado",
        "avancado",
      ]);
    }
  });

  it("não repete perguntas dentro da rodada", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const ids = sampleRound(bank, seededRng(seed)).map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("nunca tem mais de 7 respostas iguais", () => {
    // Banco enviesado: 75% verdadeiras, então rodadas desequilibradas aparecem e precisam ser re-sorteadas.
    const skewed = makeBank(20, (_level, i) => i % 4 !== 0);
    for (let seed = 1; seed <= 200; seed++) {
      const round = sampleRound(skewed, seededRng(seed));
      const trues = round.filter((q) => q.answer).length;
      expect(trues).toBeLessThanOrEqual(MAX_SAME_ANSWER);
      expect(round.length - trues).toBeLessThanOrEqual(MAX_SAME_ANSWER);
    }
  });

  it("é determinístico com o mesmo rng e varia entre seeds", () => {
    const a = sampleRound(bank, seededRng(42)).map((q) => q.id);
    const b = sampleRound(bank, seededRng(42)).map((q) => q.id);
    const c = sampleRound(bank, seededRng(43)).map((q) => q.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("aceita um banco com exatamente o mínimo por nível", () => {
    const minimal = [
      ...makeBank(4).filter((q) => q.level === "iniciante"),
      ...makeBank(3).filter((q) => q.level !== "iniciante"),
    ];
    expect(sampleRound(minimal, seededRng(1))).toHaveLength(ROUND_SIZE);
  });

  it("lança erro quando falta pergunta num nível", () => {
    const short = makeBank(20)
      .filter((q) => q.level !== "avancado")
      .concat(makeBank(2).filter((q) => q.level === "avancado"));
    expect(() => sampleRound(short)).toThrow(InsufficientQuestionsError);
  });

  it("lança erro quando é impossível equilibrar V/F", () => {
    const allTrue = makeBank(20, () => true);
    expect(() => sampleRound(allTrue, seededRng(1))).toThrow(/respostas iguais/);
  });
});

describe("shuffle", () => {
  it("mantém os mesmos elementos e não altera o array original", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const output = shuffle(input, seededRng(7));
    expect([...output].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
