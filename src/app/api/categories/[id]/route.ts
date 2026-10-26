import { handle } from "@/lib/api-errors";
import { deleteCategory, updateCategory } from "@/lib/services/categories";

export async function PUT(request: Request, ctx: RouteContext<"/api/categories/[id]">) {
  const { id } = await ctx.params;
  return handle(async () => updateCategory(id, await request.json()));
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/categories/[id]">) {
  const { id } = await ctx.params;
  return handle(() => deleteCategory(id));
}
