import type { MiddlewareHandler } from 'astro';
import { createSupabaseServerInstance } from '../db/supabase.client';

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Create Supabase instance for each request
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Add instance to locals
  context.locals.supabase = supabase;

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Define public paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/register', '/auth/reset-password', '/api/auth'];

  // Check if the current path is public
  const isPublicPath = publicPaths.some((path) => context.url.pathname.startsWith(path));

  if (!isPublicPath) {
    // For API endpoints
    if (context.url.pathname.startsWith('/api/')) {
      if (!session?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    // For regular pages
    else if (!session?.user) {
      return context.redirect('/auth/login');
    }
  }

  return next();
};
