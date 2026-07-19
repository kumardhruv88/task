import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { apiError } from "./response";
import {
  DomainError,
  EntityNotFoundError,
  DuplicateAdvancePayoutError,
  SaleAlreadyProcessedError,
  WithdrawalTooSoonError,
  InsufficientBalanceError,
  InvalidStatusTransitionError,
  ConcurrentModificationError,
} from "@/lib/errors";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<any> | any }
) => Promise<Response> | Response;

/**
 * Maps custom DomainErrors to HTTP status codes.
 */
function mapErrorToHttpStatus(error: Error): number {
  if (error instanceof ZodError) return 400;
  
  if (error instanceof EntityNotFoundError) return 404;
  
  if (
    error instanceof DuplicateAdvancePayoutError ||
    error instanceof SaleAlreadyProcessedError ||
    error instanceof InvalidStatusTransitionError ||
    error instanceof WithdrawalTooSoonError
  ) {
    return 409; // Conflict
  }

  if (error instanceof InsufficientBalanceError) {
    return 422; // Unprocessable Entity
  }

  if (error instanceof ConcurrentModificationError) {
    return 409; // Conflict
  }

  if (error instanceof DomainError) return 400; // Generic bad request for other domain errors

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return 409; // Unique constraint violation
    if (error.code === 'P2025') return 404; // Record not found
  }

  return 500;
}

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context: { params: any }) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    const route = req.nextUrl.pathname;

    try {
      logger.info(`[REQ] ${req.method} ${route}`, { requestId });
      const response = await handler(req, context);
      
      logger.info(`[RES] ${req.method} ${route} - ${response.status}`, {
        requestId,
        executionTimeMs: Date.now() - startTime,
      });

      return response;
    } catch (error: any) {
      const statusCode = mapErrorToHttpStatus(error);
      const executionTimeMs = Date.now() - startTime;

      if (error instanceof ZodError) {
        logger.warn(`[VALIDATION_ERROR] ${req.method} ${route}`, { requestId, executionTimeMs });
        return apiError("Validation failed", error.issues, 400);
      }

      if (error instanceof DomainError) {
        logger.warn(`[DOMAIN_ERROR] ${error.code} on ${route}`, {
          requestId,
          executionTimeMs,
          details: error.details,
        });
        return apiError(error.message, { code: error.code, details: error.details }, statusCode);
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        logger.warn(`[PRISMA_ERROR] ${error.code} on ${route}`, { requestId, executionTimeMs });
        let message = "A database error occurred";
        if (error.code === 'P2002') message = "Unique constraint violation - resource already exists";
        if (error.code === 'P2025') message = "Record not found";
        return apiError(message, { code: error.code }, statusCode);
      }

      // 500 Internal Server Error
      logger.error(`[INTERNAL_ERROR] ${req.method} ${route}`, error, { requestId, executionTimeMs });
      
      // Never expose internal error stack to the client
      return apiError("An internal server error occurred", undefined, 500);
    }
  };
}
