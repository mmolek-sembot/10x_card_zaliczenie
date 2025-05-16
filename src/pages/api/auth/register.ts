import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '@/db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    // Register the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return new Response(JSON.stringify({ error: 'Błąd rejestracji' }), { status: 400 });
    }

    // Automatically sign in after registration
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return new Response(JSON.stringify({ error: 'Błąd logowania po rejestracji' }), {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({
        user: signInData.user,
        session: signInData.session,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Błąd serwera' }), { status: 500 });
  }
};
