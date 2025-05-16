import type { FlashcardSource, CreateFlashcardInputDto, FlashcardProposalDto } from '../../types';

export interface GeneratorViewModel {
  state: GenerationState;
  sourceText: string;
  generationId: number | null;
  flashcards: FlashcardProposalViewModel[];
  isGenerating: boolean;
  isSaving: boolean;
  error: string | null;
}

export type GenerationState = 'input' | 'generating' | 'review' | 'saving' | 'complete';

export interface FlashcardProposalViewModel {
  id: number; // Lokalny identyfikator (nie z bazy)
  front: string;
  back: string;
  source: FlashcardSource;
  status: FlashcardStatus;
  errors: {
    front?: string;
    back?: string;
  };
}

export type FlashcardStatus = 'pending' | 'accepted' | 'rejected' | 'edited';

export interface FlashcardUpdateData {
  front?: string;
  back?: string;
}

export interface GenerationFormState {
  text: string;
  isValid: boolean;
  errors: {
    text?: string;
  };
}

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  minLength: number;
  maxLength: number;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export interface SaveFlashcardsPayload {
  flashcards: CreateFlashcardInputDto[];
}
