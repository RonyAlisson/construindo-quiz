// Camada de serviço das rodadas. As rotas em app/api são adaptadores finos sobre estas funções,
// e as server pages (resultado, ranking) chamam estas funções direto, sem HTTP.
import "server-only";
import { z } from "zod";
import { ApiError, type ErrorCode } from "./api";
import type { Level, PublicQuestion } from "./question-schema";
import { getAllQuestions, getQuestionById, toPublicQuestion } from "./questions";
import { sampleRound } from "./sampling";
import { byLevel, type LevelScore, type Tier, tierFor } from "./scoring";
import { getDb } from "./supabase";
import type { SubmitRequest } from "./validation";

export type CreatedRound = { roundId: string; questions: PublicQuestion[] };

export type AnswerResult = {
  correct: boolean;
  correctAnswer: boolean;
  explanation: string;
  sourceUrl: string;
  answeredCount: number;
  finished: boolean;
};

export type ReviewItem = {
  id: string;
  level: Level;
  statement: string;
  yourAnswer: boolean | null;
  correctAnswer: boolean;
  correct: boolean;
  explanation: string;
  sourceUrl: string;
};

export type RoundResult = {
  roundId: string;
  status: "finished" | "submitted";
  correctCount: number;
  totalQuestions: number;
  durationMs: number;
  tier: Tier;
  byLevel: LevelScore;
  review: ReviewItem[];
};

export type SubmitResult = { position: number; improved: boolean };

export type LeaderboardEntry = {
  position: number;
  nickname: string;
  correctCount: number;
  durationMs: number;
  finishedAt: string;
};

const storedAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.boolean(),
  correct: z.boolean(),
});

const rpcErrorSchema = z.object({ error: z.string() });

const answerRpcSchema = z.object({
  answeredCount: z.number().int(),
  finished: z.boolean(),
  correctCount: z.number().int(),
});

const submitRpcSchema = z.object({
  improved: z.boolean(),
  position: z.number().int(),
});

const KNOWN_RPC_ERRORS: ErrorCode[] = [
  "ROUND_NOT_FOUND",
  "OUT_OF_ORDER",
  "ALREADY_ANSWERED",
  "ROUND_CLOSED",
  "ROUND_NOT_FINISHED",
];

function throwIfRpcError(data: unknown): void {
  const parsed = rpcErrorSchema.safeParse(data);
  if (!parsed.success) return;
  const code = parsed.data.error as ErrorCode;
  throw new ApiError(KNOWN_RPC_ERRORS.includes(code) ? code : "INTERNAL_ERROR");
}

function dbFailure(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

export async function createRound(): Promise<CreatedRound> {
  const questions = sampleRound(getAllQuestions());
  const { data, error } = await getDb()
    .from("rounds")
    .insert({ question_ids: questions.map((q) => q.id) })
    .select("id")
    .single();
  if (error) dbFailure("Falha ao criar a rodada", error);
  return { roundId: data.id, questions: questions.map(toPublicQuestion) };
}

async function getRoundRow(roundId: string) {
  const { data, error } = await getDb()
    .from("rounds")
    .select("id, question_ids, answers, correct_count, status, duration_ms")
    .eq("id", roundId)
    .maybeSingle();
  if (error) dbFailure("Falha ao ler a rodada", error);
  if (!data) throw new ApiError("ROUND_NOT_FOUND");
  return data;
}

export async function answerQuestion(
  roundId: string,
  questionId: string,
  answer: boolean,
): Promise<AnswerResult> {
  const question = getQuestionById(questionId);
  if (!question) {
    // Pergunta fora do banco nunca é a próxima da rodada; devolve o erro mais preciso possível.
    const round = await getRoundRow(roundId);
    throw new ApiError(round.status === "in_progress" ? "OUT_OF_ORDER" : "ROUND_CLOSED");
  }

  const correct = question.answer === answer;
  const { data, error } = await getDb().rpc("answer_question", {
    p_round_id: roundId,
    p_question_id: questionId,
    p_answer: answer,
    p_correct: correct,
  });
  if (error) dbFailure("Falha ao registrar a resposta", error);
  throwIfRpcError(data);
  const state = answerRpcSchema.parse(data);

  return {
    correct,
    correctAnswer: question.answer,
    explanation: question.explanation,
    sourceUrl: question.sourceUrl,
    answeredCount: state.answeredCount,
    finished: state.finished,
  };
}

export async function getResult(roundId: string): Promise<RoundResult> {
  const round = await getRoundRow(roundId);
  if (round.status === "in_progress") throw new ApiError("ROUND_NOT_FINISHED");
  if (round.status !== "finished" && round.status !== "submitted") {
    throw new ApiError("ROUND_CLOSED");
  }

  const answers = z.array(storedAnswerSchema).parse(round.answers);
  const answerById = new Map(answers.map((a) => [a.questionId, a]));

  const review: ReviewItem[] = [];
  for (const id of round.question_ids) {
    const question = getQuestionById(id);
    if (!question) continue; // pergunta removida do banco depois da rodada
    const given = answerById.get(id);
    review.push({
      id,
      level: question.level,
      statement: question.statement,
      yourAnswer: given?.answer ?? null,
      correctAnswer: question.answer,
      correct: given?.correct ?? false,
      explanation: question.explanation,
      sourceUrl: question.sourceUrl,
    });
  }

  return {
    roundId: round.id,
    status: round.status,
    correctCount: round.correct_count,
    totalQuestions: round.question_ids.length,
    durationMs: round.duration_ms ?? 0,
    tier: tierFor(round.correct_count),
    byLevel: byLevel(review, answers),
    review,
  };
}

export async function submitRound(roundId: string, input: SubmitRequest): Promise<SubmitResult> {
  const { data, error } = await getDb().rpc("submit_round", {
    p_round_id: roundId,
    p_email: input.email,
    p_nickname: input.nickname,
  });
  if (error) dbFailure("Falha ao enviar ao ranking", error);
  throwIfRpcError(data);
  return submitRpcSchema.parse(data);
}

export async function getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  const { data, error } = await getDb()
    .from("leaderboard")
    .select("position, nickname, correct_count, duration_ms, finished_at")
    .order("position", { ascending: true })
    .limit(limit);
  if (error) dbFailure("Falha ao ler o ranking", error);
  return (data ?? []).map((row) => ({
    position: row.position ?? 0,
    nickname: row.nickname ?? "",
    correctCount: row.correct_count ?? 0,
    durationMs: row.duration_ms ?? 0,
    finishedAt: row.finished_at ?? "",
  }));
}
