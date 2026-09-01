import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export function apiSuccess<T>(data: T, status: number = 200) {
  const payload =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? {
          ...data,
          meta: {
            synthetic: true,
            environment: 'contest-prototype',
            timestamp: new Date().toISOString(),
          },
        }
      : data;

  return NextResponse.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/json',
      'X-Astera-Synthetic-Data': 'true',
    },
  });
}

export function apiError(
  title: string,
  detail: string,
  status: number = 400,
  errors?: Record<string, string[]>
) {
  const problem: ProblemDetails = {
    type: `https://astera.local/errors/${status}`,
    title,
    status,
    detail,
    errors,
  };
  return NextResponse.json(problem, {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || 'body';
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(issue.message);
    }
    return apiError('Validation Error', 'Request payload failed schema validation', 422, formattedErrors);
  }

  if (error instanceof Error) {
    if (error.name === 'IdempotencyConflictError') {
      return apiError('Conflict', error.message, 409);
    }
    return apiError('Internal Server Error', error.message, 500);
  }

  return apiError('Unknown Error', 'An unexpected error occurred', 500);
}
