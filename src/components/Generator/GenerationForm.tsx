import React from 'react';
import { TextInput } from './TextInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface GenerationFormProps {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  isGenerating: boolean;
  isValid: boolean;
  onGenerate: () => Promise<void>;
}

export const GenerationForm: React.FC<GenerationFormProps> = ({
  sourceText,
  onSourceTextChange,
  isGenerating,
  isValid,
  onGenerate,
}) => {
  return (
    <div className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl">Wprowadź tekst do przetworzenia</CardTitle>
        <p className="text-gray-500 mt-2">
          Wprowadź tekst źródłowy, na podstawie którego AI wygeneruje propozycje fiszek
          edukacyjnych. Tekst powinien mieć od 1000 do 10000 znaków.
        </p>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <TextInput
          value={sourceText}
          onChange={onSourceTextChange}
          minLength={1000}
          maxLength={10000}
          placeholder="Wprowadź lub wklej tekst, na podstawie którego zostaną wygenerowane fiszki edukacyjne..."
          disabled={isGenerating}
          error={
            sourceText.length > 0 && !isValid
              ? 'Tekst musi mieć od 1000 do 10000 znaków'
              : undefined
          }
        />
      </CardContent>

      <CardFooter className="px-0 pt-4 flex justify-end">
        <Button onClick={onGenerate} disabled={!isValid || isGenerating} className="min-w-[150px]">
          {isGenerating ? 'Generowanie...' : 'Generuj fiszki'}
        </Button>
      </CardFooter>
    </div>
  );
};
