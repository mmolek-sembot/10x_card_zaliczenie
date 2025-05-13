# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Przegląd punktu końcowego
Endpoint umożliwia tworzenie wielu fiszek w jednym żądaniu, obsługując zarówno fiszki tworzone ręcznie, jak i generowane przez AI. Endpoint wymaga uwierzytelnienia i zwraca szczegółowe informacje o utworzonych fiszkach.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: /api/flashcards
- Request Body:
  ```typescript
  {
    flashcards: Array<{
      front: string;      // max 200 chars
      back: string;       // max 600 chars
      source: 'ai-full' | 'ai-edited' | 'manual';
      generation_id: number | null;  // required for AI cards
    }>
  }
  ```

## 3. Wykorzystywane typy
```typescript
// Command model
interface CreateFlashcardsCommand {
  flashcards: CreateFlashcardInputDto[];
}

// Input DTO
type CreateFlashcardInputDto = {
  front: string;
  back: string;
  source: FlashcardSource;
  generation_id: number | null;
};

// Response DTO
interface CreateFlashcardsResponseDto {
  flashcards: FlashcardDto[];
}
```

## 4. Szczegóły odpowiedzi
- Status: 201 Created
- Response Body:
  ```typescript
  {
    flashcards: Array<{
      id: number;
      user_id: string;
      generation_id: number | null;
      front: string;
      back: string;
      source: FlashcardSource;
      created_at: string;
      updated_at: string;
    }>
  }
  ```

## 5. Przepływ danych
1. Walidacja tokenu uwierzytelniającego
2. Walidacja danych wejściowych przy użyciu Zod
3. Wstawienie fiszek do bazy danych
4. Zwrócenie utworzonych fiszek

## 6. Względy bezpieczeństwa
- Wymagane uwierzytelnienie przez Supabase Auth
- Row Level Security (RLS) zapewnia izolację danych użytkowników
- Walidacja danych wejściowych:
  - Maksymalna długość pól
  - Poprawność wartości enuma source
  - Spójność generation_id z source
- Rate limiting dla zapobiegania nadużyciom

## 7. Obsługa błędów
- 400 Bad Request:
  - Brak wymaganych pól
  - Nieprawidłowa długość pól
  - Nieprawidłowa wartość source
  - Nieprawidłowa wartość generation_id
- 401 Unauthorized:
  - Brak tokenu uwierzytelniającego
  - Nieprawidłowy token
- 500 Internal Server Error:
  - Błędy bazy danych
  - Błędy serwera

## 8. Rozważania dotyczące wydajności
- Użycie transakcji dla wstawiania wielu fiszek
- Indeksy na kolumnach user_id i generation_id
- Optymalizacja zapytań do bazy danych
- Rozważenie implementacji rate limitingu

## 9. Etapy wdrożenia
1. Utworzenie endpointu w Astro API routes
2. Implementacja middleware do walidacji tokenu
3. Utworzenie serwisu FlashcardService
4. Implementacja walidacji danych wejściowych
5. Implementacja logiki tworzenia fiszek
6. Dodanie obsługi błędów
7. Testy jednostkowe i integracyjne
8. Dokumentacja API