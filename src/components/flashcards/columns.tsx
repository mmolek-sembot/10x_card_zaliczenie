import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { type FlashcardDto } from "@/types";
import { useFlashcards } from "@/hooks/useFlashcards";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<FlashcardDto>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="w-[60px]">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "front",
    header: "Front",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">{row.getValue("front")}</div>
    ),
  },
  {
    accessorKey: "back",
    header: "Back",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">{row.getValue("back")}</div>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.getValue("source") as string;
      const variant = source === 'manual' ? 'default' : 
                     source === 'ai-full' ? 'secondary' : 
                     'outline';
      const label = source === 'manual' ? 'Manual' :
                   source === 'ai-full' ? 'AI Generated' :
                   'AI Edited';
      
      return (
        <Badge variant={variant} className="capitalize">
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const flashcard = row.original;
      const { openEditForm, openDeleteDialog } = useFlashcards();

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditForm(flashcard.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openDeleteDialog(flashcard.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
