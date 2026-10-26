import { handle, notFound } from "@/lib/api-errors";
import { todayISO } from "@/lib/dates";
import { deleteTopic, getTopic, updateTopic } from "@/lib/services/topics";

export async function GET(_request: Request, ctx: RouteContext<"/api/topics/[id]">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const topic = await getTopic(id, todayISO());
    if (!topic) throw notFound("Tema");
    return topic;
  });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/topics/[id]">) {
  const { id } = await ctx.params;
  return handle(async () => updateTopic(id, await request.json()));
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/topics/[id]">) {
  const { id } = await ctx.params;
  return handle(() => deleteTopic(id));
}
