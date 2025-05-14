# API Endpoint Implementation Plan: GET /api/flashcards/:id

## 1. Przegląd punktu końcowego
Ten endpoint umożliwia pobieranie szczegółów pojedynczej fiszki na podstawie jej identyfikatora. Zwraca pełne dane fiszki, w tym treść przednią i tylną, datę utworzenia, identyfikator generacji oraz inne metadane. Endpoint wymaga uwierzytelnienia i zwraca dane tylko jeśli należą do zalogowanego użytkownika.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/api/flashcards/:id`
- Parametry:
  - Wymagane: `id` (numer identyfikacyjny fiszki, parametr ścieżki)
  - Opcjonalne: brak
- Body żądania: brak (GET request)

## 3. Wykorzystywane typy
```typescript
// DTOs
import type { FlashcardDto } from '../../types';

// Schemat walidacji Zod
import { z } from 'zod';

const flashcardIdSchema = z.object({
  id: z.coerce.number().int().positive()
});
```

## 4. Szczegóły odpowiedzi
### Sukces (200 OK)
```json
{
  "id": 1,
  "user_id": "uuid",
  "generation_id": 1,
  "front": "Question text",
  "back": "Answer text",
  "source": "ai-full",
  "created_at": "2025-05-08T00:00:00Z",
  "updated_at": "2025-05-08T00:00:00Z"
}
```

### Błędy
- 401 Unauthorized: Użytkownik nie jest zalogowany
- 404 Not Found: Fiszka o podanym ID nie istnieje lub nie należy do zalogowanego użytkownika
- 500 Internal Server Error: Wystąpił nieoczekiwany błąd serwera

## 5. Przepływ danych
1. Odbiór żądania GET z parametrem ID
2. Walidacja parametru ID za pomocą Zod
3. Sprawdzenie autoryzacji użytkownika przy użyciu Supabase Auth
4. Zapytanie do bazy danych Supabase o fiszkę o podanym ID (tylko dla zalogowanego użytkownika)
5. Sprawdzenie czy fiszka istnieje
6. Przekształcenie danych z bazy na format DTOs
7. Zwrócenie odpowiedzi z danymi fiszki lub odpowiednim kodem błędu

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Endpoint wymaga, aby użytkownik był zalogowany. Wykorzystujemy kontekst Supabase z Astro middleware.
- **Autoryzacja**: Polityki bezpieczeństwa na poziomie wierszy (RLS) w Supabase zapewniają, że użytkownik ma dostęp tylko do własnych fiszek.
- **Walidacja danych**: Parametr ID jest walidowany przy użyciu biblioteki Zod, aby zapobiec atakom na bazy danych.
- **Sanityzacja odpowiedzi**: Dane zwracane do klienta są mapowane przez DTO, aby uniknąć ujawnienia wrażliwych informacji.

## 7. Obsługa błędów
- **Nieprawidłowe ID**: Jeśli ID jest nieprawidłowe (np. nie jest liczbą całkowitą dodatnią), zwracamy 400 Bad Request z odpowiednim komunikatem.
- **Brak autoryzacji**: Jeśli użytkownik nie jest zalogowany, zwracamy 401 Unauthorized.
- **Fiszka nie istnieje**: Jeśli fiszka o podanym ID nie istnieje lub nie należy do zalogowanego użytkownika, zwracamy 404 Not Found.
- **Błąd bazy danych**: W przypadku błędu komunikacji z bazą danych lub innego nieoczekiwanego błędu, zwracamy 500 Internal Server Error i logujemy szczegóły błędu po stronie serwera.

## 8. Rozważania dotyczące wydajności
- **Caching**: Rozważyć możliwość cachowania często używanych fiszek na poziomie klienta lub serwera.
- **Indeksowanie**: Tabela flashcards ma już indeks na kolumnie id (klucz główny) oraz user_id, co zapewnia szybki dostęp.
- **Selekcja kolumn**: Pobieramy tylko te kolumny, które są potrzebne w odpowiedzi API, aby zminimalizować transfer danych.

## 9. Etapy wdrożenia
1. Utworzenie pliku `/src/pages/api/flashcards/[id].ts`
2. Implementacja logiki dostępu do bazy danych w serwisie `/src/lib/services/flashcards.service.ts`
3. Dodanie obsługi błędów i walidacji
4. Implementacja odpowiedzi API zgodnej ze specyfikacją
5. Dokumentacja API

### Szczegóły implementacji

#### 1. Plik serwisu `/src/lib/services/flashcards.service.ts`
```typescript
import type { SupabaseClient } from '../../db/supabase.client';
import type { FlashcardDto } from '../../types';

export async function getFlashcardById(
  supabase: SupabaseClient,
  id: number
): Promise<FlashcardDto | null> {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    // Transform to DTO
    return {
      id: data.id,
      user_id: data.user_id,
      generation_id: data.generation_id,
      front: data.front,
      back: data.back,
      source: data.source as FlashcardDto['source'],
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error fetching flashcard:', error);
    throw error;
  }
}
```

#### 2. Plik endpointu `/src/pages/api/flashcards/[id].ts`
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getFlashcardById } from '../../../lib/services/flashcards.service';

export const prerender = false;

// Validation schema
const flashcardIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const GET: APIRoute = async ({ params, locals, request }) => {
  // 1. Check if the user is authenticated
  const { supabase, session } = locals;
  
  if (!session) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // 2. Validate the ID parameter
  try {
    const { id } = flashcardIdSchema.parse({ id: params.id });

    // 3. Get the flashcard
    try {
      const flashcard = await getFlashcardById(supabase, id);
      
      // 4. Check if the flashcard exists
      if (!flashcard) {
        return new Response(JSON.stringify({
          error: 'Not Found', 
          message: 'Flashcard not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // 5. Return the flashcard
      return new Response(JSON.stringify(flashcard), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Error fetching flashcard:', error);
      
      // 6. Handle server error
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    // 7. Handle validation error
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid flashcard ID',
        details: error.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Handle other errors
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
```

Ta implementacja zapewnia bezpieczny i wydajny endpoint do pobierania pojedynczej fiszki, zgodny ze specyfikacją API i najlepszymi praktykami programowania w Astro i Supabase. Endpoint uwzględnia wszystkie wymagane aspekty: uwierzytelnianie, autoryzację, walidację danych, obsługę błędów i mapowanie danych.
