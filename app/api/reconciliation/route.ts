import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { reconciliationService } from "@/services/reconciliation.service";

/**
 * POST /api/reconciliation
 * Triggers the nightly reconciliation process.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  // In production, this route should be secured by an internal API key or cron secret.
  await reconciliationService.runNightlyReconciliation();

  return apiSuccess(null, "Nightly reconciliation job completed successfully");
});
