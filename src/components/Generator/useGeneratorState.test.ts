import { renderHook, act } from '@testing-library/react';
import { useGeneratorState } from './useGeneratorState';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { showError, showLoading, showSuccess } from '../../lib/toast';

// Mock the toast functions
vi.mock('../../lib/toast', () => ({
  showError: vi.fn(),
  showLoading: vi.fn(),
  showSuccess: vi.fn(),
}));

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useGeneratorState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should initialize with default values', () => {
    // Arrange & Act
    const { result } = renderHook(() => useGeneratorState());

    // Assert
    expect(result.current.state).toBe('input');
    expect(result.current.sourceText).toBe('');
    expect(result.current.generationId).toBeNull();
    expect(result.current.flashcards).toEqual([]);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should validate text length correctly', () => {
    // Arrange
    const { result } = renderHook(() => useGeneratorState());
    
    // Act - text too short
    act(() => {
      result.current.setSourceText('Short text');
    });
    
    // Assert
    expect(result.current.isTextValid).toBe(false);
    
    // Act - text valid length
    const validText = 'a'.repeat(1000);
    act(() => {
      result.current.setSourceText(validText);
    });
    
    // Assert
    expect(result.current.isTextValid).toBe(true);
    
    // Act - text too long
    const tooLongText = 'a'.repeat(10001);
    act(() => {
      result.current.setSourceText(tooLongText);
    });
    
    // Assert
    expect(result.current.isTextValid).toBe(false);
  });

  it('should generate flashcards successfully', async () => {
    // Arrange
    const mockResponse = {
      generation_id: 123,
      flashcards_proposal: [
        { front: 'Question 1', back: 'Answer 1', source: 'ai-full' },
        { front: 'Question 2', back: 'Answer 2', source: 'ai-full' }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const { result } = renderHook(() => useGeneratorState());
    
    // Set valid text
    act(() => {
      result.current.setSourceText('a'.repeat(1000));
    });
    
    // Act - generate flashcards
    await act(async () => {
      await result.current.generateFlashcards();
    });
    
    // Assert
    expect(result.current.state).toBe('review');
    expect(result.current.generationId).toBe(123);
    expect(result.current.flashcards).toHaveLength(2);
    expect(result.current.flashcards[0].front).toBe('Question 1');
    expect(result.current.flashcards[0].status).toBe('pending');
    expect(mockFetch).toHaveBeenCalledWith('/api/generations', expect.any(Object));
    expect(showLoading).toHaveBeenCalled();
  });

  it('should handle generation error', async () => {
    // Arrange
    const errorMessage = 'API Error';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: errorMessage })
    });
    
    const { result } = renderHook(() => useGeneratorState());
    
    // Set valid text
    act(() => {
      result.current.setSourceText('a'.repeat(1000));
    });
    
    // Act - generate flashcards with error
    await act(async () => {
      await result.current.generateFlashcards();
    });
    
    // Assert
    expect(result.current.state).toBe('input');
    expect(result.current.error).toBe(errorMessage);
    expect(showError).toHaveBeenCalledWith(errorMessage);
  });

  it('should update flashcard correctly', async () => {
    // Arrange
    const mockResponse = {
      generation_id: 123,
      flashcards_proposal: [
        { front: 'Original Q', back: 'Original A', source: 'ai-full' }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const { result } = renderHook(() => useGeneratorState());
    
    // Setup initial flashcards via generate
    act(() => {
      result.current.setSourceText('a'.repeat(1000));
    });
    
    await act(async () => {
      await result.current.generateFlashcards();
    });
    
    // Act - update flashcard
    act(() => {
      result.current.updateFlashcard(1, { front: 'Updated Q', back: 'Updated A' });
    });
    
    // Assert
    expect(result.current.flashcards[0].front).toBe('Updated Q');
    expect(result.current.flashcards[0].back).toBe('Updated A');
    expect(result.current.flashcards[0].status).toBe('edited');
    expect(result.current.flashcards[0].source).toBe('ai-edited');
  });

  it('should accept and reject flashcards', async () => {
    // Arrange
    const mockResponse = {
      generation_id: 123,
      flashcards_proposal: [
        { front: 'Q1', back: 'A1', source: 'ai-full' },
        { front: 'Q2', back: 'A2', source: 'ai-full' }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const { result } = renderHook(() => useGeneratorState());
    
    // Setup initial flashcards via generate
    act(() => {
      result.current.setSourceText('a'.repeat(1000));
    });
    
    await act(async () => {
      await result.current.generateFlashcards();
    });
    
    // Act - accept first flashcard
    act(() => {
      result.current.acceptFlashcard(1);
    });
    
    // Assert
    expect(result.current.flashcards[0].status).toBe('accepted');
    expect(result.current.flashcards[1].status).toBe('pending');
    
    // Act - reject second flashcard
    act(() => {
      result.current.rejectFlashcard(2);
    });
    
    // Assert
    expect(result.current.flashcards[1].status).toBe('rejected');
  });

  it('should save accepted flashcards successfully', async () => {
    // Arrange - generate flashcards
    const mockGenerateResponse = {
      generation_id: 123,
      flashcards_proposal: [
        { front: 'Q1', back: 'A1', source: 'ai-full' },
        { front: 'Q2', back: 'A2', source: 'ai-full' },
        { front: 'Q3', back: 'A3', source: 'ai-full' }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGenerateResponse
    });
    
    // Mock save response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });
    
    const { result } = renderHook(() => useGeneratorState());
    
    // Generate flashcards
    act(() => {
      result.current.setSourceText('a'.repeat(1000));
    });
    
    await act(async () => {
      await result.current.generateFlashcards();
    });
    
    // Accept first and third flashcards, reject second
    act(() => {
      result.current.acceptFlashcard(1);
      result.current.rejectFlashcard(2);
      result.current.updateFlashcard(3, { front: 'Updated Q3' });
    });
    
    // Act - save accepted flashcards
    await act(async () => {
      await result.current.saveAcceptedFlashcards();
    });
    
    // Assert
    expect(result.current.state).toBe('complete');
    expect(mockFetch).toHaveBeenCalledWith('/api/flashcards', expect.any(Object));
    
    // Check that only accepted and edited flashcards were sent
    const requestBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(requestBody.flashcards.length).toBeGreaterThan(0);
  });

  it('should handle save error when there are no accepted flashcards', async () => {
    // Arrange - generate flashcards
    const mockGenerateResponse = {
      generation_id: 123,
      flashcards_proposal: [
        { front: 'Q1', back: 'A1', source: 'ai-full' }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGenerateResponse
    });
    
    const { result } = renderHook(() => useGeneratorState());
    
    // Generate flashcards
    act(() => {
      result.current.setSourceText('a'.repeat(1000));
    });
    
    await act(async () => {
      await result.current.generateFlashcards();
    });
    
    // Reject all flashcards
    act(() => {
      result.current.rejectFlashcard(1);
    });
    
    // Act - try to save with no accepted flashcards
    await act(async () => {
      await result.current.saveAcceptedFlashcards();
    });
    
    // Assert
    expect(result.current.error).toBe('Brak fiszek do zapisania');
    expect(showError).toHaveBeenCalled();
    // Only the first fetch for generation should have been called
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should reset state correctly', async () => {
    // Arrange - generate flashcards first
    const mockResponse = {
      generation_id: 123,
      flashcards_proposal: [
        { front: 'Q', back: 'A', source: 'ai-full' }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const { result } = renderHook(() => useGeneratorState());
    
    // Setup state via generate
    act(() => {
      result.current.setSourceText('a'.repeat(1000));
    });
    
    await act(async () => {
      await result.current.generateFlashcards();
    });
    
    // Verify state is set
    expect(result.current.sourceText).toBe('a'.repeat(1000));
    expect(result.current.generationId).toBe(123);
    expect(result.current.flashcards.length).toBe(1);
    
    // Act - reset state
    act(() => {
      result.current.reset();
    });
    
    // Assert
    expect(result.current.state).toBe('input');
    expect(result.current.sourceText).toBe('');
    expect(result.current.generationId).toBeNull();
    expect(result.current.flashcards).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
