import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { FlashcardDto } from "@/types";

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
          <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this flashcard? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-4 rounded-md bg-muted p-4">
          <p className="font-medium">Front:</p>
          <p className="mt-1 text-sm text-muted-foreground">{flashcard.front}</p>
          <p className="mt-3 font-medium">Back:</p>
          <p className="mt-1 text-sm text-muted-foreground">{flashcard.back}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
