import { useFlashcards } from '@/hooks/useFlashcards';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns.tsx';
import { FilterBar } from './FilterBar.tsx';
import { ActionBar } from './ActionBar.tsx';
import { PaginationControl } from '@/components/ui/pagination-control';
import { EditFlashcardModal } from './EditFlashcardModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { CreateFlashcardInputDto, UpdateFlashcardCommand } from '@/types';

export function FlashcardsList() {
  const {
    flashcards,
    pagination,
    isLoading,
    error,
    filters,
    selectedFlashcard,
    isEditModalOpen,
    isDeleteDialogOpen,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    handleSourceFilterChange,
    openCreateForm,
    openEditForm,
    openDeleteDialog,
    setIsEditModalOpen,
    setIsDeleteDialogOpen,
  } = useFlashcards();

  const columns = getColumns({
    onEdit: openEditForm,
    onDelete: openDeleteDialog,
  });

  const handleCreateOrUpdate = async (data: CreateFlashcardInputDto) => {
    if (selectedFlashcard) {
      await updateFlashcard(selectedFlashcard.id, data as UpdateFlashcardCommand);
    } else {
      await createFlashcard({ ...data, source: 'manual', generation_id: null });
    }
  };

  const handleDelete = async () => {
    if (selectedFlashcard) {
      await deleteFlashcard(selectedFlashcard.id);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading flashcards: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <FilterBar
          source={filters.source}
          onSourceChange={handleSourceFilterChange}
          onSortChange={handleSortChange}
        />
        <ActionBar openCreateForm={openCreateForm} />
      </div>

      {isLoading && !flashcards.length ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable columns={columns} data={flashcards} />
      )}

      {flashcards.length > 0 && (
        <div className="flex justify-end">
          <PaginationControl
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
            pageSize={pagination.limit}
            onPageSizeChange={handleLimitChange}
          />
        </div>
      )}

      <EditFlashcardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        flashcard={selectedFlashcard}
        onSubmit={handleCreateOrUpdate}
        isLoading={isLoading}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        flashcard={selectedFlashcard}
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
