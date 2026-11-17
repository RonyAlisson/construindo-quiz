// Helpers das rotas: formato de erro único {error: {code, message}} (PRD 7.4).
import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "ROUND_NOT_FOUND"
  | "OUT_OF_ORDER"
  | "ALREADY_ANSWERED"
  | "ROUND_CLOSED"
  | "ROUND_NOT_FINISHED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  ROUND_NOT_FOUND: 404,
  OUT_OF_ORDER: 409,
  ALREADY_ANSWERED: 409,
  ROUND_CLOSED: 409,
  ROUND_NOT_FINISHED: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Dados inválidos",
  ROUND_NOT_FOUND: "Rodada não encontrada",
  OUT_OF_ORDER: "Essa não é a próxima pergunta da rodada",
  ALREADY_ANSWERED: "Essa pergunta já foi respondida",
  ROUND_CLOSED: "A rodada não aceita mais essa ação",
  ROUND_NOT_FINISHED: "A rodada ainda não terminou",
  RATE_LIMITED: "Muitas requisições; tente de novo em instantes",
  INTERNAL_ERROR: "Erro interno",
};

/** Erro de domínio lançado pela camada de serviço (lib/rounds.ts) e convertido em resposta HTTP. */
export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "ApiError";
  }

  get status(): number {
    return STATUS_BY_CODE[this.code];
  }
}

export function jsonError(error: ApiError, headers?: HeadersInit): Response {
  return Response.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    },
    { status: error.status, headers },
  );
}

export function validationError(zodError: z.ZodError): ApiError {
  const fields: Record<string, string[]> = {};
  for (const issue of zodError.issues) {
    const key = issue.path.join(".") || "_";
    (fields[key] ??= []).push(issue.message);
  }
  return new ApiError("VALIDATION_ERROR", undefined, fields);
}

export function parseWith<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("VALIDATION_ERROR", "O corpo da requisição precisa ser JSON");
  }
  return parseWith(schema, body);
}

/** Envolve um handler: ApiError vira a resposta padrão; qualquer outro erro vira 500. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    // Erros internos do Next (ex.: sinal de que a rota é dinâmica durante o pré-render) não são
    // falhas da aplicação: precisam ser repassados, nunca convertidos em 500.
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      const headers = error.code === "RATE_LIMITED" ? { "Retry-After": "60" } : undefined;
      return jsonError(error, headers);
    }
    console.error(error);
    return jsonError(new ApiError("INTERNAL_ERROR"));
  }
}
