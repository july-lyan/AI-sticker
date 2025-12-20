export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string; message: string; data?: unknown };

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function fail(error: string, message: string, data?: unknown): ApiError {
  return { success: false, error, message, data };
}
