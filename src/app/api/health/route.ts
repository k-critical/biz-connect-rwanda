import { getHealthReport } from "@/server/services/health-service";

export async function GET() {
  const report = await getHealthReport();
  return Response.json(report, { status: report.status === "ok" ? 200 : 503 });
}
