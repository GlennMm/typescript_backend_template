import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export function successResponse<T>(res: Response, data: T, statusCode: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
) {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
  return res.status(statusCode).json(response);
}
