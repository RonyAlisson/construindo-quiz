// Schema do banco de perguntas (PRD 4.4).
// Sem `server-only`: o script scripts/validate-questions.ts também importa este módulo.
import { z } from "zod";

export const LEVELS = ["iniciante", "intermediario", "avancado"] as const;
export const TOPICS = [
  "claude-geral",
  "fundamentos",
  "uso-diario",
  "extensibilidade",
  "avancado",
] as const;

export type Level = (typeof LEVELS)[number];
export type Topic = (typeof TOPICS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

// docs.claude.com hoje redireciona para platform.claude.com; os dois são aceitos.
const OFFICIAL_DOC_HOSTS = [
  "code.claude.com",
  "docs.claude.com",
  "platform.claude.com",
  "anthropic.com",
];

export function isOfficialDocUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return OFFICIAL_DOC_HOSTS.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
  );
}

export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-z-]+-\d{3}$/, "id deve seguir o formato <topic>-<nnn>"),
    level: z.enum(LEVELS),
    topic: z.enum(TOPICS),
    statement: z.string().trim().min(10).max(200),
    answer: z.boolean(),
    explanation: z.string().trim().min(20).max(400),
    sourceUrl: z
      .string()
      .refine(isOfficialDocUrl, `sourceUrl deve ser https em ${OFFICIAL_DOC_HOSTS.join(", ")}`),
    reviewedAt: z.iso.date(),
  })
  .strict()
  .superRefine((q, ctx) => {
    if (!q.id.startsWith(`${q.topic}-`) || !/^\d{3}$/.test(q.id.slice(q.topic.length + 1))) {
      ctx.addIssue({
        code: "custom",
        path: ["id"],
        message: `id "${q.id}" deve ser "${q.topic}-<nnn>"`,
      });
    }
    const prefix = q.answer ? "Verdadeiro." : "Falso.";
    if (!q.explanation.startsWith(prefix)) {
      ctx.addIssue({
        code: "custom",
        path: ["explanation"],
        message: `explanation deve começar com "${prefix}"`,
      });
    }
  });

export const questionBankSchema = z.array(questionSchema);

export type Question = z.infer<typeof questionSchema>;

/** O que o cliente pode ver antes de responder: nunca o gabarito nem a explicação. */
export type PublicQuestion = Pick<Question, "id" | "level" | "topic" | "statement">;
