/**
 * @file lib/logger.ts
 * Lightweight structured JSON logger for observability.
 */
import { env } from "@/lib/config/env";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  service?: string;
  operation?: string;
  transactionId?: string;
  executionTimeMs?: number;
  [key: string]: any;
}

class StructuredLogger {
  private log(level: LogLevel, message: string, payload?: LogPayload) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      env: env.NODE_ENV,
      ...payload,
    };

    if (env.NODE_ENV === "development") {
      // Human-readable in dev
      const prefix = `[${level.toUpperCase()}] ${message}`;
      if (payload?.error) {
        console[level](prefix, payload, payload.error);
      } else {
        console[level](prefix, payload || "");
      }
    } else {
      // NDJSON in prod
      console[level](JSON.stringify(entry));
    }
  }

  debug(message: string, payload?: LogPayload) {
    this.log("debug", message, payload);
  }

  info(message: string, payload?: LogPayload) {
    this.log("info", message, payload);
  }

  warn(message: string, payload?: LogPayload) {
    this.log("warn", message, payload);
  }

  error(message: string, error?: Error | unknown, payload?: LogPayload) {
    this.log("error", message, {
      ...payload,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
  }
}

export const logger = new StructuredLogger();
