import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled Application Error:', err);

  // Check if error is related to CognoDB Bolt connection
  const isConnectionError =
    err.code === 'ServiceUnavailable' ||
    err.code === 'SessionExpired' ||
    err.message?.includes('Connection refused') ||
    err.message?.includes('Failed to connect to');

  if (isConnectionError) {
    res.status(503).json({
      success: false,
      error: 'CognoDB Graph Database is currently unreachable. Check your COGNODB_URI, COGNODB_USERNAME, and COGNODB_PASSWORD credentials in .env.',
      details: err.message,
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}

