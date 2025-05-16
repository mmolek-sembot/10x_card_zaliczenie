import type { APIRoute } from 'astro';

import { generateFlashcardsSchema } from '../../lib/schemas/generation.schema';
import { GenerationService } from '../../lib/services/generation.service';

export const prerender = false;

/**
 * POST /api/generations
 * Creates a new flashcard generation based on provided source text
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase } = locals;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Middleware gwarantuje, że session istnieje dla endpointów API
  // TypeScript assertion ponieważ middleware sprawdza sesję
  const user = session!.user;

  try {
    // Parse and validate request body
    const requestData = await request.json();
    const validationResult = generateFlashcardsSchema.safeParse(requestData);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid input data',
          details: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Process generation request using service
    const generationService = new GenerationService(supabase);
    const result = await generationService.generateFlashcards(user.id, validationResult.data);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generations POST endpoint:', error);

    // Return appropriate error response
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
