import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '@/db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Błąd wylogowania' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Błąd wylogowania' }),
      { status: 500 }
    );
  }
};
