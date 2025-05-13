import { useState, useMemo } from "react";
import type { 
  GenerationState, 
  FlashcardProposalViewModel, 
  FlashcardUpdateData, 
  FlashcardStatus,
  SaveFlashcardsPayload
} from "./types";
import type { FlashcardSource } from "../../types";
import { showError, showLoading, showSuccess } from "../../lib/toast";

export const useGeneratorState = () => {
  const [state, setState] = useState<GenerationState>('input');
  const [sourceText, setSourceText] = useState<string>('');
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardProposalViewModel[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Walidacja tekstu źródłowego
  const isTextValid = useMemo(() => {
    return sourceText.length >= 1000 && sourceText.length <= 10000;
  }, [sourceText]);

  // Generowanie fiszek
  const generateFlashcards = async () => {
    if (!isTextValid) return;
    
    setIsGenerating(true);
    setState('generating');
    setError(null);
    
    try {
      // Wywołanie API z użyciem toast.promise
      const promise = fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_text: sourceText })
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Błąd generowania fiszek');
        }
        return response.json();
      });
      
      const result = await promise;
      showLoading("Generowanie fiszek", promise, {
        success: "Fiszki zostały wygenerowane",
        error: "Nie udało się wygenerować fiszek"
      });
      
      setGenerationId(result.generation_id);
      
      // Przekształcenie propozycji na model widoku
      const viewModels = result.flashcards_proposal.map((card: any, index: number) => ({
        id: index + 1,
        front: card.front,
        back: card.back,
        source: card.source,
        status: 'pending' as FlashcardStatus,
        errors: {}
      }));
      
      setFlashcards(viewModels);
      setState('review');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Nieznany błąd');
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
      setState('input');
    } finally {
      setIsGenerating(false);
    }
  };

  // Aktualizacja stanu fiszki
  const updateFlashcard = (id: number, data: FlashcardUpdateData) => {
    setFlashcards(currentCards => 
      currentCards.map(card => 
        card.id === id 
          ? { 
              ...card, 
              ...data, 
              status: card.status === 'pending' ? 'edited' : card.status,
              source: 'ai-edited' as FlashcardSource,
              errors: validateFlashcard(data.front || card.front, data.back || card.back)
            } 
          : card
      )
    );
  };

  // Walidacja pojedynczej fiszki
  const validateFlashcard = (front: string, back: string) => {
    const errors: {front?: string, back?: string} = {};
    
    if (!front.trim()) errors.front = 'Treść przodu jest wymagana';
    else if (front.length > 200) errors.front = 'Treść przodu nie może przekraczać 200 znaków';
    
    if (!back.trim()) errors.back = 'Treść tyłu jest wymagana';
    else if (back.length > 600) errors.back = 'Treść tyłu nie może przekraczać 600 znaków';
    
    return errors;
  };

  // Akceptacja fiszki
  const acceptFlashcard = (id: number) => {
    setFlashcards(currentCards => 
      currentCards.map(card => 
        card.id === id ? { ...card, status: 'accepted' } : card
      )
    );
  };

  // Odrzucenie fiszki
  const rejectFlashcard = (id: number) => {
    setFlashcards(currentCards => 
      currentCards.map(card => 
        card.id === id ? { ...card, status: 'rejected' } : card
      )
    );
  };

  // Zapisanie zaakceptowanych fiszek
  const saveAcceptedFlashcards = async () => {
    const acceptedCards = flashcards.filter(card => card.status === 'accepted' || card.status === 'edited');
    
    if (acceptedCards.length === 0) {
      showError('Brak fiszek do zapisania');
      setError('Brak fiszek do zapisania');
      return;
    }
    
    // Walidacja wszystkich fiszek przed zapisem
    const hasErrors = acceptedCards.some(card => Object.keys(card.errors).length > 0);
    if (hasErrors) {
      showError('Nie można zapisać fiszek z błędami');
      setError('Nie można zapisać fiszek z błędami');
      return;
    }
    
    setIsSaving(true);
    setState('saving');
    setError(null);
    
    try {
      // Przygotowanie danych do zapisu
      const payload: SaveFlashcardsPayload = {
        flashcards: acceptedCards.map(card => ({
          front: card.front,
          back: card.back,
          source: card.status === 'edited' ? 'ai-edited' : 'ai-full',
          generation_id: generationId
        }))
      };
      
      // Wywołanie API z użyciem toast.promise
      const promise = fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Błąd zapisywania fiszek');
        }
        return response.json();
      });
      
      await promise;
      showLoading("Zapisywanie fiszek", promise, {
        success: `Zapisano ${acceptedCards.length} fiszek pomyślnie`,
        error: "Nie udało się zapisać fiszek"
      });
      
      setState('complete');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Nieznany błąd');
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
      setState('review');
    } finally {
      setIsSaving(false);
    }
  };

  // Resetowanie stanu
  const reset = () => {
    setState('input');
    setSourceText('');
    setGenerationId(null);
    setFlashcards([]);
    setError(null);
  };

  return {
    state,
    sourceText,
    setSourceText,
    generationId,
    flashcards,
    isGenerating,
    isSaving,
    error,
    isTextValid,
    generateFlashcards,
    updateFlashcard,
    acceptFlashcard,
    rejectFlashcard,
    saveAcceptedFlashcards,
    reset
  };
}; 