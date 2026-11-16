import type { Level, Question, Topic } from "@/lib/question-schema";

const TOPIC_BY_LEVEL: Record<Level, Topic> = {
  iniciante: "fundamentos",
  intermediario: "uso-diario",
  avancado: "avancado",
};

let counter = 0;

export function makeQuestion(overrides: Partial<Question> = {}): Question {
  const level = overrides.level ?? "iniciante";
  const topic = overrides.topic ?? TOPIC_BY_LEVEL[level];
  const answer = overrides.answer ?? true;
  counter += 1;
  return {
    id: `${topic}-${String(counter % 1000).padStart(3, "0")}`,
    level,
    topic,
    statement: "Uma afirmação de teste suficientemente longa.",
    answer,
    explanation: `${answer ? "Verdadeiro." : "Falso."} Explicação de teste com o porquê.`,
    sourceUrl: "https://code.claude.com/docs/en/overview",
    reviewedAt: "2026-11-16",
    ...overrides,
  };
}

/** Banco com `perLevel` perguntas por nível, alternando V e F. */
export function makeBank(
  perLevel: number,
  answerFor?: (level: Level, i: number) => boolean,
): Question[] {
  const levels: Level[] = ["iniciante", "intermediario", "avancado"];
  let n = 0;
  return levels.flatMap((level) =>
    Array.from({ length: perLevel }, (_, i) => {
      n += 1;
      const topic = TOPIC_BY_LEVEL[level];
      return makeQuestion({
        id: `${topic}-${String(n).padStart(3, "0")}`,
        level,
        topic,
        answer: answerFor ? answerFor(level, i) : i % 2 === 0,
      });
    }),
  );
}

/** Gerador pseudoaleatório determinístico (mulberry32). */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
