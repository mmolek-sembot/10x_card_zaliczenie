import { z } from 'zod';
import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../../lib/services/flashcards.service';

import type { UpdateFlashcardCommand } from '../../../types';

// Disable static pre-rendering for dynamic API route
export const prerender = false;

// Validate flashcard ID parameter
const flashcardIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Validate update flashcard command
const updateFlashcardSchema = z
  .object({
    front: z.string().max(200).optional(),
    back: z.string().max(600).optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one of 'front' or 'back' must be provided",
  });

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Early return if no Supabase client or user
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate ID parameter
    const result = flashcardIdSchema.safeParse({ id: params.id });
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid flashcard ID',
          details: result.error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize service and fetch flashcard
    const flashcardsService = new FlashcardsService(locals.supabase);
    const flashcard = await flashcardsService.getFlashcardById(result.data.id, locals.user.id);

    // Return 404 if flashcard not found
    if (!flashcard) {
      return new Response(
        JSON.stringify({
          error: 'Flashcard not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return successful response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching flashcard:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Early return if no Supabase client or user
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate ID parameter
    const result = flashcardIdSchema.safeParse({ id: params.id });
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid flashcard ID',
          details: result.error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Log incoming request
    console.info('Processing DELETE /api/flashcards/:id request:', {
      flashcardId: params.id,
      timestamp: new Date().toISOString(),
    });

    // Initialize service and delete flashcard
    const flashcardsService = new FlashcardsService(locals.supabase);
    const deleted = await flashcardsService.deleteFlashcard(result.data.id, locals.user.id);

    // Return 404 if flashcard not found
    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: 'Flashcard not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return successful response with no content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Early return if no Supabase client or user
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate ID parameter
    const idResult = flashcardIdSchema.safeParse({ id: params.id });
    if (!idResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid flashcard ID',
          details: idResult.error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Log incoming request
    console.info('Processing PUT /api/flashcards/:id request:', {
      flashcardId: params.id,
      userId: locals.user.id,
      timestamp: new Date().toISOString(),
    });

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', {
        error,
        rawBody: await request.text(),
      });
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const updateResult = updateFlashcardSchema.safeParse(body);
    if (!updateResult.success) {
      console.warn('Validation error in PUT /api/flashcards/:id:', {
        flashcardId: params.id,
        issues: updateResult.error.issues,
        receivedData: body,
      });
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          details: updateResult.error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize service and update flashcard
    const flashcardsService = new FlashcardsService(locals.supabase);
    try {
      const updatedFlashcard = await flashcardsService.updateFlashcard(
        idResult.data.id,
        locals.user.id,
        updateResult.data
      );

      // Return 404 if flashcard not found
      if (!updatedFlashcard) {
        console.warn('Flashcard not found:', {
          flashcardId: idResult.data.id,
          userId: locals.user.id,
        });
        return new Response(
          JSON.stringify({
            error: 'Flashcard not found',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Return successful response
      return new Response(JSON.stringify(updatedFlashcard), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // Handle specific error cases from service
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Map service errors to appropriate HTTP status codes
      let status = 500;
      if (errorMessage.includes('Duplicate data conflict')) status = 409;
      else if (errorMessage.includes('Data validation error')) status = 400;
      else if (errorMessage.includes('Invalid reference')) status = 400;

      console.error('Error in PUT /api/flashcards/:id:', {
        error,
        flashcardId: idResult.data.id,
        userId: locals.user.id,
        status,
      });

      return new Response(
        JSON.stringify({
          error: errorMessage,
        }),
        {
          status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in PUT /api/flashcards/:id:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      params,
    });

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
