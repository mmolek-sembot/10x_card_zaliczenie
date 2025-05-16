import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { FlashcardDto } from '@/types';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard: FlashcardDto | undefined;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  flashcard,
  onConfirm,
  isLoading,
}: DeleteConfirmDialogProps) {
  if (!flashcard) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is managed by the parent component
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń fiszkę</AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć tę fiszkę? Tej operacji nie można cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-4 rounded-md bg-muted p-4">
          <p className="font-medium">Przód:</p>
          <p className="mt-1 text-sm text-muted-foreground">{flashcard.front}</p>
          <p className="mt-3 font-medium">Tył:</p>
          <p className="mt-1 text-sm text-muted-foreground">{flashcard.back}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Usuwanie...' : 'Usuń'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
