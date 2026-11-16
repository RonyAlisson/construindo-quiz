// Único módulo que carrega o gabarito. Nunca importe este arquivo em código de cliente.
import "server-only";
import rawQuestions from "@/data/questions.json";
import { type PublicQuestion, type Question, questionBankSchema } from "./question-schema";

const bank: readonly Question[] = Object.freeze(questionBankSchema.parse(rawQuestions));
const byId = new Map(bank.map((q) => [q.id, q]));

export function getAllQuestions(): readonly Question[] {
  return bank;
}

export function getQuestionById(id: string): Question | undefined {
  return byId.get(id);
}

export function toPublicQuestion(q: Question): PublicQuestion {
  return { id: q.id, level: q.level, topic: q.topic, statement: q.statement };
}
