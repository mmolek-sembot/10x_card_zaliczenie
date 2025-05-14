# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Przegląd punktu końcowego
Endpoint GET /api/flashcards umożliwia pobranie stronicowanej listy fiszek użytkownika. Użytkownik może filtrować fiszki według źródła pochodzenia (ai-full, ai-edited, manual) oraz sortować według różnych kryteriów. Endpoint jest dostępny tylko dla uwierzytelnionych użytkowników i zwraca tylko fiszki należące do zalogowanego użytkownika.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/api/flashcards`
- Parametry:
  - Opcjonalne:
    - `page` (number): Numer strony, domyślnie 1
    - `limit` (number): Liczba elementów na stronę, domyślnie 20
    - `source` (string): Filtrowanie według źródła ('ai-full', 'ai-edited', 'manual')
    - `sort` (string): Pole sortowania ('created_at', 'updated_at', 'id')
    - `order` (string): Kolejność sortowania ('asc', 'desc')
- Request Body: Brak (metoda GET)

## 3. Wykorzystywane typy
```typescript
// Typy zdefiniowane w src/types.ts
import type { 
  FlashcardDto,
  FlashcardQueryParams,
  FlashcardsPaginatedResponseDto,
  PaginationMetaDto,
  FlashcardSource
} from '../types';
```

## 4. Szczegóły odpowiedzi
- Kod statusu: 200 OK
- Format odpowiedzi: JSON
- Struktura odpowiedzi:
```typescript
{
  data: FlashcardDto[], // Tablica fiszek
  pagination: {
    total: number,      // Całkowita liczba fiszek
    page: number,       // Bieżąca strona
    limit: number,      // Liczba elementów na stronę
    pages: number       // Całkowita liczba stron
  }
}
```

## 5. Przepływ danych
1. Middleware Astro przetwarza token uwierzytelniający i ustawia `context.locals.supabase`.
2. Endpoint otrzymuje żądanie GET z parametrami zapytania.
3. Parametry zapytania są walidowane za pomocą Zod.
4. Serwis fiszek buduje zapytanie do bazy danych, uwzględniając parametry filtrowania i sortowania.
5. Supabase zwraca stronicowane wyniki z bazy danych.
6. Endpoint przekształca dane z bazy w odpowiednie DTO i oblicza metadane paginacji.
7. Endpoint zwraca odpowiedź zgodną z typem `FlashcardsPaginatedResponseDto`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Endpoint wymaga, aby użytkownik był uwierzytelniony.
- **Autoryzacja**: Supabase RLS (Row Level Security) zapewnia, że użytkownik widzi tylko swoje fiszki.
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania są walidowane za pomocą Zod.
- **Sanityzacja danych**: Supabase automatycznie sanityzuje parametry zapytań, aby zapobiec atakom SQL injection.

## 7. Obsługa błędów
- 400 Bad Request: Nieprawidłowe parametry zapytania (np. nieprawidłowy format strony, limitu, źródła, sortowania lub kolejności)
- 401 Unauthorized: Użytkownik nie jest uwierzytelniony
- 500 Internal Server Error: Błędy bazy danych lub nieoczekiwane wyjątki

## 8. Rozważania dotyczące wydajności
- **Indeksowanie**: Upewnij się, że kolumny używane do sortowania i filtrowania są indeksowane w bazie danych.
- **Limity zapytań**: Ogranicz maksymalną wartość parametru `limit` (np. do 100), aby zapobiec przeciążeniu bazy danych.
- **Buforowanie**: Rozważ buforowanie odpowiedzi dla często używanych kombinacji parametrów.
- **Wybór kolumn**: Wybieraj tylko niezbędne kolumny z bazy danych, aby zminimalizować transfer danych.

## 9. Etapy wdrożenia

### 1. Utworzenie schematu walidacji Zod
```typescript
// src/lib/schemas/flashcards.schema.ts
import { z } from 'zod';

export const flashcardsQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  source: z.enum(['ai-full', 'ai-edited', 'manual']).optional(),
  sort: z.enum(['created_at', 'updated_at', 'id']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
});
```

### 2. Implementacja serwisu fiszek
```typescript
// src/lib/services/flashcards.service.ts
import type { SupabaseClient } from '../db/supabase.client';
import type { FlashcardDto, FlashcardQueryParams, FlashcardsPaginatedResponseDto } from '../../types';

export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  async getFlashcards(params: FlashcardQueryParams): Promise<FlashcardsPaginatedResponseDto> {
    const { page, limit, source, sort, order } = params;
    
    // Oblicz offset na podstawie strony i limitu
    const offset = (page - 1) * limit;
    
    // Rozpocznij budowanie zapytania
    let query = this.supabase
      .from('flashcards')
      .select('id, generation_id, front, back, source, created_at, updated_at', { count: 'exact' });
    
    // Dodaj filtrowanie, jeśli podano source
    if (source) {
      query = query.eq('source', source);
    }
    
    // Dodaj sortowanie
    query = query.order(sort, { ascending: order === 'asc' });
    
    // Dodaj paginację
    query = query.range(offset, offset + limit - 1);
    
    // Wykonaj zapytanie
    const { data, count, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }
    
    // Oblicz całkowitą liczbę stron
    const total = count || 0;
    const pages = Math.ceil(total / limit);
    
    // Transformuj dane do DTO
    const flashcards: FlashcardDto[] = data.map(item => ({
      id: item.id,
      generation_id: item.generation_id,
      front: item.front,
      back: item.back,
      source: item.source as FlashcardSource,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
    
    // Zwróć stronicowaną odpowiedź
    return {
      data: flashcards,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    };
  }
}
```

### 3. Implementacja endpointu API
```typescript
// src/pages/api/flashcards/index.ts
import type { APIRoute } from 'astro';
import { flashcardsQuerySchema } from '../../../lib/schemas/flashcards.schema';
import { FlashcardsService } from '../../../lib/services/flashcards.service';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Sprawdź, czy użytkownik jest uwierzytelniony
    const supabase = locals.supabase;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Pobierz i waliduj parametry zapytania
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    
    const validationResult = flashcardsQuerySchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid query parameters', 
          details: validationResult.error.format() 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const params = validationResult.data;
    
    // Pobierz dane za pomocą serwisu
    const flashcardsService = new FlashcardsService(supabase);
    const result = await flashcardsService.getFlashcards(params);
    
    // Zwróć odpowiedź
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### 4. Dokumentacja API
Dodaj dokumentację endpointu w odpowiednim miejscu projektu (np. README.md, docs/api.md). 