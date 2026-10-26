import { connection } from "next/server";
import { handle } from "@/lib/api-errors";
import { createCategory, listCategories } from "@/lib/services/categories";

export async function GET() {
  await connection();
  return handle(listCategories);
}

export async function POST(request: Request) {
  return handle(async () => createCategory(await request.json()), 201);
}
