import { connection } from "next/server";
import { handle } from "@/lib/api-errors";
import { activitySuggestions } from "@/lib/services/entries";

export async function GET() {
  await connection();
  return handle(activitySuggestions);
}
