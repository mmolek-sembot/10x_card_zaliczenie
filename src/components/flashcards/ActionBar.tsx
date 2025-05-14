import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useFlashcards } from "@/hooks/useFlashcards";

export function ActionBar() {
  const { openCreateForm } = useFlashcards();

  return (
    <div className="flex items-center gap-2">
      <Button onClick={openCreateForm} className="gap-2">
        <PlusCircle className="h-4 w-4" />
        Create Flashcard
      </Button>
    </div>
  );
}
