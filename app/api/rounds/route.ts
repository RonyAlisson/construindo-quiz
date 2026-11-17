import { ApiError, handle } from "@/lib/api";
import { allowRequest } from "@/lib/rate-limit";
import { createRound } from "@/lib/rounds";

// POST /api/rounds: cria uma rodada. Responde só {id, level, topic, statement}; nunca o gabarito.
export async function POST(request: Request) {
  return handle(async () => {
    if (!allowRequest(request, "rounds")) throw new ApiError("RATE_LIMITED");
    const round = await createRound();
    return Response.json(round, { status: 201 });
  });
}
