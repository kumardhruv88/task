import { describe, it, expect, vi } from 'vitest';
import { withErrorHandler } from '@/lib/api/error-handler';
import { NextRequest } from 'next/server';
import { EntityNotFoundError, DuplicateAdvancePayoutError } from '@/lib/errors';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

describe('API Error Handler', () => {
  it('returns 200 on success', async () => {
    const handler = withErrorHandler(async () => {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });

    const req = new NextRequest('http://localhost/api/test', { method: 'GET' });
    const res = await handler(req, { params: {} });
    
    expect(res.status).toBe(200);
  });

  it('maps EntityNotFoundError to 404', async () => {
    const handler = withErrorHandler(async () => {
      throw new EntityNotFoundError('User', '123');
    });

    const req = new NextRequest('http://localhost/api/test', { method: 'GET' });
    const res = await handler(req, { params: {} });
    
    expect(res.status).toBe(404);
  });

  it('maps DuplicateAdvancePayoutError to 409', async () => {
    const handler = withErrorHandler(async () => {
      throw new DuplicateAdvancePayoutError('sale-123');
    });

    const req = new NextRequest('http://localhost/api/test', { method: 'POST' });
    const res = await handler(req, { params: {} });
    
    expect(res.status).toBe(409);
  });

  it('maps ZodError to 400', async () => {
    const handler = withErrorHandler(async () => {
      throw new ZodError([]);
    });

    const req = new NextRequest('http://localhost/api/test', { method: 'POST' });
    const res = await handler(req, { params: {} });
    
    expect(res.status).toBe(400);
  });

  it('maps Prisma P2002 to 409', async () => {
    const handler = withErrorHandler(async () => {
      throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.8.0'
      });
    });

    const req = new NextRequest('http://localhost/api/test', { method: 'POST' });
    const res = await handler(req, { params: {} });
    
    // We added this in the error handler!
    // But since `withErrorHandler` tries to construct an `apiError` response, we need to check status
    // Wait, the error handler explicitly handles PrismaClientKnownRequestError?
    // Wait, the error handler DOES NOT explicitly catch PrismaClientKnownRequestError and return `apiError` correctly.
    // Let's see `error-handler.ts`:
    // It maps status to 409, but it falls down to `logger.error` and returns 500!
    // Oh no, in `error-handler.ts`, there's no `if (error instanceof Prisma.PrismaClientKnownRequestError) return apiError(...)` 
    // It only gets the `statusCode` but then fails to use it because it falls into the 500 block!
    
    expect(res.status).toBe(409); // Wait, this will fail if it falls back to 500!
  });
});
