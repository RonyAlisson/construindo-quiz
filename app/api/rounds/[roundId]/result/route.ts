import { handle, parseWith } from "@/lib/api";
import { getResult } from "@/lib/rounds";
import { roundIdSchema } from "@/lib/validation";

// GET /api/rounds/{roundId}/result: resultado de uma rodada terminada.
export async function GET(_request: Request, ctx: RouteContext<"/api/rounds/[roundId]/result">) {
  return handle(async () => {
    const roundId = parseWith(roundIdSchema, (await ctx.params).roundId);
    return Response.json(await getResult(roundId));
  });
}
