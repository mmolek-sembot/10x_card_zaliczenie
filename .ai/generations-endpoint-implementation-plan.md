# API Endpoint Implementation Plan: POST /api/generations

## 1. Przegląd punktu końcowego
- Cel: Generowanie fiszek edukacyjnych przy użyciu AI na podstawie długiego tekstu źródłowego. Endpoint odpowiada za przyjmowanie tekstu, walidację, wywołanie logiki AI generującej fiszki oraz zapis wyników do odpowiednich tabel bazy danych (generations, flashcards, generation_error_logs).

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Ścieżka URL:** /api/generations
- **Parametry:**
  - **Wymagane:**
    - `source_text` – typu string, długość: 1000-10000 znaków
  - **Opcjonalne:** Brak

- **Przykładowe Request Body:**
  ```json
  {
    "source_text": "Długi tekst zawierający od 1000 do 10000 znaków..."
  }
  ```

## 3. Wykorzystywane typy
- **DTO:**
  - `CreateGenerationRequest` – reprezentuje dane wejściowe z polem `source_text`.
  - `GenerationResponse` – reprezentuje odpowiedź zawierającą `generation_id` oraz listę `flashcards_proposal`.
  - `FlashcardProposal` – obiekt zawierający pola `front`, `back` i `source` (np. przyjmujące wartość 'ai-full').

## 4. Szczegóły odpowiedzi
- **Sukces (201 Created):**
  - Response Body zawiera:
    - `generation_id` (number)
    - `flashcards_proposal` – tablica obiektów fiszek

  **Przykład odpowiedzi:**
  ```json
  {
    "generation_id": 123,
    "flashcards_proposal": [
      {
        "front": "Generated question 1",
        "back": "Generated answer 1",
        "source": "ai-full"
      },
      {
        "front": "Generated question 2",
        "back": "Generated answer 2",
        "source": "ai-full"
      }
    ]
  }
  ```
- **Błędy:**
  - **400 Bad Request:** dane wejściowe nie spełniają kryteriów walidacji.
  - **401 Unauthorized:** brak odpowiedniej autoryzacji użytkownika.
  - **500 Internal Server Error:** błąd po stronie serwera.

## 5. Przepływ danych
1. Użytkownik wysyła żądanie z `source_text`.
2. Middleware uwierzytelniające przechwytuje żądanie i wstrzykuje klienta Supabase.
3. Warstwa walidacji (np. przy użyciu Zod) weryfikuje poprawność i długość przekazanego `source_text`.
4. Wywołanie `GenerationService`, która:
   - Oblicza skrót (`source_text_hash`) oraz waliduje długość tekstu.
   - Inicjuje rekord w tabeli `generations` z informacjami o użytkowniku, modelu, liczbie generowanych fiszek itp.
   - Wywołuje moduł AI do generacji propozycji fiszek.
   - Jeśli występują błędy, rejestruje błędy w tabeli `generation_error_logs`.
5. Ostatecznie zwracana jest odpowiedź z odpowiednimi danymi i kodem statusu 201.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Endpoint wymaga uwierzytelnienia za pomocą Supabase Auth i korzysta z RLS (Row Level Security).
- **Walidacja danych:** Skrupulatne sprawdzanie `source_text` by zapobiegać atakom związanym z nadmiernym rozmiarem lub nieprawidłowym formatem danych.
- **Ochrona przed nadużyciami:** Ograniczenie rozmiaru danych wejściowych oraz rejestrowanie nieprawidłowych prób.

## 7. Obsługa błędów
- **400 Bad Request:** Gdy `source_text` nie spełnia warunków walidacji (np. zbyt krótki lub zbyt długi).
- **401 Unauthorized:** Gdy użytkownik nie jest poprawnie uwierzytelniony.
- **500 Internal Server Error:** Wystąpienie nieprzewidzianych błędów związanych z przetwarzaniem, przy jednoczesnym logowaniu błędów w tabeli `generation_error_logs`.

## 8. Rozważania dotyczące wydajności
- Operacje związane z wywołaniem modułu AI mogą być intensywne obliczeniowo, co na dalszym etapie może wymagać zastosowania kolejkowania lub przetwarzania asynchronicznego, w mvp nalezy ustawic timeout na 40s dla zapytania do AI.
- Upewnienie się, że indeksy w tabeli `generations` wspierają wydajne zapytania.
- Monitorowanie opóźnień i zoptymalizowanie zapytań do bazy danych.

## 9. Etapy wdrożenia
1. Utworzenie lub aktualizacja typów DTO (np. `CreateGenerationRequest`, `GenerationResponse`, `Flashcard`) w `src/types.ts`.
2. Implementacja endpointu `/api/generations` w katalogu `src/pages/api/`, zgodnie z zasadami backendu (według reguł w `.cursor/rules/backend.mdc`).
3. Utworzenie usługi `GenerationService` w katalogu `src/lib/services`, odpowiedzialnej za logikę biznesową: walidację danych, obliczanie skrótu, inicjowanie wpisu w tabeli `generations`, wywoływanie modułu AI oraz tworzenie wpisów w tabeli `generation_error_logs`.
4. Implementacja walidacji danych wejściowych przy użyciu Zod.
5. Integracja z bazą danych przy użyciu Supabase, uwzględniająca zasady RLS i odpowiednie indeksy.
6. Testowanie endpointu, uwzględniające przypadki poprawnego działania oraz obsługi błędów (400, 401, 500).
7. Code review, wdrożenie na środowisko staging, a następnie produkcyjne.