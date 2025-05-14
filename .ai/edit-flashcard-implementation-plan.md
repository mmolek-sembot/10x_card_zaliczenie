# API Endpoint Implementation Plan: PUT /api/flashcards/:id

## 1. Przegląd punktu końcowego
Ten endpoint umożliwia aktualizację istniejącej fiszki (flashcard) na podstawie jej identyfikatora. Aktualizacji podlegają pola `front` (pytanie) i `back` (odpowiedź). Ponadto, jeśli fiszka była wcześniej utworzona automatycznie przez AI (`source = "ai-full"`), jej status zostanie zmieniony na `"ai-edited"` podczas aktualizacji.

## 2. Szczegóły żądania
- Metoda HTTP: PUT
- Struktura URL: `/api/flashcards/:id`
- Parametry ścieżki:
  - Wymagane: `id` - Identyfikator fiszki do aktualizacji (liczba całkowita dodatnia)
- Request Body:
  ```json
  {
    "front": "Updated question text",
    "back": "Updated answer text"
  }
  ```
  - Wymagane przynajmniej jedno z pól: `front` lub `back`
  - Maksymalna długość pola `front`: 200 znaków
  - Maksymalna długość pola `back`: 600 znaków

## 3. Wykorzystywane typy
- `UpdateFlashcardCommand` - Model polecenia definiujący strukturę żądania aktualizacji
- `FlashcardDto` - DTO reprezentujące fiszki zwracane w odpowiedzi API
- `FlashcardSource` - Typ unii określający możliwe wartości pola `source` fiszki

Istniejące typy z `src/types.ts`:
```typescript
/** All valid flashcard sources accepted by the API */
export type FlashcardSource = 'ai-full' | 'ai-edited' | 'manual';

/** Command model for PUT /api/flashcards/:id */
export type UpdateFlashcardCommand = Partial<
  Pick<FlashcardDto, 'front' | 'back'>
>;
```

## 4. Szczegóły odpowiedzi
- Status: 200 OK
- Format odpowiedzi:
  ```json
  {
    "id": 1,
    "user_id": "uuid",
    "generation_id": 1,
    "front": "Updated question text",
    "back": "Updated answer text",
    "source": "ai-edited",
    "created_at": "2025-05-08T00:00:00Z",
    "updated_at": "2025-05-08T01:00:00Z"
  }
  ```
- Kody błędów:
  - 400 Bad Request - Nieprawidłowe dane wejściowe
  - 401 Unauthorized - Brak autoryzacji
  - 404 Not Found - Fiszka o podanym ID nie została znaleziona
  - 500 Internal Server Error - Błąd wewnętrzny serwera

## 5. Przepływ danych
1. Walidacja parametru `id` w ścieżce URL
2. Walidacja ciała żądania względem schematu `UpdateFlashcardCommand`
3. Pobranie aktualnej fiszki z bazy danych i sprawdzenie, czy należy do zalogowanego użytkownika
4. Aktualizacja pól fiszki na podstawie danych z żądania
5. Zmiana pola `source` z `"ai-full"` na `"ai-edited"`, jeśli było ustawione na `"ai-full"`
6. Zapis zaktualizowanej fiszki do bazy danych
7. Zwrócenie zaktualizowanej fiszki w odpowiedzi

## 6. Względy bezpieczeństwa
- Należy zweryfikować, czy użytkownik jest zalogowany (uwierzytelnienie)
- Należy sprawdzić, czy użytkownik jest właścicielem fiszki (autoryzacja)
- Dane wejściowe muszą być zwalidowane pod kątem:
  - Poprawnego typu danych
  - Maksymalnej długości pól
  - Obecności wymaganych pól
- Zapytania do bazy danych powinny korzystać z mechanizmu Row Level Security (RLS) Supabase, który automatycznie filtruje wyniki na podstawie tożsamości użytkownika

## 7. Obsługa błędów
1. Nieprawidłowy format ID:
   - Status: 400 Bad Request
   - Komunikat: "Invalid flashcard ID"
   - Szczegóły: Szczegóły walidacji Zod

2. Nieprawidłowe dane wejściowe:
   - Status: 400 Bad Request
   - Komunikat: "Validation error"
   - Szczegóły: Szczegóły walidacji Zod

3. Brak autoryzacji:
   - Status: 401 Unauthorized
   - Komunikat: "Unauthorized"

4. Fiszka nie znaleziona:
   - Status: 404 Not Found
   - Komunikat: "Flashcard not found"

5. Błąd bazy danych:
   - Status: 500 Internal Server Error
   - Komunikat: "Error updating flashcard"
   - Log: Pełny komunikat błędu (tylko po stronie serwera)

6. Nieoczekiwany błąd:
   - Status: 500 Internal Server Error
   - Komunikat: "Internal server error"
   - Log: Pełny komunikat błędu (tylko po stronie serwera)

## 8. Rozważania dotyczące wydajności
- Operacja aktualizacji fiszki jest relatywnie prosta i nie powinna stanowić wąskiego gardła wydajnościowego
- Używamy Supabase PostgreSQL, które posiada indeksy na kluczach głównych i obcych, co zapewnia szybkie wyszukiwanie fiszek po ID
- Każde żądanie aktualizuje tylko jedną fiszkę, co ogranicza obciążenie bazy danych

## 9. Etapy wdrożenia

### 1. Rozszerzenie FlashcardsService

Dodaj metodę `updateFlashcard` do istniejącego serwisu `FlashcardsService`:

```typescript
async updateFlashcard(
  id: number, 
  userId: string, 
  data: UpdateFlashcardCommand
): Promise<FlashcardDto | null> {
  try {
    // Najpierw pobierz aktualną fiszkę, aby sprawdzić czy istnieje i czy należy do użytkownika
    const currentFlashcard = await this.getFlashcardById(id, userId);
    
    if (!currentFlashcard) {
      return null;
    }
    
    // Przygotuj dane do aktualizacji
    const updateData: Partial<FlashcardDto> = {
      ...data
    };
    
    // Jeśli fiszka była utworzona przez AI, zmień source na "ai-edited"
    if (currentFlashcard.source === 'ai-full') {
      updateData.source = 'ai-edited';
    }
    
    // Aktualizuj fiszkę
    const { data: updatedFlashcard, error } = await this.supabase
      .from('flashcards')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, generation_id, front, back, source, created_at, updated_at')
      .single();
      
    if (error) {
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }
    
    return updatedFlashcard as FlashcardDto;
  } catch (error) {
    throw new Error(`Unexpected error updating flashcard: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

### 2. Utworzenie schematu walidacji

Utwórz schemat validacji w `src/lib/schemas/flashcards.schema.ts`:

```typescript
// Dodaj do istniejącego pliku
export const updateFlashcardSchema = z.object({
  front: z.string()
    .min(1, 'Front content is required')
    .max(200, 'Front content cannot exceed 200 characters')
    .optional(),
  back: z.string()
    .min(1, 'Back content is required')
    .max(600, 'Back content cannot exceed 600 characters')
    .optional()
}).refine(data => data.front !== undefined || data.back !== undefined, {
  message: "At least one field (front or back) must be provided"
});

export type UpdateFlashcardSchemaType = z.infer<typeof updateFlashcardSchema>;
```

### 3. Implementacja endpointu PUT

Aktualizuj plik `src/pages/api/flashcards/[id].ts`, dodając obsługę metody PUT:

```typescript
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate ID parameter
    const idResult = flashcardIdSchema.safeParse({ id: params.id });
    if (!idResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid flashcard ID',
        details: idResult.error.issues 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Validate request body
    const body = await request.json();
    const validationResult = updateFlashcardSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const command = validationResult.data as UpdateFlashcardCommand;
    
    // 3. Update flashcard
    const flashcardsService = new FlashcardsService(locals.supabase);
    const updatedFlashcard = await flashcardsService.updateFlashcard(
      idResult.data.id, 
      DEFAULT_USER_ID, 
      command
    );
    
    // 4. Handle flashcard not found
    if (!updatedFlashcard) {
      return new Response(JSON.stringify({ 
        error: 'Flashcard not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 5. Return updated flashcard
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating flashcard:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### 4. Aktualizacja importów

Zaktualizuj importy w pliku `src/pages/api/flashcards/[id].ts`:

```typescript
import { z } from 'zod';
import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../../lib/services/flashcards.service';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import type { UpdateFlashcardCommand } from '../../../types';
import { updateFlashcardSchema } from '../../../lib/schemas/flashcards.schema';
```

