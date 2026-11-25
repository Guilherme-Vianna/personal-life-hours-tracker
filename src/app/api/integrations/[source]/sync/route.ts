import { handle } from "@/lib/api-errors";
import { assertIntegrationToken, sourceParam, syncFromSource } from "@/lib/services/integrations";

export const maxDuration = 60;

export async function POST(request: Request, ctx: RouteContext<"/api/integrations/[source]/sync">) {
  const { source } = await ctx.params;
  return handle(async () => {
    assertIntegrationToken(request);
    return syncFromSource(sourceParam.parse(source), await request.json());
  });
}
