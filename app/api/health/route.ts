import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/config/env";

/**
 * GET /api/health
 * Returns the health status of the application and database connectivity.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  let dbStatus = "disconnected";
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "error";
  }

  return apiSuccess({
    status: "ok",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});
