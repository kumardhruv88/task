import { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { ApiError } from "./errors";

/**
 * Unwraps { success: true, data: X } responses automatically.
 */
export const unwrapResponseData = (response: AxiosResponse) => {
  if (response.data && response.data.success !== undefined) {
    return response.data.data;
  }
  return response.data;
};

/**
 * Intercepts Axios errors and converts them to standard ApiErrors.
 */
export const handleApiError = (error: AxiosError) => {
  const statusCode = error.response?.status || 500;
  const errorPayload = error.response?.data || {};
  
  // Create a structured ApiError instead of a generic Error
  const parsedMessage = 
    (errorPayload as any)?.error || 
    (errorPayload as any)?.message || 
    error.message;

  return Promise.reject(new ApiError(parsedMessage, statusCode, errorPayload));
};

/**
 * Attaches all interceptors to an axios instance.
 */
export const setupInterceptors = (client: AxiosInstance) => {
  client.interceptors.response.use(unwrapResponseData, handleApiError);
};
