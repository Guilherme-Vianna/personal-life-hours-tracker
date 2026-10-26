import type { NextRequest } from "next/server";
import { handle } from "@/lib/api-errors";
import { isPeriod, todayISO } from "@/lib/dates";
import { dashboardStats } from "@/lib/services/stats";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const period = params.get("period");
  return handle(() =>
    dashboardStats({ period: isPeriod(period) ? period : "month", includeFixed: params.get("includeFixed") === "true", today: todayISO() }),
  );
}
