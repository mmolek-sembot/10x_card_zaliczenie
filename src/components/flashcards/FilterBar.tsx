import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FlashcardSource } from '@/types';

interface FilterBarProps {
  source?: FlashcardSource;
  onSourceChange: (source?: FlashcardSource) => void;
  onSortChange: (sort: string, order: 'asc' | 'desc') => void;
}

export function FilterBar({ source, onSourceChange, onSortChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-4">
      {/* <Input
        placeholder="Search flashcards..."
        className="max-w-sm"
        type="search"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          // TODO: Implement search functionality
          console.log('Search:', e.target.value);
        }}
      /> */}

      <Select
        value={source || 'all'}
        onValueChange={(value: string) =>
          onSourceChange(value === 'all' ? undefined : (value as FlashcardSource))
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          <SelectItem value="ai-full">AI Generated</SelectItem>
          <SelectItem value="ai-edited">AI Edited</SelectItem>
          <SelectItem value="manual">Manual</SelectItem>
        </SelectContent>
      </Select>

      <Select
        onValueChange={(value: string) => {
          const [sort, order] = value.split('-');
          onSortChange(sort, order as 'asc' | 'desc');
        }}
        defaultValue="created_at-desc"
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at-desc">Newest first</SelectItem>
          <SelectItem value="created_at-asc">Oldest first</SelectItem>
          <SelectItem value="updated_at-desc">Last updated</SelectItem>
          <SelectItem value="id-asc">ID ascending</SelectItem>
          <SelectItem value="id-desc">ID descending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
