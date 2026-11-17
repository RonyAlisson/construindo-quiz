// Helpers dos testes de API: chamam os Route Handlers direto, contra o Supabase local.
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { POST as postAnswer } from "@/app/api/rounds/[roundId]/answers/route";
import { GET as getResultRoute } from "@/app/api/rounds/[roundId]/result/route";
import { POST as postSubmit } from "@/app/api/rounds/[roundId]/submit/route";
import { POST as postRound } from "@/app/api/rounds/route";
import { getQuestionById } from "@/lib/questions";
import type { CreatedRound } from "@/lib/rounds";

export const BASE = "http://localhost";

export async function ensureSupabase(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  if (!url || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local (npx supabase status)",
    );
  }
  try {
    await fetch(`${url}/rest/v1/`, { signal: AbortSignal.timeout(5000) });
  } catch {
    throw new Error(`Supabase local fora do ar em ${url}. Rode: npm run db:start`);
  }
}

type Json = Record<string, unknown>;

async function read(response: Response): Promise<{ status: number; body: Json; text: string }> {
  const text = await response.text();
  return { status: response.status, body: text ? (JSON.parse(text) as Json) : {}, text };
}

function ctx(roundId: string) {
  return { params: Promise.resolve({ roundId }) };
}

function jsonRequest(path: string, body: unknown, method = "POST"): Request {
  return new Request(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export async function createRound() {
  const res = await read(await postRound(new Request(`${BASE}/api/rounds`, { method: "POST" })));
  return { ...res, round: res.body as unknown as CreatedRound };
}

export async function answer(roundId: string, questionId: string, value: unknown) {
  return read(
    await postAnswer(
      jsonRequest(`/api/rounds/${roundId}/answers`, { questionId, answer: value }),
      ctx(roundId),
    ),
  );
}

export async function answerRaw(roundId: string, body: string) {
  return read(await postAnswer(jsonRequest(`/api/rounds/${roundId}/answers`, body), ctx(roundId)));
}

export async function result(roundId: string) {
  return read(
    await getResultRoute(new Request(`${BASE}/api/rounds/${roundId}/result`), ctx(roundId)),
  );
}

export async function submit(roundId: string, body: unknown) {
  return read(await postSubmit(jsonRequest(`/api/rounds/${roundId}/submit`, body), ctx(roundId)));
}

/** Joga uma rodada inteira acertando exatamente `correctCount` perguntas (as primeiras). */
export async function playRound(correctCount = 10): Promise<string> {
  const { round } = await createRound();
  for (const [index, q] of round.questions.entries()) {
    const right = getQuestionById(q.id)!.answer;
    const res = await answer(round.roundId, q.id, index < correctCount ? right : !right);
    if (res.status !== 200) throw new Error(`Falha ao responder: ${res.text}`);
  }
  return round.roundId;
}

export function uniqueIdentity() {
  const tag = randomUUID().slice(0, 8);
  return { nickname: `teste_${tag}`, email: `teste+${tag}@exemplo.com` };
}

export function serviceClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export function anonClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}
