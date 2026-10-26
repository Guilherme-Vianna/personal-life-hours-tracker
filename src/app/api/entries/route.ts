import type { NextRequest } from "next/server";
import { handle } from "@/lib/api-errors";
import { createEntry, listEntries } from "@/lib/services/entries";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return handle(() =>
    listEntries({
      from: params.get("from"),
      to: params.get("to"),
      categoryId: params.get("categoryId"),
      studyTopicId: params.get("studyTopicId"),
      q: params.get("q"),
      limit: Math.min(5000, Number(params.get("limit")) || 500),
    }),
  );
}

export async function POST(request: Request) {
  return handle(async () => createEntry(await request.json()), 201);
}
