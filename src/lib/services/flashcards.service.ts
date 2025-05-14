import type { SupabaseClient } from '@supabase/supabase-js';
import type { FlashcardDto, FlashcardsPaginatedResponseDto } from '../../types';
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
}
