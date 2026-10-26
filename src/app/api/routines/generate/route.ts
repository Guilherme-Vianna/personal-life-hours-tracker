import { handle } from "@/lib/api-errors";
import { generateFromRoutines } from "@/lib/services/routines";

export async function POST(request: Request) {
  return handle(async () => generateFromRoutines(await request.json()), 201);
}
