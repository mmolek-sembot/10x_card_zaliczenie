import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditableTextarea } from './EditableTextarea';
import type { FlashcardProposalViewModel, FlashcardUpdateData } from './types';
import { Check, X, Edit } from 'lucide-react';

interface FlashcardPreviewProps {
  flashcard: FlashcardProposalViewModel;
  onUpdate: (data: FlashcardUpdateData) => void;
  onAccept: () => void;
  onReject: () => void;
}

export const FlashcardPreview: React.FC<FlashcardPreviewProps> = ({
  flashcard,
  onUpdate,
  onAccept,
  onReject,
}) => {
  const { front, back, status, errors } = flashcard;

  const isEditable = status === 'pending' || status === 'edited';
  const isRejected = status === 'rejected';
  const isAccepted = status === 'accepted';

  const getBorderColor = () => {
    if (isRejected) return 'border-red-300';
    if (isAccepted) return 'border-green-300';
    return 'border-gray-200';
  };

  const getStatusBadge = () => {
    if (isRejected)
      return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Odrzucona</span>;
    if (isAccepted)
      return (
        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Zaakceptowana</span>
      );
    if (status === 'edited')
      return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Edytowana</span>;
    return <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Oczekująca</span>;
  };

  const handleFrontUpdate = (newFront: string) => {
    onUpdate({ front: newFront });
  };

  const handleBackUpdate = (newBack: string) => {
    onUpdate({ back: newBack });
  };

  return (
    <Card className={`${getBorderColor()} transition-colors ${isRejected ? 'opacity-60' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Fiszka #{flashcard.id}</span>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4">
        <EditableTextarea
          label="Przód (pytanie)"
          value={front}
          onChange={handleFrontUpdate}
          maxLength={200}
          placeholder="Wprowadź treść przodu fiszki..."
          error={errors.front}
          rows={2}
        />

        <EditableTextarea
          label="Tył (odpowiedź)"
          value={back}
          onChange={handleBackUpdate}
          maxLength={600}
          placeholder="Wprowadź treść tyłu fiszki..."
          error={errors.back}
          rows={4}
        />
      </CardContent>

      {isEditable && (
        <CardFooter className="p-4 pt-2 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Odrzuć
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onAccept}
            className="text-green-500 hover:text-green-700 hover:bg-green-50"
          >
            <Check className="h-4 w-4 mr-1" />
            Akceptuj
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
