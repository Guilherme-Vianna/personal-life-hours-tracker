import { connection } from "next/server";
import { handle } from "@/lib/api-errors";
import { todayISO } from "@/lib/dates";
import { createTopic, listTopics } from "@/lib/services/topics";

export async function GET() {
  await connection();
  return handle(() => listTopics(todayISO()));
}

export async function POST(request: Request) {
  return handle(async () => createTopic(await request.json()), 201);
}
