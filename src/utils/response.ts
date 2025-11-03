/**
 * Standardized API response utilities
 * Provides consistent response formatting across all endpoints
 */

import type { ApiResponse } from './types';

/**
 * Create a successful API response
 * @param data - Response data payload
 * @returns Formatted success response
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an error API response
 * @param error - Error message
 * @returns Formatted error response
 */
export function errorResponse(error: string): ApiResponse {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
}
