import { beforeAll, describe, expect, it } from "vitest";
import { GET as getLeaderboardRoute } from "@/app/api/leaderboard/route";
import {
  anonClient,
  BASE,
  createRound,
  ensureSupabase,
  playRound,
  serviceClient,
  submit,
  uniqueIdentity,
} from "./helpers";

beforeAll(ensureSupabase);

async function leaderboard(query = "") {
  const response = await getLeaderboardRoute(new Request(`${BASE}/api/leaderboard${query}`));
  const text = await response.text();
  return {
    status: response.status,
    text,
    body: JSON.parse(text) as { entries: Array<Record<string, unknown>> },
  };
}

async function playerRow(email: string) {
  const { data } = await serviceClient()
    .from("players")
    .select("id, nickname, best_round_id")
    .eq("email", email)
    .single();
  return data!;
}

describe("POST /api/rounds/{id}/submit", () => {
  it("envia uma rodada finalizada e devolve a posição, sem o e-mail", async () => {
    const roundId = await playRound(8);
    const me = uniqueIdentity();
    const res = await submit(roundId, {
      ...me,
      email: `  ${me.email.toUpperCase()} `,
      consent: true,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ position: expect.any(Number), improved: true });
    expect(res.text.toLowerCase()).not.toContain("teste+");
    expect((await playerRow(me.email)).best_round_id).toBe(roundId); // e-mail normalizado
  });

  it("409 ROUND_NOT_FINISHED para rodada em andamento e ROUND_CLOSED para rodada já enviada", async () => {
    const { round } = await createRound();
    const notFinished = await submit(round.roundId, { ...uniqueIdentity(), consent: true });
    expect(notFinished.status).toBe(409);
    expect((notFinished.body.error as { code: string }).code).toBe("ROUND_NOT_FINISHED");

    const roundId = await playRound(3);
    expect((await submit(roundId, { ...uniqueIdentity(), consent: true })).status).toBe(200);
    const again = await submit(roundId, { ...uniqueIdentity(), consent: true });
    expect(again.status).toBe(409);
    expect((again.body.error as { code: string }).code).toBe("ROUND_CLOSED");
  });

  it.each([
    ["apelido curto", { nickname: "ab" }, "nickname"],
    ["apelido com palavrão", { nickname: "porra_dev" }, "nickname"],
    ["e-mail inválido", { email: "invalido" }, "email"],
    ["sem consentimento", { consent: false }, "consent"],
  ])("422 para %s", async (_label, override, field) => {
    const roundId = await playRound(5);
    const res = await submit(roundId, { ...uniqueIdentity(), consent: true, ...override });
    expect(res.status).toBe(422);
    const error = res.body.error as { code: string; fields: Record<string, string[]> };
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(error.fields)).toContain(field);
  });

  it("mesmo e-mail: rodada pior não troca a melhor marca; rodada melhor troca; apelido sempre atualiza", async () => {
    const me = uniqueIdentity();
    const first = await playRound(7);
    const r1 = await submit(first, { ...me, consent: true });
    expect(r1.body.improved).toBe(true);

    const worse = await playRound(4);
    const r2 = await submit(worse, { nickname: `${me.nickname}b`, email: me.email, consent: true });
    expect(r2.status).toBe(200);
    expect(r2.body.improved).toBe(false);
    expect(r2.body.position).toBe(r1.body.position); // os testes rodam em série
    let row = await playerRow(me.email);
    expect(row.best_round_id).toBe(first);
    expect(row.nickname).toBe(`${me.nickname}b`);

    const better = await playRound(9);
    const r3 = await submit(better, {
      nickname: `${me.nickname}c`,
      email: me.email,
      consent: true,
    });
    expect(r3.body.improved).toBe(true);
    expect(Number(r3.body.position)).toBeLessThanOrEqual(Number(r1.body.position));
    row = await playerRow(me.email);
    expect(row.best_round_id).toBe(better);
    expect(row.nickname).toBe(`${me.nickname}c`);

    // Um único registro por e-mail.
    const { count } = await serviceClient()
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("email", me.email);
    expect(count).toBe(1);
  });
});

describe("GET /api/leaderboard", () => {
  it("lista o ranking ordenado e nunca expõe e-mail", async () => {
    const roundId = await playRound(10);
    await submit(roundId, { ...uniqueIdentity(), consent: true });

    const res = await leaderboard("?limit=50");
    expect(res.status).toBe(200);
    expect(res.text).not.toMatch(/email|@/i);
    const entries = res.body.entries;
    expect(entries.length).toBeGreaterThan(0);
    expect(Object.keys(entries[0]!).sort()).toEqual([
      "correctCount",
      "durationMs",
      "finishedAt",
      "nickname",
      "position",
    ]);
    entries.forEach((entry, index) => expect(entry.position).toBe(index + 1));
    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i - 1]!;
      const cur = entries[i]!;
      const ordered =
        Number(prev.correctCount) > Number(cur.correctCount) ||
        (prev.correctCount === cur.correctCount &&
          Number(prev.durationMs) <= Number(cur.durationMs));
      expect(ordered).toBe(true);
    }
  });

  it("valida o limit", async () => {
    expect((await leaderboard("?limit=0")).status).toBe(422);
    expect((await leaderboard("?limit=abc")).status).toBe(422);
    expect((await leaderboard("?limit=3")).body.entries.length).toBeLessThanOrEqual(3);
  });
});

describe("acesso direto ao banco com a chave anon", () => {
  it("não lê players, rounds nem leaderboard e não chama as funções", async () => {
    const anon = anonClient();
    for (const table of ["players", "rounds", "leaderboard"] as const) {
      const { data, error } = await anon.from(table).select("*").limit(1);
      // Sem privilégio o PostgREST responde erro (42501); nunca pode devolver linhas.
      expect(error ?? (data && data.length === 0 ? "vazio" : null)).toBeTruthy();
      expect(data ?? []).toHaveLength(0);
    }
    const rpc = await anon.rpc("submit_round", {
      p_round_id: "00000000-0000-0000-0000-000000000000",
      p_email: "x@y.z",
      p_nickname: "abc",
    });
    expect(rpc.error).toBeTruthy();
  });
});
