import { handle } from "@/lib/api-errors";
import { deleteRoutine, updateRoutine } from "@/lib/services/routines";

export async function PUT(request: Request, ctx: RouteContext<"/api/routines/[id]">) {
  const { id } = await ctx.params;
  return handle(async () => updateRoutine(id, await request.json()));
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/routines/[id]">) {
  const { id } = await ctx.params;
  return handle(() => deleteRoutine(id));
}
