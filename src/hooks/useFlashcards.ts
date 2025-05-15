import { useState, useCallback, useEffect } from 'react';
import type {
  FlashcardDto,
  FlashcardQueryParams,
  FlashcardsPaginatedResponseDto,
  CreateFlashcardInputDto,
  UpdateFlashcardCommand,
  PaginationMetaDto,
  FlashcardSource
} from '@/types';

export function useFlashcards() {
  // State
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMetaDto>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });
  const [filters, setFilters] = useState<FlashcardQueryParams>({
    page: 1,
    limit: 20
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardDto | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch flashcards
  const fetchFlashcards = useCallback(async (params: FlashcardQueryParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined) as [string, string][]
      ).toString();
      
      const response = await fetch(`/api/flashcards?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch flashcards');
      }
      
      const data: FlashcardsPaginatedResponseDto = await response.json();
      setFlashcards(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create flashcard
  const createFlashcard = async (data: CreateFlashcardInputDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcards: [data] })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create flashcard');
      }
      
      await fetchFlashcards(filters);
      setIsEditModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Update flashcard
  const updateFlashcard = async (id: number, data: UpdateFlashcardCommand) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update flashcard');
      }
      
      await fetchFlashcards(filters);
      setIsEditModalOpen(false);
      setSelectedFlashcard(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete flashcard
  const deleteFlashcard = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete flashcard');
      }
      
      await fetchFlashcards(filters);
      setIsDeleteDialogOpen(false);
      setSelectedFlashcard(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // UI handlers
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSortChange = (sort: string, order: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sort: sort as 'created_at' | 'updated_at' | 'id', order }));
  };

  const handleSourceFilterChange = (source?: FlashcardSource) => {
    setFilters(prev => ({ ...prev, source, page: 1 }));
  };

  const openCreateForm = () => {
    setSelectedFlashcard(undefined);
    setIsEditModalOpen(true);
  };

  const openEditForm = (id: number) => {
    const flashcard = flashcards.find(f => f.id === id);
    if (flashcard) {
      setSelectedFlashcard(flashcard);
      setIsEditModalOpen(true);
    }
  };

  const openDeleteDialog = (id: number) => {
    const flashcard = flashcards.find(f => f.id === id);
    if (flashcard) {
      setSelectedFlashcard(flashcard);
      setIsDeleteDialogOpen(true);
    }
  };

  // Fetch flashcards on mount and when filters change
  useEffect(() => {
    fetchFlashcards(filters);
  }, [filters, fetchFlashcards]);

  return {
    flashcards,
    pagination,
    filters,
    isLoading,
    error,
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
    setIsDeleteDialogOpen
  };
}
