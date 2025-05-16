/* src/types.ts
   DTO & Command Model definitions generated from database.types.ts and api-plan.md
   —————————————————————————————————————————————————————————— */

import type { Database } from './db/database.types';

/* ───────────────────────── Enums & Helpers ────────────────────────── */

/** All valid flashcard sources accepted by the API */
export type FlashcardSource = 'ai-full' | 'ai-edited' | 'manual';

/** Generic pagination metadata returned by list endpoints */
export interface PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Generic paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetaDto;
}

/* ───────────────────────── Flashcards ─────────────────────────────── */

type FlashcardRow = Database['public']['Tables']['flashcards']['Row'];

/** Single flashcard returned by the API */
export type FlashcardDto = Pick<
  FlashcardRow,
  'id' | 'generation_id' | 'front' | 'back' | 'created_at' | 'updated_at'
> & {
  /** Narrow the raw `string` → discriminated literal union */
  source: FlashcardSource;
};

/** Query-string schema for GET /api/flashcards */
export interface FlashcardQueryParams {
  page?: number;
  limit?: number;
  source?: FlashcardSource;
  sort?: 'created_at' | 'updated_at' | 'id';
  order?: 'asc' | 'desc';
}

/** Minimal payload for creating one flashcard (used in bulk create) */
export type CreateFlashcardInputDto = Pick<
  FlashcardDto,
  'front' | 'back' | 'source' | 'generation_id'
>;

/** Command model for POST /api/flashcards */
export interface CreateFlashcardsCommand {
  flashcards: CreateFlashcardInputDto[];
}

/** Response DTO for POST /api/flashcards */
export interface CreateFlashcardsResponseDto {
  flashcards: FlashcardDto[];
}

/** Command model for PUT /api/flashcards/:id */
export type UpdateFlashcardCommand = Partial<Pick<FlashcardDto, 'front' | 'back'>>;

/** Paginated response for GET /api/flashcards */
export type FlashcardsPaginatedResponseDto = PaginatedResponse<FlashcardDto>;

/* ───────────────────────── Generations ────────────────────────────── */

type GenerationRow = Database['public']['Tables']['generations']['Row'];

/** Single generation session DTO */
export type GenerationDto = GenerationRow;

/** Query-string schema for GET /api/generations */
export interface GenerationsQueryParams {
  page?: number;
  limit?: number;
  sort?: 'created_at';
  order?: 'asc' | 'desc';
}

/** Command model for POST /api/generations */
export interface GenerateFlashcardsCommand {
  /** Plain source text (1000-10000 chars) to be sent to the AI */
  source_text: string;
}

/** Proposal item returned immediately after generation */
export type FlashcardProposalDto = Pick<FlashcardDto, 'front' | 'back'> & {
  /** All proposals are born as ‘ai-full’ */
  source: Extract<FlashcardSource, 'ai-full'>;
};

/** Response DTO for POST /api/generations */
export interface GenerateFlashcardsResponseDto {
  generation_id: GenerationDto['id'];
  flashcards_proposal: FlashcardProposalDto[];
}

/** Paginated response for GET /api/generations */
export type GenerationsPaginatedResponseDto = PaginatedResponse<GenerationDto>;

/* ─────────────────── Generation Error Logs (internal) ────────────── */

type GenerationErrorLogRow = Database['public']['Tables']['generation_error_logs']['Row'];

/** DTO representing a single error log emitted by the AI service */
export type GenerationErrorLogDto = GenerationErrorLogRow;
