/**
 * @file lib/errors.ts
 * Domain-specific error classes for the Affiliate Payout System.
 * Ensures consistent error handling and reliable mapping to HTTP status codes in route handlers.
 */

export class DomainError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class SaleAlreadyProcessedError extends DomainError {
  constructor(saleId: string) {
    super(`Sale ${saleId} has already been processed.`, "SALE_ALREADY_PROCESSED", { saleId });
  }
}

export class DuplicateAdvancePayoutError extends DomainError {
  constructor(saleId: string) {
    super(`An advance payout already exists for sale ${saleId}.`, "DUPLICATE_ADVANCE_PAYOUT", { saleId });
  }
}

export class WithdrawalTooSoonError extends DomainError {
  constructor(affiliateId: string, retryAfter: Date) {
    super(
      `Only one withdrawal allowed per 24 hours. Retry after ${retryAfter.toISOString()}`,
      "WITHDRAWAL_TOO_SOON",
      { affiliateId, retryAfter }
    );
  }
}

export class InsufficientBalanceError extends DomainError {
  constructor(affiliateId: string, requested: number, available: number) {
    super(`Insufficient wallet balance. Requested: ${requested}, Available: ${available}`, "INSUFFICIENT_BALANCE", {
      affiliateId,
      requested,
      available,
    });
  }
}

export class InvalidStatusTransitionError extends DomainError {
  constructor(entity: string, id: string, from: string, to: string) {
    super(`Cannot transition ${entity} ${id} from ${from} to ${to}`, "INVALID_STATUS_TRANSITION", {
      entity,
      id,
      from,
      to,
    });
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with ID ${id} not found.`, "ENTITY_NOT_FOUND", { entity, id });
  }
}

export class ConcurrentModificationError extends DomainError {
  constructor(entity: string, id: string) {
    super(`Concurrent modification detected on ${entity} ${id}. Please retry.`, "CONCURRENT_MODIFICATION", {
      entity,
      id,
    });
  }
}
