# Plan Implementacji Usługi OpenRouter

## 1. Opis Usługi

OpenRouterService to usługa kliencka, która ułatwia komunikację z API OpenRouter w celu wykorzystania różnych modeli LLM do generowania edukacyjnych fiszek. Usługa zapewnia czysty, bezpieczny pod względem typów interfejs do wysyłania zapytań do OpenRouter, obsługi odpowiedzi, zarządzania błędami i optymalizacji wydajności.

## 2. Konstruktor

```typescript
class OpenRouterService {
  constructor(config: OpenRouterConfig) {
    // Inicjalizacja usługi z konfiguracją
  }
}

// Typy
interface OpenRouterConfig {
  apiKey?: string; // Opcjonalny, jeśli ustawiony w zmiennych środowiskowych
  baseUrl?: string; // Domyślnie URL API OpenRouter
  defaultModel?: string; // Domyślny model do użycia
  defaultSystemMessage?: string; // Domyślna wiadomość systemowa
  defaultParameters?: ModelParameters; // Domyślne parametry
  timeout?: number; // Limit czasu żądania w ms
  retryOptions?: RetryOptions; // Konfiguracja ponownych prób
  cacheOptions?: CacheOptions; // Konfiguracja buforowania
}
```

## 3. Publiczne Metody i Właściwości

### 3.1 Metoda Chat

```typescript
async chat(options: ChatOptions): Promise<ChatResponse> {
  // Przetwarzanie żądania czatu
}

// Typy
interface ChatOptions {
  messages?: ChatMessage[]; // Pełna historia konwersacji
  userMessage?: string; // Skrót dla pojedynczej wiadomości użytkownika
  systemMessage?: string; // Zastąpienie domyślnej wiadomości systemowej
  model?: string; // Zastąpienie domyślnego modelu
  models?: string[]; // Priorytetowa lista modeli do wypróbowania
  responseFormat?: ResponseFormat; // Format ustrukturyzowanej odpowiedzi
  parameters?: ModelParameters; // Zastąpienie domyślnych parametrów
  parameterPreset?: 'creative' | 'balanced' | 'precise'; // Predefiniowane zestawy parametrów
  cache?: boolean; // Czy używać bufora dla tego żądania
  abortSignal?: AbortSignal; // Do anulowania żądań
}

interface ChatResponse {
  content: string | object; // Treść odpowiedzi (obiekt, jeśli odpowiedź JSON)
  model: string; // Model, który wygenerował odpowiedź
  usage: TokenUsage; // Informacje o zużyciu tokenów
  id: string; // ID odpowiedzi
  metadata: Record<string, any>; // Dodatkowe metadane
}
```

### 3.2 Metoda Stream

```typescript
async stream(options: ChatOptions): Promise<ReadableStream<ChatResponseChunk>> {
  // Przetwarzanie strumieniowego żądania czatu
}

// Typy
interface ChatResponseChunk {
  content: string; // Fragment treści
  done: boolean; // Czy to ostatni fragment
}
```

### 3.3 Metody Pomocnicze

```typescript
// Narzędzia do schematów
static createJsonSchema(schema: object, options?: SchemaOptions): ResponseFormat {
  // Tworzenie formatu odpowiedzi ze schematem JSON
}

// Predefiniowane schematy
static get SCHEMAS(): Record<string, ResponseFormat> {
  // Zwraca popularne schematy, w tym FLASHCARD
}

// Narzędzia do modeli
getAvailableModels(): Promise<ModelInfo[]> {
  // Pobieranie dostępnych modeli z OpenRouter
}
```

## 4. Prywatne Metody i Właściwości

### 4.1 Budowanie Żądań

```typescript
private buildRequest(options: ChatOptions): Request {
  // Tworzenie obiektu żądania dla API OpenRouter
}

private createMessages(options: ChatOptions): ChatMessage[] {
  // Tworzenie tablicy wiadomości na podstawie opcji
}

private applyParameters(parameters: ModelParameters): ModelParameters {
  // Zastosowanie i walidacja parametrów
}
```

### 4.2 Obsługa Odpowiedzi

```typescript
private async handleResponse(response: Response): Promise<ChatResponse> {
  // Przetwarzanie odpowiedzi API
}

private async processJsonResponse(response: object): Promise<object> {
  // Przetwarzanie odpowiedzi JSON, walidacja względem schematu jeśli potrzebna
}
```

### 4.3 Buforowanie

```typescript
private getCachedResponse(request: Request): Promise<ChatResponse | null> {
  // Próba pobrania odpowiedzi z bufora
}

private cacheResponse(request: Request, response: ChatResponse): Promise<void> {
  // Buforowanie odpowiedzi do przyszłego użycia
}
```

### 4.4 Obsługa Błędów

```typescript
private handleApiError(error: unknown): never {
  // Przekształcanie błędów API na bardziej znaczące błędy
}

private async retryRequest(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  // Ponawianie funkcji z wykładniczym opóźnieniem
}
```

## 5. Obsługa Błędów

### 5.1 Niestandardowe Typy Błędów

```typescript
class OpenRouterError extends Error {
  constructor(message: string, public code: string, public cause?: Error) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

class AuthenticationError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'authentication_error', cause);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'validation_error', cause);
    this.name = 'ValidationError';
  }
}

// Dodatkowe typy błędów: NetworkError, RateLimitError, itp.
```

### 5.2 Scenariusze Błędów i Ich Obsługa

1. **Problemy z Autentykacją API**
   - Sprawdzanie poprawności klucza API przed wysłaniem żądań
   - Dostarczanie jasnych komunikatów o błędach autentykacji
   - Obsługa limitów żądań z wykładniczym opóźnieniem

2. **Walidacja Żądań**
   - Walidacja parametrów przed wysłaniem żądań
   - Zapewnienie bezpieczeństwa typów dzięki interfejsom TypeScript
   - Wykorzystanie Zod do walidacji w czasie wykonania

3. **Problemy Sieciowe**
   - Implementacja obsługi limitu czasu
   - Dodanie logiki ponawiania z wykładniczym opóźnieniem
   - Dostarczanie szczegółowych informacji o błędach sieciowych

4. **Przetwarzanie Odpowiedzi**
   - Walidacja formatu odpowiedzi
   - Zapewnienie rozwiązań awaryjnych dla nieprawidłowo sformatowanych odpowiedzi
   - Obsługa błędów walidacji schematów

5. **Konfiguracja Usługi**
   - Walidacja konfiguracji podczas inicjalizacji
   - Zapewnienie sensownych wartości domyślnych
   - Sprawdzanie zmiennych środowiskowych

6. **Limity Użycia**
   - Śledzenie i raportowanie metryk użycia
   - Implementacja limitów budżetowych
   - Obsługa scenariuszy przekroczenia limitu

## 6. Kwestie Bezpieczeństwa

1. **Zarządzanie Kluczami API**
   - Przechowywanie kluczy API w zmiennych środowiskowych (`import.meta.env.OPENROUTER_API_KEY`)
   - Nigdy nie ujawnianie kluczy API w kodzie po stronie klienta
   - Implementacja mechanizmu rotacji kluczy

2. **Bezpieczeństwo Żądań/Odpowiedzi**
   - Sanityzacja danych wejściowych użytkownika
   - Walidacja treści odpowiedzi przed przetworzeniem
   - Odpowiednia obsługa danych osobowych

3. **Ograniczanie Szybkości**
   - Implementacja ograniczania szybkości po stronie klienta
   - Monitorowanie użycia i implementacja wyłączników automatycznych
   - Dodanie alertów dla nietypowych wzorców użycia

4. **Prywatność Danych**
   - Rozważenie, jakie dane są wysyłane do zewnętrznych API
   - Implementacja zasad minimalizacji danych
   - Przestrzeganie polityk przechowywania danych

## 7. Plan Implementacji Krok po Kroku

### Krok 1: Konfiguracja Struktury Projektu

```
src/
  lib/
    services/
      openrouter/
        index.ts             # Główny eksport
        openrouter-service.ts # Implementacja usługi
        types.ts             # Typy TypeScript
        errors.ts            # Niestandardowe typy błędów
        schemas.ts           # Schematy JSON
        utils.ts             # Funkcje pomocnicze
```

### Krok 2: Definiowanie Typów i Interfejsów

Utworzenie niezbędnych interfejsów TypeScript dla żądań, odpowiedzi i konfiguracji w `types.ts`.

### Krok 3: Implementacja Klas Błędów

Zdefiniowanie niestandardowych klas błędów w `errors.ts` dla różnych scenariuszy błędów.

### Krok 4: Tworzenie Schematów JSON

Implementacja wspólnych schematów JSON w `schemas.ts`, szczególnie dla fiszek:

```typescript
export const FLASHCARD_SCHEMA: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "flashcard",
    strict: true,
    schema: {
      type: "object",
      properties: {
        front: { type: "string" },
        back: { type: "string" },
        difficulty: { type: "integer", minimum: 1, maximum: 5 },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["front", "back"]
    }
  }
};
```

### Krok 5: Implementacja Głównej Usługi

Rozwinięcie klasy `OpenRouterService` w `openrouter-service.ts` ze wszystkimi wymaganymi metodami.

### Krok 6: Dodanie Funkcji Pomocniczych

Utworzenie funkcji pomocniczych w `utils.ts` dla typowych zadań.

### Krok 7: Utworzenie Fabryki Usługi

Implementacja funkcji fabrycznej w `index.ts` do tworzenia instancji usługi.

### Krok 8: Dodanie Konfiguracji Środowiska

Konfiguracja zmiennych środowiskowych dla API OpenRouter:

```
# .env
OPENROUTER_API_KEY=twój_klucz_api
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Krok 9: Dokumentacja

Dodanie komentarzy JSDoc do wszystkich publicznych metod i interfejsów.

## Przykłady Użycia

### Podstawowe Użycie

```typescript
import { createOpenRouterService } from '@/lib/services/openrouter';

const openRouter = createOpenRouterService();

// Proste żądanie
const response = await openRouter.chat({
  userMessage: "Utwórz fiszkę na temat fotosyntezy"
});

console.log(response.content);
```

### Ustrukturyzowana Odpowiedź

```typescript
import { createOpenRouterService, SCHEMAS } from '@/lib/services/openrouter';

const openRouter = createOpenRouterService();

// Pobierz ustrukturyzowaną fiszkę
const response = await openRouter.chat({
  userMessage: "Utwórz fiszkę na temat fotosyntezy",
  responseFormat: SCHEMAS.FLASHCARD,
  model: "anthropic/claude-3-opus-20240229",
  parameters: {
    temperature: 0.3,
    max_tokens: 500
  }
});

const flashcard = response.content as FlashcardContent;
console.log(`Przód: ${flashcard.front}`);
console.log(`Tył: ${flashcard.back}`);
```

### Odpowiedź Strumieniowa

```typescript
import { createOpenRouterService } from '@/lib/services/openrouter';

const openRouter = createOpenRouterService();

// Strumieniowa odpowiedź
const stream = await openRouter.stream({
  systemMessage: "Jesteś asystentem edukacyjnym tworzącym fiszki.",
  userMessage: "Utwórz szczegółową fiszkę na temat replikacji DNA"
});

// Przetwarzanie strumienia
for await (const chunk of stream) {
  console.log(chunk.content);
  if (chunk.done) break;
}
```

### Obsługa Błędów

```typescript
import { createOpenRouterService, OpenRouterError } from '@/lib/services/openrouter';

const openRouter = createOpenRouterService();

try {
  const response = await openRouter.chat({
    userMessage: "Utwórz fiszkę na temat fizyki kwantowej"
  });
  
  // Użyj odpowiedzi
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.error(`Błąd OpenRouter: ${error.code} - ${error.message}`);
  } else {
    console.error(`Nieoczekiwany błąd: ${error.message}`);
  }
}
```
