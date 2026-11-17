// Schemas Zod das entradas da API. Sem `server-only`: o formulário de ranking reaproveita
// as mesmas regras no cliente para mostrar erros antes do envio.
import { z } from "zod";
import { containsProfanity } from "./profanity";

export const roundIdSchema = z.uuid("roundId inválido");

export const answerRequestSchema = z.object({
  questionId: z.string().min(1).max(64),
  answer: z.boolean(),
});

export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 20;

export const nicknameSchema = z
  .string()
  .trim()
  .min(NICKNAME_MIN, `O apelido precisa ter pelo menos ${NICKNAME_MIN} caracteres`)
  .max(NICKNAME_MAX, `O apelido pode ter no máximo ${NICKNAME_MAX} caracteres`)
  .regex(/^[\p{L}\p{N} _-]+$/u, "Use só letras, números, espaço, _ ou -")
  .refine((value) => !containsProfanity(value), "Escolha outro apelido");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Informe um e-mail válido").max(254));

export const submitRequestSchema = z.object({
  nickname: nicknameSchema,
  email: emailSchema,
  consent: z.literal(true, "É preciso concordar para entrar no ranking"),
});

export type SubmitRequest = z.infer<typeof submitRequestSchema>;

export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
