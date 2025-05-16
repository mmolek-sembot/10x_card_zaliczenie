import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GenerationForm } from './GenerationForm';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the TextInput component
vi.mock('./TextInput', () => ({
  TextInput: ({ value, onChange, disabled, error }: any) => (
    <div data-testid="text-input">
      <textarea
        data-testid="source-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {error && <div data-testid="input-error">{error}</div>}
    </div>
  ),
}));

describe('GenerationForm', () => {
  // Default props
  const defaultProps = {
    sourceText: '',
    onSourceTextChange: vi.fn(),
    isGenerating: false,
    isValid: false,
    onGenerate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    // Arrange & Act
    render(<GenerationForm {...defaultProps} />);

    // Assert
    expect(screen.getByText('Wprowadź tekst do przetworzenia')).toBeInTheDocument();
    expect(screen.getByTestId('text-input')).toBeInTheDocument();
    expect(screen.getByText('Generuj fiszki')).toBeInTheDocument();
  });

  it('should pass sourceText to TextInput', () => {
    // Arrange
    const sourceText = 'Sample text for testing';

    // Act
    render(<GenerationForm {...defaultProps} sourceText={sourceText} />);

    // Assert
    expect(screen.getByTestId('source-textarea')).toHaveValue(sourceText);
  });

  it('should call onSourceTextChange when text changes', () => {
    // Arrange
    const mockOnChange = vi.fn();
    render(<GenerationForm {...defaultProps} onSourceTextChange={mockOnChange} />);

    // Act
    fireEvent.change(screen.getByTestId('source-textarea'), {
      target: { value: 'New text content' },
    });

    // Assert
    expect(mockOnChange).toHaveBeenCalledWith('New text content');
  });

  it('should disable TextInput when isGenerating is true', () => {
    // Arrange & Act
    render(<GenerationForm {...defaultProps} isGenerating={true} />);

    // Assert
    expect(screen.getByTestId('source-textarea')).toBeDisabled();
  });

  it('should disable generate button when isValid is false', () => {
    // Arrange & Act
    render(<GenerationForm {...defaultProps} isValid={false} />);

    // Assert
    expect(screen.getByText('Generuj fiszki')).toBeDisabled();
  });

  it('should enable generate button when isValid is true', () => {
    // Arrange & Act
    render(<GenerationForm {...defaultProps} isValid={true} />);

    // Assert
    expect(screen.getByText('Generuj fiszki')).not.toBeDisabled();
  });

  it('should disable generate button when isGenerating is true', () => {
    // Arrange & Act
    render(<GenerationForm {...defaultProps} isValid={true} isGenerating={true} />);

    // Assert
    expect(screen.getByText('Generowanie...')).toBeDisabled();
  });

  it('should call onGenerate when generate button is clicked', () => {
    // Arrange
    const mockOnGenerate = vi.fn();
    render(<GenerationForm {...defaultProps} isValid={true} onGenerate={mockOnGenerate} />);

    // Act
    fireEvent.click(screen.getByText('Generuj fiszki'));

    // Assert
    expect(mockOnGenerate).toHaveBeenCalledTimes(1);
  });

  it('should show "Generowanie..." text when isGenerating is true', () => {
    // Arrange & Act
    render(<GenerationForm {...defaultProps} isGenerating={true} />);

    // Assert
    expect(screen.getByText('Generowanie...')).toBeInTheDocument();
    expect(screen.queryByText('Generuj fiszki')).not.toBeInTheDocument();
  });

  it('should display help text about character requirements', () => {
    // Arrange & Act
    render(<GenerationForm {...defaultProps} />);

    // Assert
    expect(screen.getByText(/Tekst powinien mieć od 1000 do 10000 znaków/)).toBeInTheDocument();
  });
});
