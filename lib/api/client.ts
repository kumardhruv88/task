import axios, { AxiosRequestConfig } from "axios";
import { setupInterceptors } from "./interceptors";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    "Content-Type": "application/json",
    // Mocking auth for demonstration purposes
    "x-operator-id": "system",
  },
});

setupInterceptors(axiosInstance);

/**
 * Strongly typed wrapper around Axios to enforce standard HTTP methods.
 */
export const apiClient = {
  get: <TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse> => {
    return axiosInstance.get(url, config);
  },
  post: <TRequest, TResponse>(url: string, data?: TRequest, config?: AxiosRequestConfig): Promise<TResponse> => {
    return axiosInstance.post(url, data, config);
  },
  patch: <TRequest, TResponse>(url: string, data?: TRequest, config?: AxiosRequestConfig): Promise<TResponse> => {
    return axiosInstance.patch(url, data, config);
  },
  delete: <TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse> => {
    return axiosInstance.delete(url, config);
  },
};
