import { ApiError, handle, parseJsonBody, parseWith } from "@/lib/api";
import { allowRequest } from "@/lib/rate-limit";
import { submitRound } from "@/lib/rounds";
import { roundIdSchema, submitRequestSchema } from "@/lib/validation";

// POST /api/rounds/{roundId}/submit: envia a rodada ao ranking. Nunca devolve o e-mail.
export async function POST(request: Request, ctx: RouteContext<"/api/rounds/[roundId]/submit">) {
  return handle(async () => {
    if (!allowRequest(request, "submit")) throw new ApiError("RATE_LIMITED");
    const roundId = parseWith(roundIdSchema, (await ctx.params).roundId);
    const input = await parseJsonBody(request, submitRequestSchema);
    return Response.json(await submitRound(roundId, input));
  });
}
