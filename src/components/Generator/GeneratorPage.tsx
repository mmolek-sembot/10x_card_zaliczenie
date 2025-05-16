import React from 'react';
import { useGeneratorState } from './useGeneratorState';
import { GenerationForm } from './GenerationForm';
import { GenerationResults } from './GenerationResults';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const GeneratorPage: React.FC = () => {
  const generatorState = useGeneratorState();
  const {
    state,
    sourceText,
    setSourceText,
    flashcards,
    generationId,
    isGenerating,
    isSaving,
    error,
    isTextValid,
    generateFlashcards,
    updateFlashcard,
    acceptFlashcard,
    rejectFlashcard,
    saveAcceptedFlashcards,
    reset,
  } = generatorState;

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-8 p-6">
        {(state === 'input' || state === 'generating') && (
          <GenerationForm
            sourceText={sourceText}
            onSourceTextChange={setSourceText}
            isGenerating={isGenerating}
            isValid={isTextValid}
            onGenerate={generateFlashcards}
          />
        )}

        {(state === 'review' || state === 'saving' || state === 'complete') && (
          <GenerationResults
            generationId={generationId}
            flashcards={flashcards}
            onUpdateFlashcard={updateFlashcard}
            onAcceptFlashcard={acceptFlashcard}
            onRejectFlashcard={rejectFlashcard}
            onSaveAccepted={saveAcceptedFlashcards}
            isLoading={isSaving}
            isComplete={state === 'complete'}
            onReset={reset}
          />
        )}
      </Card>
    </div>
  );
};
