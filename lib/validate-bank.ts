// Regras do banco de perguntas além do schema de cada item (PRD 4.2 e 4.4).
// Usado por scripts/validate-questions.ts e pelos testes.
import { LEVELS, type Question, questionSchema } from "./question-schema";
import { ROUND_PLAN } from "./sampling";

export const TARGET_PER_LEVEL = 20;
export const MIN_TRUE_RATIO = 0.4;
export const MAX_TRUE_RATIO = 0.6;

export type BankReport = {
  errors: string[];
  warnings: string[];
  counts: Record<string, { total: number; trues: number }>;
};

export function validateBank(raw: unknown, { strict = false } = {}): BankReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts: BankReport["counts"] = {};

  if (!Array.isArray(raw)) {
    return { errors: ["O banco deve ser um array JSON"], warnings, counts };
  }

  const valid: Question[] = [];
  raw.forEach((item, index) => {
    const parsed = questionSchema.safeParse(item);
    const label = (item as { id?: unknown })?.id ?? `#${index}`;
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      for (const issue of parsed.error.issues) {
        errors.push(`${String(label)}: ${issue.path.join(".") || "(item)"}: ${issue.message}`);
      }
    }
  });

  const seen = new Set<string>();
  for (const q of valid) {
    if (seen.has(q.id)) errors.push(`id duplicado: ${q.id}`);
    seen.add(q.id);
  }

  for (const level of LEVELS) {
    const items = valid.filter((q) => q.level === level);
    const trues = items.filter((q) => q.answer).length;
    counts[level] = { total: items.length, trues };

    const minimum = ROUND_PLAN.find((step) => step.level === level)?.count ?? 0;
    if (items.length < minimum) {
      errors.push(
        `${level}: ${items.length} perguntas, mínimo para sortear uma rodada é ${minimum}`,
      );
    }

    if (items.length < TARGET_PER_LEVEL) {
      const message = `${level}: ${items.length} perguntas, meta do MVP é ${TARGET_PER_LEVEL}`;
      (strict ? errors : warnings).push(message);
    }

    if (items.length > 0) {
      const ratio = trues / items.length;
      if (ratio < MIN_TRUE_RATIO || ratio > MAX_TRUE_RATIO) {
        const message = `${level}: ${trues}/${items.length} verdadeiras (${Math.round(ratio * 100)}%), esperado entre ${MIN_TRUE_RATIO * 100}% e ${MAX_TRUE_RATIO * 100}%`;
        // Bancos pequenos (abaixo da meta) não conseguem ficar equilibrados; só avisa até a meta.
        (strict || items.length >= TARGET_PER_LEVEL ? errors : warnings).push(message);
      }
    }
  }

  return { errors, warnings, counts };
}
