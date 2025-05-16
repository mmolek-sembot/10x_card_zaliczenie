import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { type FlashcardDto } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ColumnsProps {
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const getColumns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<FlashcardDto>[] => [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <div className="w-[60px]">{row.getValue('id')}</div>,
  },
  {
    accessorKey: 'front',
    header: 'Przód',
    cell: ({ row }) => <div className="max-w-[300px] truncate">{row.getValue('front')}</div>,
  },
  {
    accessorKey: 'back',
    header: 'Tył',
    cell: ({ row }) => <div className="max-w-[300px] truncate">{row.getValue('back')}</div>,
  },
  {
    accessorKey: 'source',
    header: 'Źródło',
    cell: ({ row }) => {
      const source = row.getValue('source') as string;
      const variant =
        source === 'manual' ? 'default' : source === 'ai-full' ? 'secondary' : 'outline';
      const label =
        source === 'manual'
          ? 'Ręcznie utworzone'
          : source === 'ai-full'
            ? 'AI'
            : 'AI - edytowane';

      return (
        <Badge variant={variant} className="capitalize">
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Utworzone',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const flashcard = row.original;

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(flashcard.id);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(flashcard.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
