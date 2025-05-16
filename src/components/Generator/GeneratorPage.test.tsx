import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GeneratorPage } from './GeneratorPage';
import { useGeneratorState } from './useGeneratorState';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the useGeneratorState hook
vi.mock('./useGeneratorState', () => ({
  useGeneratorState: vi.fn(),
}));

// Mock the child components
vi.mock('./GenerationForm', () => ({
  GenerationForm: ({ onGenerate, onSourceTextChange }: any) => (
    <div data-testid="generation-form">
      <button data-testid="generate-button" onClick={onGenerate}>
        Generate
      </button>
      <input data-testid="source-text-input" onChange={(e) => onSourceTextChange(e.target.value)} />
    </div>
  ),
}));

vi.mock('./GenerationResults', () => ({
  GenerationResults: ({
    onUpdateFlashcard,
    onAcceptFlashcard,
    onRejectFlashcard,
    onSaveAccepted,
    onReset,
  }: any) => (
    <div data-testid="generation-results">
      <button
        data-testid="update-flashcard"
        onClick={() => onUpdateFlashcard(1, { front: 'Updated' })}
      >
        Update
      </button>
      <button data-testid="accept-flashcard" onClick={() => onAcceptFlashcard(1)}>
        Accept
      </button>
      <button data-testid="reject-flashcard" onClick={() => onRejectFlashcard(1)}>
        Reject
      </button>
      <button data-testid="save-flashcards" onClick={onSaveAccepted}>
        Save
      </button>
      <button data-testid="reset-button" onClick={onReset}>
        Reset
      </button>
    </div>
  ),
}));

describe('GeneratorPage', () => {
  // Default mock implementation
  const mockGeneratorState = {
    state: 'input',
    sourceText: '',
    setSourceText: vi.fn(),
    flashcards: [],
    generationId: null,
    isGenerating: false,
    isSaving: false,
    error: null,
    isTextValid: false,
    generateFlashcards: vi.fn(),
    updateFlashcard: vi.fn(),
    acceptFlashcard: vi.fn(),
    rejectFlashcard: vi.fn(),
    saveAcceptedFlashcards: vi.fn(),
    reset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGeneratorState as any).mockReturnValue(mockGeneratorState);
  });

  it('should render in input state', () => {
    // Arrange & Act
    render(<GeneratorPage />);

    // Assert
    expect(screen.getByTestId('generation-form')).toBeInTheDocument();
    expect(screen.queryByTestId('generation-results')).not.toBeInTheDocument();
  });

  it('should render in generating state', () => {
    // Arrange
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      state: 'generating',
    });

    // Act
    render(<GeneratorPage />);

    // Assert
    expect(screen.getByTestId('generation-form')).toBeInTheDocument();
    expect(screen.queryByTestId('generation-results')).not.toBeInTheDocument();
  });

  it('should render in review state', () => {
    // Arrange
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      state: 'review',
      flashcards: [{ id: 1, front: 'Q', back: 'A', status: 'pending', errors: {} }],
    });

    // Act
    render(<GeneratorPage />);

    // Assert
    expect(screen.queryByTestId('generation-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('generation-results')).toBeInTheDocument();
  });

  it('should render in saving state', () => {
    // Arrange
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      state: 'saving',
      flashcards: [{ id: 1, front: 'Q', back: 'A', status: 'accepted', errors: {} }],
    });

    // Act
    render(<GeneratorPage />);

    // Assert
    expect(screen.queryByTestId('generation-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('generation-results')).toBeInTheDocument();
  });

  it('should render in complete state', () => {
    // Arrange
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      state: 'complete',
      flashcards: [{ id: 1, front: 'Q', back: 'A', status: 'accepted', errors: {} }],
    });

    // Act
    render(<GeneratorPage />);

    // Assert
    expect(screen.queryByTestId('generation-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('generation-results')).toBeInTheDocument();
  });

  it('should display error alert when error exists', () => {
    // Arrange
    const errorMessage = 'Test error message';
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      error: errorMessage,
    });

    // Act
    render(<GeneratorPage />);

    // Assert
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should call generateFlashcards when generate button is clicked', async () => {
    // Arrange
    const mockGenerate = vi.fn();
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      generateFlashcards: mockGenerate,
    });

    // Act
    render(<GeneratorPage />);
    fireEvent.click(screen.getByTestId('generate-button'));

    // Assert
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('should call setSourceText when source text input changes', () => {
    // Arrange
    const mockSetSourceText = vi.fn();
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      setSourceText: mockSetSourceText,
    });

    // Act
    render(<GeneratorPage />);
    fireEvent.change(screen.getByTestId('source-text-input'), { target: { value: 'New text' } });

    // Assert
    expect(mockSetSourceText).toHaveBeenCalledWith('New text');
  });

  it('should call updateFlashcard when update button is clicked', () => {
    // Arrange
    const mockUpdateFlashcard = vi.fn();
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      state: 'review',
      flashcards: [{ id: 1, front: 'Q', back: 'A', status: 'pending', errors: {} }],
      updateFlashcard: mockUpdateFlashcard,
    });

    // Act
    render(<GeneratorPage />);
    fireEvent.click(screen.getByTestId('update-flashcard'));

    // Assert
    expect(mockUpdateFlashcard).toHaveBeenCalledWith(1, { front: 'Updated' });
  });

  it('should call acceptFlashcard when accept button is clicked', () => {
    // Arrange
    const mockAcceptFlashcard = vi.fn();
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      state: 'review',
      flashcards: [{ id: 1, front: 'Q', back: 'A', status: 'pending', errors: {} }],
      acceptFlashcard: mockAcceptFlashcard,
    });

    // Act
    render(<GeneratorPage />);
    fireEvent.click(screen.getByTestId('accept-flashcard'));

    // Assert
    expect(mockAcceptFlashcard).toHaveBeenCalledWith(1);
  });

  it('should call rejectFlashcard when reject button is clicked', () => {
    // Arrange
    const mockRejectFlashcard = vi.fn();
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      state: 'review',
      flashcards: [{ id: 1, front: 'Q', back: 'A', status: 'pending', errors: {} }],
      rejectFlashcard: mockRejectFlashcard,
    });

    // Act
    render(<GeneratorPage />);
    fireEvent.click(screen.getByTestId('reject-flashcard'));

    // Assert
    expect(mockRejectFlashcard).toHaveBeenCalledWith(1);
  });

  it('should call saveAcceptedFlashcards when save button is clicked', async () => {
    // Arrange
    const mockSaveAcceptedFlashcards = vi.fn();
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      state: 'review',
      flashcards: [{ id: 1, front: 'Q', back: 'A', status: 'accepted', errors: {} }],
      saveAcceptedFlashcards: mockSaveAcceptedFlashcards,
    });

    // Act
    render(<GeneratorPage />);
    fireEvent.click(screen.getByTestId('save-flashcards'));

    // Assert
    expect(mockSaveAcceptedFlashcards).toHaveBeenCalledTimes(1);
  });

  it('should call reset when reset button is clicked', () => {
    // Arrange
    const mockReset = vi.fn();
    (useGeneratorState as any).mockReturnValue({
      ...mockGeneratorState,
      state: 'complete',
      reset: mockReset,
    });

    // Act
    render(<GeneratorPage />);
    fireEvent.click(screen.getByTestId('reset-button'));

    // Assert
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
