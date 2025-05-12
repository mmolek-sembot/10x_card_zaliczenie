import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '../../db/database.types';
import type { FlashcardProposalDto, GenerateFlashcardsCommand } from '../../types';

/**
 * Service responsible for flashcard generation logic
 */
/**
 * Service responsible for handling flashcard generation logic.
 * Utilizes an AI model to generate flashcards from a given source text.
 * Handles validation, error logging, and database interactions related to 
 * flashcard generation processes.
 */
export class GenerationService {
  private readonly supabase: SupabaseClient<Database>;
  private readonly model = 'gpt-3.5-turbo'; // Default model for MVP
  private readonly aiRequestTimeout = 40000; // 40s timeout as specified in plan

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Generate flashcards from source text
   * @param userId - Current user ID
   * @param data - Generation command data
   * @returns Generation results with proposals
   * @throws Error on validation or processing failures
   */
  async generateFlashcards(userId: string, data: GenerateFlashcardsCommand) {
    // Validate input length
    if (data.source_text.length < 1000 || data.source_text.length > 10000) {
      throw new Error('Source text must be between 1000 and 10000 characters');
    }

    // Calculate hash and length
    const sourceTextHash = this.calculateTextHash(data.source_text);
    const sourceTextLength = data.source_text.length;

    try {
      // Create generation record in database
      const { data: generation, error: genError } = await this.supabase
        .from('generations')
        .insert({
          user_id: userId,
          model: this.model,
          source_text_hash: sourceTextHash,
          source_text_length: sourceTextLength,
          generated_count: 0, // Will be updated after successful generation
          accepted_count: 0,
        })
        .select('id')
        .single();

      if (genError) {
        throw new Error(`Failed to create generation: ${genError.message}`);
      }

      if (!generation) {
        throw new Error('Failed to create generation: No record returned');
      }

      // Generate flashcards using AI (mock implementation for now)
      // In a real implementation, this would call an external AI service
      const flashcardProposals = await this.callAiService(data.source_text);
      
      // Update generation record with results
      const { error: updateError } = await this.supabase
        .from('generations')
        .update({
          generated_count: flashcardProposals.length,
        })
        .eq('id', generation.id);

      if (updateError) {
        console.error('Failed to update generation count:', updateError);
        // Continue despite the error to return flashcards to user
      }

      return {
        generation_id: generation.id,
        flashcards_proposal: flashcardProposals,
      };
    } catch (error) {
      // Log error and rethrow
      await this.logGenerationError(
        userId,
        error instanceof Error ? error : new Error('Unknown error'),
        sourceTextHash,
        sourceTextLength
      );
      throw error;
    }
  }

  /**
   * Calculate SHA-256 hash of text for efficient storage and comparison
   */
  private calculateTextHash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  /**
   * Call AI service to generate flashcards from source text
   * @param sourceText - Text to generate flashcards from
   * @returns Array of flashcard proposals
   * @throws Error if AI service fails or times out
   */
  private async callAiService(sourceText: string): Promise<FlashcardProposalDto[]> {
    try {
      // Create a timeout promise that rejects after specified milliseconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI service request timed out')), this.aiRequestTimeout);
      });

      // The actual AI service call with prompt engineering for flashcard generation
      const aiServicePromise = this.makeAiServiceRequest(sourceText);

      // Race the AI call against the timeout
      const flashcards = await Promise.race([aiServicePromise, timeoutPromise]);
      
      return flashcards;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'AI service request timed out') {
          throw new Error('AI generation timed out after 40 seconds');
        }
        throw error;
      }
      throw new Error('Unknown error during AI flashcard generation');
    }
  }

  /**
   * Makes the actual API request to the AI service
   * In a production implementation, this would call OpenAI or another LLM service
   */
  private async makeAiServiceRequest(sourceText: string): Promise<FlashcardProposalDto[]> {
    // For MVP, we're implementing a simulated AI service with improved flashcard generation
    // This would be replaced with a real API call in production
    
    // Simulate network delay to mimic real API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Extract key concepts from text (simulated NLP processing)
      const sentences = sourceText.split(/[.!?]\s+/);
      const keywords = this.extractKeywords(sourceText);
      
      // Generate 5-10 flashcards based on content length
      const cardCount = Math.min(Math.max(Math.floor(sourceText.length / 1000), 5), 10);
      const selectedKeywords = keywords.slice(0, cardCount);
      
      // Generate actual flashcards with more meaningful content
      return selectedKeywords.map(keyword => {
        // Find relevant sentences containing this keyword
        const relevantSentences = sentences.filter(sentence => 
          sentence.toLowerCase().includes(keyword.toLowerCase())
        ).slice(0, 2);
        
        // Create question (front) and answer (back)
        const front = this.generateQuestion(keyword, relevantSentences);
        const back = this.generateAnswer(keyword, relevantSentences);
        
        return {
          front,
          back,
          source: 'ai-full' as const
        };
      });
    } catch (error) {
      console.error('Error in AI service simulation:', error);
      throw new Error('Failed to generate flashcards from text');
    }
  }
  
  /**
   * Extract important keywords from text (simulated NLP)
   */
  private extractKeywords(text: string): string[] {
    // In a real implementation, this would use NLP techniques
    // For now, we'll extract words that appear multiple times and are meaningful
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      // Remove punctuation and only consider words longer than 4 characters
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      if (cleanWord.length > 4) {
        acc[cleanWord] = (acc[cleanWord] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Sort by frequency and importance (longer words get priority)
    return Object.entries(wordCounts)
      .filter(([_, count]) => count > 1) // Only words that appear multiple times
      .sort((a, b) => (b[1] * b[0].length) - (a[1] * a[0].length)) // Sort by frequency * length
      .map(([word]) => word)
      .slice(0, 15); // Take top 15 keywords
  }
  
  /**
   * Generate a question for the flashcard front
   */
  private generateQuestion(keyword: string, contexts: string[]): string {
    // Create more varied question formats based on the keyword
    const questionTemplates = [
      `What is ${keyword}?`,
      `Define the term "${keyword}" in the context of this subject.`,
      `Explain the concept of ${keyword} as mentioned in the text.`,
      `What are the key characteristics of ${keyword}?`,
      `How would you describe ${keyword} to someone unfamiliar with it?`
    ];
    
    // Select a random template for variety
    const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
    return template;
  }
  
  /**
   * Generate an answer for the flashcard back
   */
  private generateAnswer(keyword: string, contexts: string[]): string {
    if (contexts.length === 0) {
      return `${keyword} is an important concept in this text. Further details were not provided.`;
    }
    
    // Combine relevant contexts into a coherent answer
    const combinedContext = contexts.join(' ');
    if (combinedContext.length > 200) {
      return combinedContext.substring(0, 197) + '...';
    }
    
    return combinedContext;
  }

  /**
   * Log generation errors to the database for monitoring and debugging
   */
  private async logGenerationError(
    userId: string, 
    error: Error,
    sourceTextHash: string,
    sourceTextLength: number,
    generationId?: number
  ): Promise<void> {
    try {
      await this.supabase.from('generation_error_logs').insert({
        user_id: userId,
        error_code: error.name || 'Error',
        error_message: error.message,
        generation_id: generationId || 0, // Use 0 for errors before generation creation
        model: this.model,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
      });
    } catch (logError) {
      // Just log to console if we can't write to error log table
      console.error('Failed to log generation error:', logError);
      console.error('Original error:', error);
    }
  }
}
