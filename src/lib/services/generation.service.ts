import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database } from '../../db/database.types';
import type { FlashcardProposalDto, GenerateFlashcardsCommand } from '../../types';
import { createOpenRouterService, SCHEMAS } from '../services/openrouter';
import type { ChatOptions, FlashcardCollectionContent } from '../services/openrouter';

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
  private readonly openRouter;
  private readonly model = 'openai/gpt-4.1-nano'; // Default OpenRouter model
  private readonly aiRequestTimeout = 40000; // 40s timeout as specified in plan

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.openRouter = createOpenRouterService({
      defaultModel: this.model,
      timeout: this.aiRequestTimeout,
      defaultSystemMessage: 'You are a specialized AI that creates educational flashcards. Your task is to create clear, concise, and educational flashcards based on the text provided.'
    });
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

      // Generate flashcards using OpenRouter AI service
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

      // The actual AI service call using OpenRouter
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
   * Makes the actual API request to the OpenRouter AI service
   */
  private async makeAiServiceRequest(sourceText: string): Promise<FlashcardProposalDto[]> {
    try {
      // Determine number of flashcards to generate based on content length
      const cardCount = Math.min(Math.max(Math.floor(sourceText.length / 1000), 5), 10);
      
      // Create the prompt for generating flashcards with explicit JSON instructions
      const prompt = `Generate ${cardCount} educational flashcards from the following text. 
Each flashcard should focus on a key concept or fact from the text.
Focus on creating effective learning materials with clear questions and concise answers.

IMPORTANT: You MUST respond with a valid JSON object following this exact structure:
{
  "flashcards": [
    {
      "front": "Question 1",
      "back": "Answer 1"
    },
    {
      "front": "Question 2",
      "back": "Answer 2"
    }
    ...
  ]
}

Do not include any explanations, introductions, or any text outside the JSON structure.

SOURCE TEXT:
${sourceText}`;

      try {
        // Call OpenRouter API with flashcard schema
        const response = await this.openRouter.chat({
          userMessage: prompt,
          responseFormat: SCHEMAS.FLASHCARD_COLLECTION,
          parameters: {
            temperature: 0.4,
            top_p: 0.95,
            max_tokens: 2000
          }
        });
        
        // Convert the response to our FlashcardProposalDto format
        const flashcardCollection = response.content as FlashcardCollectionContent;
        
        return flashcardCollection.flashcards.map(card => ({
          front: card.front,
          back: card.back,
          source: 'ai-full' as const
        }));
      } catch (schemaError) {
        // Fallback: Try using a text response and manual JSON parsing
        console.warn('Schema validation failed, attempting fallback method:', schemaError);
        
        const textResponse = await this.openRouter.chat({
          userMessage: prompt,
          // No responseFormat specified - get raw text
          parameters: {
            temperature: 0.4,
            top_p: 0.95,
            max_tokens: 2000
          }
        });
        
        // Extract JSON from text response
        const content = textResponse.content as string;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          try {
            const parsedJson = JSON.parse(jsonMatch[0]);
            if (parsedJson.flashcards && Array.isArray(parsedJson.flashcards)) {
              return parsedJson.flashcards.map((card: any) => ({
                front: card.front || '',
                back: card.back || '',
                source: 'ai-full' as const
              }));
            }
          } catch (parseError) {
            console.error('Failed to parse extracted JSON:', parseError);
          }
        }
        
        // If all else fails, try to extract flashcards from text using patterns
        return this.extractFlashcardsFromText(content, cardCount);
      }
    } catch (error) {
      console.error('Error calling OpenRouter service:', error);
      throw new Error('Failed to generate flashcards from text');
    }
  }
  
  /**
   * Fallback method to extract flashcards from unstructured text response
   * when JSON parsing fails
   */
  private extractFlashcardsFromText(text: string, expectedCount: number): FlashcardProposalDto[] {
    const flashcards: FlashcardProposalDto[] = [];
    
    // Try to identify flashcard patterns in the text
    // Look for numbered patterns, "Front:" / "Back:" patterns, or Q&A patterns
    
    // Pattern 1: Numbered flashcards
    const numberedPattern = /(\d+)[\s.):]+([^\n]+)\n+([^\n]+)/g;
    let match;
    
    while ((match = numberedPattern.exec(text)) !== null && flashcards.length < expectedCount) {
      const front = match[2].trim();
      const back = match[3].trim();
      
      if (front && back) {
        flashcards.push({
          front,
          back,
          source: 'ai-full' as const
        });
      }
    }
    
    // Pattern 2: Front/Back pattern
    if (flashcards.length < expectedCount) {
      const frontBackPattern = /Front:[\s]*([^\n]+)\n+Back:[\s]*([^\n]+)/gi;
      while ((match = frontBackPattern.exec(text)) !== null && flashcards.length < expectedCount) {
        const front = match[1].trim();
        const back = match[2].trim();
        
        if (front && back) {
          flashcards.push({
            front,
            back,
            source: 'ai-full' as const
          });
        }
      }
    }
    
    // Pattern 3: Q&A pattern
    if (flashcards.length < expectedCount) {
      const qaPattern = /(?:Question|Q):[\s]*([^\n]+)\n+(?:Answer|A):[\s]*([^\n]+)/gi;
      while ((match = qaPattern.exec(text)) !== null && flashcards.length < expectedCount) {
        const front = match[1].trim();
        const back = match[2].trim();
        
        if (front && back) {
          flashcards.push({
            front,
            back,
            source: 'ai-full' as const
          });
        }
      }
    }
    
    // If we still couldn't extract any flashcards, create simple ones from paragraphs
    if (flashcards.length === 0) {
      const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
      
      for (let i = 0; i < Math.min(paragraphs.length, expectedCount); i++) {
        const paragraph = paragraphs[i].trim();
        if (paragraph.length > 10) {
          const sentenceEnd = paragraph.search(/[.!?]/);
          if (sentenceEnd > 0) {
            const front = paragraph.substring(0, sentenceEnd + 1);
            const back = paragraph.substring(sentenceEnd + 1).trim() || "Review this content for details.";
            
            flashcards.push({
              front,
              back,
              source: 'ai-full' as const
            });
          } else {
            flashcards.push({
              front: `What is important about this content?`,
              back: paragraph,
              source: 'ai-full' as const
            });
          }
        }
      }
    }
    
    return flashcards;
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
