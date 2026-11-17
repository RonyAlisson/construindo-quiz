import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { getQuestionById } from "@/lib/questions";
import { answer, answerRaw, createRound, ensureSupabase, playRound, result } from "./helpers";

beforeAll(ensureSupabase);

describe("POST /api/rounds", () => {
  it("cria uma rodada 4/3/3 sem expor o gabarito", async () => {
    const { status, round, text } = await createRound();
    expect(status).toBe(201);
    expect(round.roundId).toMatch(/^[0-9a-f-]{36}$/);
    expect(round.questions.map((q) => q.level)).toEqual([
      ...Array(4).fill("iniciante"),
      ...Array(3).fill("intermediario"),
      ...Array(3).fill("avancado"),
    ]);
    for (const q of round.questions) {
      expect(Object.keys(q).sort()).toEqual(["id", "level", "statement", "topic"]);
    }
    // Nenhum campo do gabarito em lugar nenhum do JSON serializado.
    expect(text).not.toMatch(/"answer"|"explanation"|"sourceUrl"|"correct/);
  });
});

describe("POST /api/rounds/{id}/answers", () => {
  it("fluxo completo: 10 respostas certas → rodada finalizada", async () => {
    const { round } = await createRound();
    for (const [index, q] of round.questions.entries()) {
      const right = getQuestionById(q.id)!.answer;
      const res = await answer(round.roundId, q.id, right);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        correct: true,
        correctAnswer: right,
        answeredCount: index + 1,
        finished: index === 9,
      });
      expect(String(res.body.explanation)).toMatch(/^(Verdadeiro|Falso)\./);
      expect(String(res.body.sourceUrl)).toMatch(/^https:\/\//);
    }

    const res = await result(round.roundId);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "finished",
      correctCount: 10,
      totalQuestions: 10,
      tier: "Mestre do Claude Code",
      byLevel: { iniciante: [4, 4], intermediario: [3, 3], avancado: [3, 3] },
    });
    expect(res.body.durationMs).toEqual(expect.any(Number));
    expect((res.body.review as unknown[]).length).toBe(10);
  });

  it("marca a resposta errada e devolve o gabarito depois de responder", async () => {
    const { round } = await createRound();
    const q = round.questions[0]!;
    const right = getQuestionById(q.id)!.answer;
    const res = await answer(round.roundId, q.id, !right);
    expect(res.body).toMatchObject({ correct: false, correctAnswer: right, finished: false });
  });

  it("409 OUT_OF_ORDER ao pular uma pergunta", async () => {
    const { round } = await createRound();
    const res = await answer(round.roundId, round.questions[1]!.id, true);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { code: "OUT_OF_ORDER", message: expect.any(String) } });
  });

  it("409 OUT_OF_ORDER para pergunta que não existe no banco", async () => {
    const { round } = await createRound();
    const res = await answer(round.roundId, "inexistente-999", true);
    expect(res.status).toBe(409);
    expect((res.body.error as { code: string }).code).toBe("OUT_OF_ORDER");
  });

  it("409 ALREADY_ANSWERED ao responder duas vezes", async () => {
    const { round } = await createRound();
    const q = round.questions[0]!;
    expect((await answer(round.roundId, q.id, true)).status).toBe(200);
    const res = await answer(round.roundId, q.id, false);
    expect(res.status).toBe(409);
    expect((res.body.error as { code: string }).code).toBe("ALREADY_ANSWERED");
  });

  it("respostas concorrentes à mesma pergunta: só uma é aceita", async () => {
    const { round } = await createRound();
    const q = round.questions[0]!;
    const results = await Promise.all([1, 2, 3, 4].map(() => answer(round.roundId, q.id, true)));
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(3);
  });

  it("409 ROUND_CLOSED depois que a rodada terminou", async () => {
    const roundId = await playRound(5);
    const { round } = await createRound(); // só para ter um id de pergunta qualquer
    const res = await answer(roundId, round.questions[0]!.id, true);
    expect(res.status).toBe(409);
    expect((res.body.error as { code: string }).code).toBe("ROUND_CLOSED");
  });

  it("404 para rodada inexistente e 422 para id ou corpo inválidos", async () => {
    const missing = await answer(randomUUID(), "fundamentos-001", true);
    expect(missing.status).toBe(404);
    expect((missing.body.error as { code: string }).code).toBe("ROUND_NOT_FOUND");

    const badId = await answer("nao-e-uuid", "fundamentos-001", true);
    expect(badId.status).toBe(422);

    const { round } = await createRound();
    const badBody = await answer(round.roundId, round.questions[0]!.id, "sim");
    expect(badBody.status).toBe(422);
    expect((badBody.body.error as { code: string }).code).toBe("VALIDATION_ERROR");

    const notJson = await answerRaw(round.roundId, "{nao é json");
    expect(notJson.status).toBe(422);
  });
});

describe("GET /api/rounds/{id}/result", () => {
  it("409 ROUND_NOT_FINISHED enquanto a rodada está em andamento", async () => {
    const { round } = await createRound();
    const res = await result(round.roundId);
    expect(res.status).toBe(409);
    expect((res.body.error as { code: string }).code).toBe("ROUND_NOT_FINISHED");
  });

  it("404 para rodada inexistente", async () => {
    expect((await result(randomUUID())).status).toBe(404);
  });

  it("calcula acertos por nível numa rodada parcial", async () => {
    const roundId = await playRound(6); // acerta as 6 primeiras: 4 iniciante + 2 intermediário
    const res = await result(roundId);
    expect(res.body).toMatchObject({
      correctCount: 6,
      tier: "Praticante",
      byLevel: { iniciante: [4, 4], intermediario: [2, 3], avancado: [0, 3] },
    });
  });
});
