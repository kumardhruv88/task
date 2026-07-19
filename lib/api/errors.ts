/**
 * Custom API Error class to preserve HTTP status codes and payloads.
 */
export class ApiError extends Error {
  public statusCode: number;
  public data: any;

  constructor(message: string, statusCode: number = 500, data: any = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Parses an Axios error or standard error into a predictable string or object.
 */
export function extractErrorMessage(error: any): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;
    if (data.details) return JSON.stringify(data.details);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}
