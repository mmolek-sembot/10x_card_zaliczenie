import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GenerationResults } from './GenerationResults';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { FlashcardProposalViewModel } from './types';

// Mock the child components
vi.mock('./FlashcardsList', () => ({
  FlashcardsList: ({
    flashcards,
    onUpdateFlashcard,
    onAcceptFlashcard,
    onRejectFlashcard,
  }: any) => (
    <div data-testid="flashcards-list">
      <span data-testid="flashcards-count">{flashcards.length}</span>
      <button
        data-testid="update-flashcard-btn"
        onClick={() => onUpdateFlashcard(1, { front: 'Updated front', back: 'Updated back' })}
      >
        Update
      </button>
      <button data-testid="accept-flashcard-btn" onClick={() => onAcceptFlashcard(1)}>
        Accept
      </button>
      <button data-testid="reject-flashcard-btn" onClick={() => onRejectFlashcard(1)}>
        Reject
      </button>
    </div>
  ),
}));

vi.mock('./FlashcardsSummary', () => ({
  FlashcardsSummary: ({
    totalCount,
    acceptedCount,
    rejectedCount,
    onSave,
    onReset,
    isLoading,
    isComplete,
  }: any) => (
    <div data-testid="flashcards-summary">
      <span data-testid="total-count">{totalCount}</span>
      <span data-testid="accepted-count">{acceptedCount}</span>
      <span data-testid="rejected-count">{rejectedCount}</span>
      <button data-testid="save-btn" onClick={onSave} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save'}
      </button>
      <button data-testid="reset-btn" onClick={onReset}>
        Reset
      </button>
      {isComplete && <span data-testid="complete-indicator">Complete</span>}
    </div>
  ),
}));

describe('GenerationResults', () => {
  // Sample flashcards for testing
  const sampleFlashcards: FlashcardProposalViewModel[] = [
    {
      id: 1,
      front: 'Question 1',
      back: 'Answer 1',
      source: 'ai-full',
      status: 'pending',
      errors: {},
    },
    {
      id: 2,
      front: 'Question 2',
      back: 'Answer 2',
      source: 'ai-full',
      status: 'accepted',
      errors: {},
    },
    {
      id: 3,
      front: 'Question 3',
      back: 'Answer 3',
      source: 'ai-full',
      status: 'rejected',
      errors: {},
    },
  ];

  // Default props
  const defaultProps = {
    generationId: 123,
    flashcards: sampleFlashcards,
    onUpdateFlashcard: vi.fn(),
    onAcceptFlashcard: vi.fn(),
    onRejectFlashcard: vi.fn(),
    onSaveAccepted: vi.fn(),
    onReset: vi.fn(),
    isLoading: false,
    isComplete: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly in review mode', () => {
    // Arrange & Act
    render(<GenerationResults {...defaultProps} />);

    // Assert
    expect(screen.getByText('Wygenerowane propozycje fiszek')).toBeInTheDocument();
    expect(screen.getByTestId('flashcards-list')).toBeInTheDocument();
    expect(screen.getByTestId('flashcards-summary')).toBeInTheDocument();
  });

  it('should render success message when complete', () => {
    // Arrange & Act
    render(<GenerationResults {...defaultProps} isComplete={true} />);

    // Assert
    expect(screen.getByText('Zapisano pomyślnie!')).toBeInTheDocument();
    expect(screen.queryByTestId('flashcards-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('complete-indicator')).toBeInTheDocument();
  });

  it('should pass correct counts to FlashcardsSummary', () => {
    // Arrange & Act
    render(<GenerationResults {...defaultProps} />);

    // Assert
    expect(screen.getByTestId('total-count').textContent).toBe('3');
    expect(screen.getByTestId('accepted-count').textContent).toBe('1');
    expect(screen.getByTestId('rejected-count').textContent).toBe('1');
  });

  it('should call onUpdateFlashcard when update button is clicked', () => {
    // Arrange
    const mockUpdateFlashcard = vi.fn();
    render(<GenerationResults {...defaultProps} onUpdateFlashcard={mockUpdateFlashcard} />);

    // Act
    fireEvent.click(screen.getByTestId('update-flashcard-btn'));

    // Assert
    expect(mockUpdateFlashcard).toHaveBeenCalledWith(1, {
      front: 'Updated front',
      back: 'Updated back',
    });
  });

  it('should call onAcceptFlashcard when accept button is clicked', () => {
    // Arrange
    const mockAcceptFlashcard = vi.fn();
    render(<GenerationResults {...defaultProps} onAcceptFlashcard={mockAcceptFlashcard} />);

    // Act
    fireEvent.click(screen.getByTestId('accept-flashcard-btn'));

    // Assert
    expect(mockAcceptFlashcard).toHaveBeenCalledWith(1);
  });

  it('should call onRejectFlashcard when reject button is clicked', () => {
    // Arrange
    const mockRejectFlashcard = vi.fn();
    render(<GenerationResults {...defaultProps} onRejectFlashcard={mockRejectFlashcard} />);

    // Act
    fireEvent.click(screen.getByTestId('reject-flashcard-btn'));

    // Assert
    expect(mockRejectFlashcard).toHaveBeenCalledWith(1);
  });

  it('should call onSaveAccepted when save button is clicked', () => {
    // Arrange
    const mockSaveAccepted = vi.fn();
    render(<GenerationResults {...defaultProps} onSaveAccepted={mockSaveAccepted} />);

    // Act
    fireEvent.click(screen.getByTestId('save-btn'));

    // Assert
    expect(mockSaveAccepted).toHaveBeenCalledTimes(1);
  });

  it('should call onReset when reset button is clicked', () => {
    // Arrange
    const mockReset = vi.fn();
    render(<GenerationResults {...defaultProps} onReset={mockReset} />);

    // Act
    fireEvent.click(screen.getByTestId('reset-btn'));

    // Assert
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('should disable save button when isLoading is true', () => {
    // Arrange & Act
    render(<GenerationResults {...defaultProps} isLoading={true} />);

    // Assert
    expect(screen.getByTestId('save-btn')).toBeDisabled();
  });

  it('should count edited flashcards as accepted', () => {
    // Arrange
    const flashcardsWithEdited = [
      ...sampleFlashcards,
      {
        id: 4,
        front: 'Question 4',
        back: 'Answer 4',
        source: 'ai-edited',
        status: 'edited',
        errors: {},
      },
    ];

    // Act
    render(<GenerationResults {...defaultProps} flashcards={flashcardsWithEdited} />);

    // Assert
    expect(screen.getByTestId('accepted-count').textContent).toBe('2'); // 1 accepted + 1 edited
  });

  it('should handle empty flashcards array', () => {
    // Arrange & Act
    render(<GenerationResults {...defaultProps} flashcards={[]} />);

    // Assert
    expect(screen.getByTestId('total-count').textContent).toBe('0');
    expect(screen.getByTestId('accepted-count').textContent).toBe('0');
    expect(screen.getByTestId('rejected-count').textContent).toBe('0');
  });
});
