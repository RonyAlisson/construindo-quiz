import { ApiError, handle, parseJsonBody, parseWith } from "@/lib/api";
import { allowRequest } from "@/lib/rate-limit";
import { answerQuestion } from "@/lib/rounds";
import { answerRequestSchema, roundIdSchema } from "@/lib/validation";

// POST /api/rounds/{roundId}/answers: responde a próxima pergunta; o acerto é calculado no servidor.
export async function POST(request: Request, ctx: RouteContext<"/api/rounds/[roundId]/answers">) {
  return handle(async () => {
    if (!allowRequest(request, "answers")) throw new ApiError("RATE_LIMITED");
    const roundId = parseWith(roundIdSchema, (await ctx.params).roundId);
    const { questionId, answer } = await parseJsonBody(request, answerRequestSchema);
    return Response.json(await answerQuestion(roundId, questionId, answer));
  });
}
