import { handle } from "@/lib/api-errors";
import { deleteEntry, updateEntry } from "@/lib/services/entries";

export async function PUT(request: Request, ctx: RouteContext<"/api/entries/[id]">) {
  const { id } = await ctx.params;
  return handle(async () => updateEntry(id, await request.json()));
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/entries/[id]">) {
  const { id } = await ctx.params;
  return handle(() => deleteEntry(id));
}
