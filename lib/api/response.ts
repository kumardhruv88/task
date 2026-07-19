import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  timestamp: string;
}

export function apiSuccess<T>(data: T, message = "Success", status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function apiError(message: string, error?: any, status = 500) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
