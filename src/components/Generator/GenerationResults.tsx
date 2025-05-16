import React, { useMemo } from 'react';
import { FlashcardsList } from './FlashcardsList';
import { FlashcardsSummary } from './FlashcardsSummary';
import type { FlashcardProposalViewModel, FlashcardUpdateData } from './types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface GenerationResultsProps {
  generationId: number | null;
  flashcards: FlashcardProposalViewModel[];
  onUpdateFlashcard: (id: number, data: FlashcardUpdateData) => void;
  onAcceptFlashcard: (id: number) => void;
  onRejectFlashcard: (id: number) => void;
  onSaveAccepted: () => Promise<void>;
  onReset: () => void;
  isLoading: boolean;
  isComplete: boolean;
}

export const GenerationResults: React.FC<GenerationResultsProps> = ({
  generationId,
  flashcards,
  onUpdateFlashcard,
  onAcceptFlashcard,
  onRejectFlashcard,
  onSaveAccepted,
  onReset,
  isLoading,
  isComplete,
}) => {
  const { totalCount, acceptedCount, rejectedCount } = useMemo(() => {
    return {
      totalCount: flashcards.length,
      acceptedCount: flashcards.filter((f) => f.status === 'accepted' || f.status === 'edited')
        .length,
      rejectedCount: flashcards.filter((f) => f.status === 'rejected').length,
    };
  }, [flashcards]);

  return (
    <div className="space-y-8">
      {isComplete ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Zapisano pomyślnie!</AlertTitle>
          <AlertDescription className="text-green-700">
            Twoje fiszki zostały zapisane. Możesz je znaleźć w swojej bibliotece fiszek.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Wygenerowane propozycje fiszek</h3>
          <p className="text-gray-500">
            Przejrzyj wygenerowane propozycje. Możesz edytować ich treść, akceptować lub odrzucać
            poszczególne fiszki. Tylko zaakceptowane fiszki zostaną zapisane.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <div className="order-2 md:order-1">
          {!isComplete && (
            <FlashcardsList
              flashcards={flashcards}
              onUpdateFlashcard={onUpdateFlashcard}
              onAcceptFlashcard={onAcceptFlashcard}
              onRejectFlashcard={onRejectFlashcard}
            />
          )}
        </div>

        <div className="order-1 md:order-2">
          <div className="sticky top-4">
            <FlashcardsSummary
              totalCount={totalCount}
              acceptedCount={acceptedCount}
              rejectedCount={rejectedCount}
              onSave={onSaveAccepted}
              onReset={onReset}
              isLoading={isLoading}
              isComplete={isComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
