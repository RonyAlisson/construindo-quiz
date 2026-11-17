import { ApiError, handle, parseWith } from "@/lib/api";
import { allowRequest } from "@/lib/rate-limit";
import { getLeaderboard } from "@/lib/rounds";
import { leaderboardQuerySchema } from "@/lib/validation";

// GET /api/leaderboard?limit=20: top do ranking, sem e-mail.
// Lê request.url, então roda a cada requisição (não é pré-renderizada).
export async function GET(request: Request) {
  return handle(async () => {
    if (!allowRequest(request, "leaderboard")) throw new ApiError("RATE_LIMITED");
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { limit } = parseWith(leaderboardQuerySchema, params);
    return Response.json({ entries: await getLeaderboard(limit) });
  });
}
