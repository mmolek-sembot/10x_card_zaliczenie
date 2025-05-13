import React from "react";
import { FlashcardPreview } from "./FlashcardPreview";
import type { FlashcardProposalViewModel, FlashcardUpdateData } from "./types";

interface FlashcardsListProps {
  flashcards: FlashcardProposalViewModel[];
  onUpdateFlashcard: (id: number, data: FlashcardUpdateData) => void;
  onAcceptFlashcard: (id: number) => void;
  onRejectFlashcard: (id: number) => void;
}

export const FlashcardsList: React.FC<FlashcardsListProps> = ({
  flashcards,
  onUpdateFlashcard,
  onAcceptFlashcard,
  onRejectFlashcard
}) => {
  if (flashcards.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        Brak fiszek do wyświetlenia
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {flashcards.map(flashcard => (
        <FlashcardPreview
          key={flashcard.id}
          flashcard={flashcard}
          onUpdate={(data) => onUpdateFlashcard(flashcard.id, data)}
          onAccept={() => onAcceptFlashcard(flashcard.id)}
          onReject={() => onRejectFlashcard(flashcard.id)}
        />
      ))}
    </div>
  );
}; 