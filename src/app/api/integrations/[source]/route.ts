import { handle } from "@/lib/api-errors";
import { assertIntegrationToken, sourceParam, sourceStatus } from "@/lib/services/integrations";

export async function GET(request: Request, ctx: RouteContext<"/api/integrations/[source]">) {
  const { source } = await ctx.params;
  return handle(async () => {
    assertIntegrationToken(request);
    return sourceStatus(sourceParam.parse(source));
  });
}
