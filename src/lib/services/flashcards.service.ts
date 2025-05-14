import type { SupabaseClient } from '@supabase/supabase-js';
import type { FlashcardDto, FlashcardsPaginatedResponseDto, UpdateFlashcardCommand } from '../../types';
import type { FlashcardsQuerySchemaType } from '../schemas/flashcards.schema';

export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  async getFlashcardById(id: number, userId: string): Promise<FlashcardDto | null> {
    try {
      const { data, error } = await this.supabase
        .from('flashcards')
        .select('id, generation_id, front, back, source, created_at, updated_at')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found
          return null;
        }
        throw new Error(`Failed to fetch flashcard: ${error.message}`);
      }

      return data as FlashcardDto;
    } catch (error) {
      throw new Error(`Unexpected error fetching flashcard: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFlashcards(params: FlashcardsQuerySchemaType, userId: string): Promise<FlashcardsPaginatedResponseDto> {
    const { page, limit, source, sort, order } = params;
    const offset = (page - 1) * limit;

    // Build query
    let query = this.supabase
      .from('flashcards')
      .select('id, generation_id, front, back, source, created_at, updated_at', { count: 'exact' })
      .eq('user_id', userId); // Filter by provided user_id

    // Apply source filter if provided
    if (source) {
      query = query.eq('source', source);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, count, error } = await query;

    // Handle errors
    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    // Calculate total pages
    const total = count ?? 0;
    const pages = Math.ceil(total / limit);

    return {
      data: data as FlashcardDto[],
      pagination: {
        total,
        page,
        limit,
        pages
      }
    };
  }

  async updateFlashcard(
    id: number,
    userId: string,
    command: UpdateFlashcardCommand
  ): Promise<FlashcardDto | null> {
    try {
      // First get the current flashcard to check if it exists and belongs to the user
      const currentFlashcard = await this.getFlashcardById(id, userId);
      if (!currentFlashcard) {
        return null;
      }

      // Prepare update data
      const updateData: Partial<FlashcardDto> = {
        ...command,
        // If source was 'ai-full', change it to 'ai-edited'
        ...(currentFlashcard.source === 'ai-full' && { source: 'ai-edited' as const })
      };

      // Update the flashcard
      const { data, error } = await this.supabase
        .from('flashcards')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select('id, generation_id, front, back, source, created_at, updated_at')
        .single();

      if (error) {
        // Log the detailed error for debugging
        console.error('Database error while updating flashcard:', {
          error,
          flashcardId: id,
          userId,
          updateData
        });

        // Handle specific error cases
        switch (error.code) {
          case '23505': // Unique violation
            throw new Error('Flashcard update failed: Duplicate data conflict');
          case '23503': // Foreign key violation
            throw new Error('Flashcard update failed: Invalid reference');
          case '23514': // Check violation
            throw new Error('Flashcard update failed: Data validation error');
          case '42P01': // Undefined table
            throw new Error('Internal server error: Database configuration issue');
          default:
            throw new Error(`Failed to update flashcard: ${error.message}`);
        }
      }

      // Log successful update
      console.info('Flashcard updated successfully:', {
        flashcardId: id,
        userId,
        newSource: data.source,
        timestamp: new Date().toISOString()
      });

      return data as FlashcardDto;
    } catch (error) {
      // Log unexpected errors
      console.error('Unexpected error in updateFlashcard:', {
        error,
        flashcardId: id,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new Error(`Unexpected error updating flashcard: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
