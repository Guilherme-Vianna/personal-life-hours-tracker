import { connection } from "next/server";
import { handle } from "@/lib/api-errors";
import { createRoutine, listRoutines } from "@/lib/services/routines";

export async function GET() {
  await connection();
  return handle(listRoutines);
}

export async function POST(request: Request) {
  return handle(async () => createRoutine(await request.json()), 201);
}
