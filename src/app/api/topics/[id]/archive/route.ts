import { handle } from "@/lib/api-errors";
import { todayISO } from "@/lib/dates";
import { archiveTopic, unarchiveTopic } from "@/lib/services/topics";

export async function POST(request: Request, ctx: RouteContext<"/api/topics/[id]/archive">) {
  const { id } = await ctx.params;
  return handle(async () => archiveTopic(id, await request.json(), todayISO()));
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/topics/[id]/archive">) {
  const { id } = await ctx.params;
  return handle(() => unarchiveTopic(id));
}
