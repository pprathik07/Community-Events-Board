export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Error carrying an HTTP status. Services throw it; `withErrors` maps it. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function error(status: number, code: string, message: string, fields?: Record<string, string>): Response {
  return json({ error: { code, message, fields } }, status);
}

export function withErrors<TContext extends { params: Promise<Record<string, string>> } = { params: Promise<Record<string, string>> }>(
  handler: (req: Request, context: TContext) => Promise<Response>
) {
  // `context` is optional at the call site so unit tests can invoke handlers
  // without params; Next.js always supplies it.
  return async (req: Request, context?: TContext): Promise<Response> => {
    try {
      return await handler(req, context as TContext);
    } catch (e) {
      if (e instanceof ApiError) {
        return error(e.status, e.code, e.message, e.fields);
      }
      if (e instanceof Error && e.name === 'ZodError') {
        const { issues } = e as { issues?: Array<{ path: PropertyKey[]; message: string }> };
        const fields: Record<string, string> = {};
        for (const issue of issues ?? []) {
          if (issue.path.length) fields[issue.path.join('.')] = issue.message;
        }
        return error(400, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', fields);
      }
      if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
        return error(401, 'UNAUTHENTICATED', 'Please log in to continue.');
      }
      if (e instanceof Error && e.message === 'FORBIDDEN') {
        return error(403, 'FORBIDDEN', 'You do not have permission to perform this action.');
      }
      // Services may attach an HTTP status to a plain Error (e.g. 404/409/401).
      if (e instanceof Error && typeof (e as unknown as { status?: unknown }).status === 'number') {
        const status = (e as unknown as { status: number }).status;
        const code =
          status === 400 ? 'VALIDATION_ERROR' :
          status === 401 ? 'UNAUTHENTICATED' :
          status === 403 ? 'FORBIDDEN' :
          status === 404 ? 'NOT_FOUND' :
          status === 409 ? 'CONFLICT' : 'ERROR';
        return error(status, code, e.message);
      }
      console.error('Unhandled error:', e);
      return error(500, 'INTERNAL', 'An unexpected error occurred.');
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid JSON body.');
  }
}