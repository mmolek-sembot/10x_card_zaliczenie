import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { 
  CreateFlashcardsCommand, 
  CreateFlashcardsResponseDto,
  FlashcardSource 
} from '../../types';

import { FlashcardsService } from '../../lib/services/flashcards.service';
import { flashcardsQuerySchema } from '../../lib/schemas/flashcards.schema';

// Validation schema for a single flashcard
const flashcardSchema = z.object({
  front: z.string()
    .min(1, 'Front content is required')
    .max(200, 'Front content cannot exceed 200 characters'),
  back: z.string()
    .min(1, 'Back content is required')
    .max(600, 'Back content cannot exceed 600 characters'),
  source: z.enum(['ai-full', 'ai-edited', 'manual'] as const),
  generation_id: z.number().nullable()
}).refine(data => {
  // Validate generation_id based on source type
  if (['ai-full', 'ai-edited'].includes(data.source) && data.generation_id === null) {
    return false;
  }
  if (data.source === 'manual' && data.generation_id !== null) {
    return false;
  }
  return true;
}, {
  message: "generation_id is required for AI cards and must be null for manual cards"
});

// Validation schema for the entire request
const createFlashcardsSchema = z.object({
  flashcards: z.array(flashcardSchema)
    .min(1, 'At least one flashcard is required')
    .max(100, 'Maximum 100 flashcards per request')
});

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validationResult = createFlashcardsSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const command = validationResult.data as CreateFlashcardsCommand;
    const { supabase } = locals;

    // Get user session - middleware gwarantuje, że session istnieje
    const { data: { session } } = await supabase.auth.getSession();
    const user = session!.user;

    // 2. Validate generation_id references if present
    const generationIds = command.flashcards
      .map(f => f.generation_id)
      .filter((id): id is number => id !== null);

    if (generationIds.length > 0) {
      const { data: generations, error: genError } = await supabase
        .from('generations')
        .select('id')
        .in('id', generationIds)
        .eq('user_id', user.id);

      if (genError) {
        console.error('Error checking generations:', genError);
        return new Response(JSON.stringify({
          error: 'Error validating generation references'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const foundIds = new Set(generations?.map(g => g.id) ?? []);
      const invalidIds = generationIds.filter(id => !foundIds.has(id));

      if (invalidIds.length > 0) {
        return new Response(JSON.stringify({
          error: 'Invalid generation references',
          details: `Generation IDs not found: ${invalidIds.join(', ')}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. Insert flashcards
    const flashcardsToInsert = command.flashcards.map(flashcard => ({
      ...flashcard,
      user_id: user.id,
    }));

    const { data: createdFlashcards, error: dbError } = await supabase
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select();

    if (dbError) {
      console.error('Error creating flashcards:', dbError);
      return new Response(JSON.stringify({
        error: 'Error saving flashcards to database'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Prepare response
    const response: CreateFlashcardsResponseDto = {
      flashcards: createdFlashcards.map(flashcard => ({
        ...flashcard,
        source: flashcard.source as FlashcardSource
      }))
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing flashcards creation:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get URL search params
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams);

    // Validate query parameters
    const result = flashcardsQuerySchema.safeParse(searchParams);
    if (!result.success) {
      return new Response(JSON.stringify({
        error: 'Invalid query parameters',
        details: result.error.issues
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get flashcards
    const { supabase } = locals;

    // Get user session - middleware gwarantuje, że session istnieje
    const { data: { session } } = await supabase.auth.getSession();
    const user = session!.user;

    const service = new FlashcardsService(supabase);
    const response = await service.getFlashcards(result.data, user.id);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
