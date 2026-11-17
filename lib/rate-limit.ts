// Rate limit por IP com janela deslizante em memória (PRD 7.4, "Should").
// Limitação conhecida: na Vercel o contador é por instância, aceitável no MVP.

export type RateLimitRule = { limit: number; windowMs: number };

export const RATE_LIMITS = {
  rounds: { limit: 10, windowMs: 60_000 },
  answers: { limit: 30, windowMs: 60_000 },
  submit: { limit: 5, windowMs: 60_000 },
  leaderboard: { limit: 60, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

export function createRateLimiter(now: () => number = Date.now) {
  const hits = new Map<string, number[]>();

  return {
    /** Registra uma tentativa; retorna false quando o limite da janela estourou. */
    check(key: string, rule: RateLimitRule): boolean {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((ts) => t - ts < rule.windowMs);
      if (recent.length >= rule.limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      if (hits.size > 10_000) {
        for (const [k, list] of hits) {
          if (list.every((ts) => t - ts >= rule.windowMs)) hits.delete(k);
        }
      }
      return true;
    },
    reset() {
      hits.clear();
    },
  };
}

const limiter = createRateLimiter();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Usado pelas rotas. Desligado quando RATE_LIMIT_DISABLED=1 (testes de API e E2E). */
export function allowRequest(request: Request, bucket: RateLimitBucket): boolean {
  if (process.env.RATE_LIMIT_DISABLED === "1") return true;
  return limiter.check(`${bucket}:${clientIp(request)}`, RATE_LIMITS[bucket]);
}
