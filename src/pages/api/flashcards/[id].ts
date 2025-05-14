import { z } from 'zod';
import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../../lib/services/flashcards.service';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';

// Disable static pre-rendering for dynamic API route
export const prerender = false;

// Validate flashcard ID parameter
const flashcardIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Early return if no Supabase client or user
    // if (!locals.supabase || !locals.user) {
    //   return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    //     status: 401,
    //     headers: { 'Content-Type': 'application/json' }
    //   });
    // }

    // Validate ID parameter
    const result = flashcardIdSchema.safeParse({ id: params.id });
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid flashcard ID',
        details: result.error.issues 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize service and fetch flashcard
    const flashcardsService = new FlashcardsService(locals.supabase);
    const flashcard = await flashcardsService.getFlashcardById(result.data.id, DEFAULT_USER_ID);

    // Return 404 if flashcard not found
    if (!flashcard) {
      return new Response(JSON.stringify({ 
        error: 'Flashcard not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return successful response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching flashcard:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
