import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { withErrorHandler } from "@/lib/api/error-handler";
import { payoutService } from "@/services/payout.service";
import { z } from "zod";

const RunJobSchema = z.object({
  limit: z.number().int().min(1).max(1000).default(100),
});

/**
 * POST /api/admin/run-advance-payout-job
 * Triggers the advance payout processor. Ensures idempotency inside the service.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  let limit = 100;
  
  try {
    const body = await req.json();
    const data = RunJobSchema.parse(body);
    limit = data.limit;
  } catch (e) {
    // If no body provided, fallback to default limit 100
  }

  // The service internally ensures duplicate processing is impossible.
  await payoutService.processAdvancePayouts(limit);

  return apiSuccess(null, `Advance payout job completed (Limit: ${limit})`);
});
