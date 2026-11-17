import { describe, expect, it } from "vitest";
import { containsProfanity, normalizeForProfanity } from "@/lib/profanity";

describe("containsProfanity", () => {
  it.each([
    "porra",
    "PoRrA",
    "p0rr4",
    "caralho_dev",
    "dev-merda",
    "fuck you",
    "sh1t",
    "Fodase",
    "xxcaralhoxx",
  ])("bloqueia %s", (nickname) => {
    expect(containsProfanity(nickname)).toBe(true);
  });

  it.each([
    "carla_dev",
    "computador",
    "desviado",
    "Ana Lúcia",
    "bruno-123",
    // Limitação conhecida: palavras que *começam* com um termo bloqueado (ex.: "dickens") são
    // recusadas, em troca de pegar variações como "putaria" e "fuckyou".
    "Scunthorpe",
    "Matemática",
    "unicornio",
  ])("aceita %s", (nickname) => {
    expect(containsProfanity(nickname)).toBe(false);
  });
});

describe("normalizeForProfanity", () => {
  it("remove acentos, desfaz leetspeak e tira separadores", () => {
    expect(normalizeForProfanity("Ótá_r10 @")).toBe("otarioa");
  });
});
