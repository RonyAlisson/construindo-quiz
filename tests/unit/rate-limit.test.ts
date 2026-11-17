import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  const rule = { limit: 3, windowMs: 60_000 };

  it("permite até o limite e bloqueia a seguinte", () => {
    let now = 0;
    const limiter = createRateLimiter(() => now);
    expect([1, 2, 3].map(() => limiter.check("ip", rule))).toEqual([true, true, true]);
    expect(limiter.check("ip", rule)).toBe(false);
    now = 30_000;
    expect(limiter.check("ip", rule)).toBe(false);
  });

  it("libera quando a janela desliza", () => {
    let now = 0;
    const limiter = createRateLimiter(() => now);
    limiter.check("ip", rule);
    now = 10_000;
    limiter.check("ip", rule);
    limiter.check("ip", rule);
    expect(limiter.check("ip", rule)).toBe(false);
    now = 60_000; // a primeira tentativa (t=0) saiu da janela
    expect(limiter.check("ip", rule)).toBe(true);
    expect(limiter.check("ip", rule)).toBe(false);
  });

  it("conta cada chave separadamente", () => {
    const limiter = createRateLimiter(() => 0);
    for (let i = 0; i < 3; i++) limiter.check("a", rule);
    expect(limiter.check("a", rule)).toBe(false);
    expect(limiter.check("b", rule)).toBe(true);
  });
});

describe("clientIp", () => {
  it("usa o primeiro IP do x-forwarded-for", () => {
    const request = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIp(request)).toBe("203.0.113.7");
  });

  it("cai para unknown sem cabeçalhos", () => {
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
