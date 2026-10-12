import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import {
  getCorsHeaders,
  handleCorsPrelight,
  validateCsrfProtection,
  errorResponse,
} from './security.ts';

// Request-local identity only; clients cannot supply or persist this context.
const admittedUsers = new WeakMap<Request, any>();
export const getAdmittedUser = (req: Request) => admittedUsers.get(req);

export async function checkSharedRateLimit(
  db: any,
  key: string,
  config: { maxRequests: number; windowMs: number }
) {
  const { data, error } = await db.rpc('check_shared_ai_burst', {
    p_key: key,
    p_max: config.maxRequests,
    p_window_ms: config.windowMs,
  });
  if (error || !data) throw new Error('AI admission is temporarily unavailable');
  return data as { allowed: boolean; resetIn: number; remaining: number };
}

/** Distributed leases last longer than a Free-plan worker's 150s lifetime. */
export function withTextAiAdmission(
  route: string,
  handler: (req: Request) => Promise<Response>,
  skipOperations: string[] = []
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return handleCorsPrelight(req);
    const headers = getCorsHeaders(req);
    if (!validateCsrfProtection(req).valid)
      return errorResponse('Request origin is not allowed', 403, headers);
    let operation = '';
    // Status/bootstrap operations must never consume an AI concurrency slot.
    if (skipOperations.length) {
      try {
        operation = (await req.clone().json()).operation || '';
      } catch {
        return errorResponse('Invalid request body', 400, headers);
      }
      if (skipOperations.includes(operation)) return handler(req);
    }
    const db = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: { persistSession: false },
      }
    );
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return errorResponse('Please sign in', 401, headers);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return errorResponse('Please sign in', 401, headers);
    let lease: string | null = null;
    try {
      const { data, error } = await db.rpc('acquire_text_ai_lease', {
        p_key: `${route}:${auth.user.id}`,
      });
      if (error || !data)
        return errorResponse('AI admission is temporarily unavailable', 503, headers);
      if (!data.allowed)
        return new Response(
          JSON.stringify({
            error: 'AI is busy. Please try again shortly.',
            rateLimitType: 'capacity',
            retryAfterSeconds: data.retryAfterSeconds,
          }),
          {
            status: 429,
            headers: {
              ...headers,
              'Content-Type': 'application/json',
              'Retry-After': String(data.retryAfterSeconds),
            },
          }
        );
      lease = data.leaseId;
      admittedUsers.set(req, auth.user);
      return await handler(req);
    } finally {
      admittedUsers.delete(req);
      if (lease) {
        try {
          const { error } = await db.rpc('release_text_ai_lease', { p_lease: lease });
          if (error) console.warn('AI lease release failed; it will expire automatically');
        } catch {
          console.warn('AI lease release interrupted; it will expire automatically');
        }
      }
    }
  };
}
