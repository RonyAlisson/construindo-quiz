import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isOfficialDocUrl, questionSchema } from "@/lib/question-schema";
import { validateBank } from "@/lib/validate-bank";
import { makeBank, makeQuestion } from "../helpers/fixtures";

describe("questionSchema", () => {
  it("aceita uma pergunta válida", () => {
    expect(questionSchema.safeParse(makeQuestion()).success).toBe(true);
  });

  it.each([
    ["id fora do formato", { id: "fundamentos-1" }],
    ["id com topic diferente", { id: "avancado-001", topic: "fundamentos" as const }],
    ["level inválido", { level: "expert" }],
    ["statement curto", { statement: "curta" }],
    ["statement longo", { statement: "x".repeat(201) }],
    ["explanation sem prefixo", { explanation: "Porque sim, explicação longa o bastante." }],
    [
      "explanation com prefixo errado",
      { answer: true, explanation: "Falso. Prefixo não bate com o gabarito." },
    ],
    ["sourceUrl fora da lista", { sourceUrl: "https://example.com/docs" }],
    ["sourceUrl http", { sourceUrl: "http://code.claude.com/docs/en/overview" }],
    ["reviewedAt inválido", { reviewedAt: "16/11/2026" }],
    ["campo extra", { extra: 1 }],
  ])("rejeita %s", (_label, override) => {
    const candidate = { ...makeQuestion(), ...override };
    expect(questionSchema.safeParse(candidate).success).toBe(false);
  });
});

describe("isOfficialDocUrl", () => {
  it.each([
    ["https://code.claude.com/docs/en/hooks", true],
    ["https://platform.claude.com/docs/en/about-claude/models/overview", true],
    ["https://www.anthropic.com/news/model-context-protocol", true],
    ["https://docs.claude.com/en/docs/intro", true],
    ["https://claude.com.evil.io/docs", false],
    ["https://notanthropic.com/", false],
    ["não é url", false],
  ])("%s → %s", (url, expected) => {
    expect(isOfficialDocUrl(url)).toBe(expected);
  });
});

describe("validateBank", () => {
  it("passa no modo estrito com 20 por nível e V/F equilibrado", () => {
    const report = validateBank(makeBank(20), { strict: true });
    expect(report.errors).toEqual([]);
  });

  it("acusa ids duplicados", () => {
    const bank = makeBank(20);
    bank[1] = { ...bank[1]!, id: bank[0]!.id };
    expect(validateBank(bank).errors.some((e) => e.includes("duplicado"))).toBe(true);
  });

  it("acusa nível abaixo do mínimo para sortear uma rodada", () => {
    const bank = makeBank(20).filter((q) => q.level !== "avancado");
    expect(validateBank(bank).errors.some((e) => e.startsWith("avancado"))).toBe(true);
  });

  it("abaixo da meta é aviso; no modo estrito é erro", () => {
    const bank = makeBank(6);
    expect(validateBank(bank).errors).toEqual([]);
    expect(validateBank(bank).warnings.length).toBeGreaterThan(0);
    expect(validateBank(bank, { strict: true }).errors.length).toBeGreaterThan(0);
  });

  it("acusa desequilíbrio V/F num nível completo", () => {
    // Iniciante com 15 V e 5 F (75%); os outros níveis alternam.
    const bank = makeBank(20, (level, i) => (level === "iniciante" ? i % 4 !== 0 : i % 2 === 0));
    const errors = validateBank(bank).errors;
    expect(errors.some((e) => e.startsWith("iniciante") && e.includes("verdadeiras"))).toBe(true);
    expect(errors.some((e) => e.startsWith("intermediario"))).toBe(false);
  });

  it("o banco real em data/questions.json passa na validação básica", () => {
    const raw = JSON.parse(readFileSync("data/questions.json", "utf8"));
    expect(validateBank(raw).errors).toEqual([]);
  });
});
