// Níveis e temas sem dependência do Zod, para componentes de cliente importarem sem levar o
// Zod (~30 KB gzip) para o navegador. lib/question-schema.ts reexporta estas constantes.

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
