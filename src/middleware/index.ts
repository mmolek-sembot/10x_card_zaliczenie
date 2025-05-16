import type { MiddlewareHandler } from 'astro';
import { createSupabaseServerInstance } from '../db/supabase.client';

export const onRequest: MiddlewareHandler = (async (context, next) => {
  // Tworzenie instancji Supabase dla każdego requestu
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers
  });

  // Dodanie instancji do locals
  context.locals.supabase = supabase;

  // Sprawdzenie sesji dla endpointów API
  if (context.url.pathname.startsWith('/api/') && !context.url.pathname.startsWith('/api/auth/')) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return next();
});
