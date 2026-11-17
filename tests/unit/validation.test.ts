import { describe, expect, it } from "vitest";
import {
  answerRequestSchema,
  leaderboardQuerySchema,
  roundIdSchema,
  submitRequestSchema,
} from "@/lib/validation";

const valid = { nickname: "carla_dev", email: "Carla@Exemplo.com ", consent: true };

describe("submitRequestSchema", () => {
  it("aceita e normaliza um envio válido", () => {
    expect(submitRequestSchema.parse(valid)).toEqual({
      nickname: "carla_dev",
      email: "carla@exemplo.com",
      consent: true,
    });
  });

  it("apara espaços do apelido", () => {
    expect(submitRequestSchema.parse({ ...valid, nickname: "  Ana Lúcia  " }).nickname).toBe(
      "Ana Lúcia",
    );
  });

  it.each([
    ["apelido curto", { nickname: "ab" }, "nickname"],
    ["apelido longo", { nickname: "a".repeat(21) }, "nickname"],
    ["apelido com símbolo", { nickname: "carla!" }, "nickname"],
    ["apelido com palavrão", { nickname: "porra_dev" }, "nickname"],
    ["e-mail inválido", { email: "carla@" }, "email"],
    ["sem consentimento", { consent: false }, "consent"],
  ])("rejeita %s", (_label, override, field) => {
    const result = submitRequestSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === field)).toBe(true);
  });
});

describe("outros schemas", () => {
  it("roundId precisa ser uuid", () => {
    expect(roundIdSchema.safeParse("123").success).toBe(false);
    expect(roundIdSchema.safeParse("6f1c1f0e-8a6d-4c1e-9d3b-2a5b7c9d0e1f").success).toBe(true);
  });

  it("resposta precisa ser booleana", () => {
    expect(answerRequestSchema.safeParse({ questionId: "x-001", answer: "true" }).success).toBe(
      false,
    );
    expect(answerRequestSchema.safeParse({ questionId: "x-001", answer: false }).success).toBe(
      true,
    );
  });

  it("limit do ranking: padrão 20, entre 1 e 50", () => {
    expect(leaderboardQuerySchema.parse({}).limit).toBe(20);
    expect(leaderboardQuerySchema.parse({ limit: "5" }).limit).toBe(5);
    expect(leaderboardQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
    expect(leaderboardQuerySchema.safeParse({ limit: "51" }).success).toBe(false);
  });
});
