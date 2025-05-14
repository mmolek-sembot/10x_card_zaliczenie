# API Endpoint Implementation Plan: DELETE Flashcard

## 1. Przegląd punktu końcowego
Endpoint `DELETE /api/flashcards/:id` służy do usuwania pojedynczej fiszki z bazy danych. Operacja ta jest nieodwracalna i wymaga autentykacji użytkownika. Tylko właściciel fiszki może ją usunąć. Po pomyślnym usunięciu fiszki, endpoint zwraca status 204 No Content bez treści odpowiedzi.

## 2. Szczegóły żądania
- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/flashcards/:id`
- **Parametry**:
  - **Wymagane**: `id` - identyfikator fiszki do usunięcia (liczba całkowita, część ścieżki URL)
- **Nagłówki autoryzacyjne**: Token uwierzytelniający użytkownika (obsługiwany przez middleware Supabase)

## 3. Wykorzystywane typy
Dla tej operacji nie jest potrzebne definiowanie nowych typów DTO, gdyż:
- Żądanie DELETE nie zawiera treści (body)
- W przypadku sukcesu odpowiedź nie zawiera treści (status 204)

Wykorzystywane istniejące typy:
- `FlashcardDto` - do weryfikacji istnienia fiszki przed usunięciem

## 4. Szczegóły odpowiedzi
- **Sukces**: 204 No Content (bez treści odpowiedzi)
- **Błędy**:
  - 401 Unauthorized - brak uwierzytelnienia lub nieprawidłowy token
  - 404 Not Found - fiszka o podanym ID nie istnieje lub należy do innego użytkownika
  - 500 Internal Server Error - wewnętrzny błąd serwera podczas usuwania fiszki

## 5. Przepływ danych
1. Endpoint otrzymuje żądanie DELETE z parametrem ID fiszki
2. Middleware uwierzytelnia użytkownika i udostępnia klienta Supabase w `context.locals`
3. Endpoint przekazuje ID fiszki oraz ID użytkownika do `FlashcardsService`
4. Serwis najpierw sprawdza, czy fiszka istnieje i należy do użytkownika
5. Serwis wykonuje zapytanie DELETE do bazy danych
6. Endpoint zwraca odpowiedni kod odpowiedzi na podstawie wyniku operacji

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Middleware Supabase weryfikuje token użytkownika
- **Autoryzacja**: Serwis sprawdza, czy fiszka należy do zalogowanego użytkownika
- **Row Level Security (RLS)**: Polityki RLS w Supabase dodatkowo zapewniają, że użytkownicy mają dostęp tylko do swoich fiszek
- **Walidacja parametrów**: Endpoint sprawdza poprawność ID fiszki (czy jest liczbą całkowitą)
- **Ochrona przed atakami CSRF**: Ze względu na to, że jest to endpoint DELETE zmieniający stan, należy rozważyć dodatkowe środki ochrony przed CSRF

## 7. Obsługa błędów
- **Brak uwierzytelnienia**: Zwrócenie kodu 401 Unauthorized
- **Fiszka nie istnieje**: Zwrócenie kodu 404 Not Found
- **Fiszka należy do innego użytkownika**: Zwrócenie kodu 404 Not Found (nie 403, aby uniknąć wycieku informacji o istnieniu zasobu)
- **Błąd bazy danych**: Zwrócenie kodu 500 Internal Server Error z odpowiednim komunikatem dla deweloperów w logach
- **Nieprawidłowy format ID**: Zwrócenie kodu 400 Bad Request z informacją o nieprawidłowym formacie ID

## 8. Rozważania dotyczące wydajności
- **Indeksowanie**: Tabela `flashcards` posiada już indeks na kolumnie `user_id`, co zapewnia szybkie wyszukiwanie fiszek użytkownika
- **Kaskadowe usuwanie**: W schemacie bazy danych relacja między `generations` a `flashcards` jest skonfigurowana jako `ON DELETE SET NULL`, co oznacza, że usunięcie fiszki nie wpłynie na powiązaną generację
- **Transakcje**: Operacja jest prosta i atomowa, więc nie wymaga dodatkowego zarządzania transakcjami

## 9. Etapy wdrożenia
1. **Rozszerzenie serwisu fiszek**:
   - Dodanie metody `deleteFlashcard(id: number, userId: string)` do klasy `FlashcardsService`

   ```typescript
   async deleteFlashcard(id: number, userId: string): Promise<boolean> {
     try {
       // Sprawdź, czy fiszka istnieje i należy do użytkownika
       const flashcard = await this.getFlashcardById(id, userId);
       if (!flashcard) {
         return false;
       }
       
       // Usuń fiszkę
       const { error } = await this.supabase
         .from('flashcards')
         .delete()
         .eq('id', id)
         .eq('user_id', userId);
       
       if (error) {
         console.error('Database error while deleting flashcard:', {
           error,
           flashcardId: id,
           userId
         });
         throw new Error(`Failed to delete flashcard: ${error.message}`);
       }
       
       // Logowanie pomyślnego usunięcia
       console.info('Flashcard deleted successfully:', {
         flashcardId: id,
         userId,
         timestamp: new Date().toISOString()
       });
       
       return true;
     } catch (error) {
       console.error('Unexpected error in deleteFlashcard:', {
         error,
         flashcardId: id,
         userId,
         stack: error instanceof Error ? error.stack : undefined
       });
       
       throw new Error(`Unexpected error deleting flashcard: ${error instanceof Error ? error.message : String(error)}`);
     }
   }
   ```

2. **Utworzenie pliku endpointu**:
   - Stworzenie pliku `src/pages/api/flashcards/[id].ts` z obsługą metody DELETE

   ```typescript
   import { z } from 'zod';
   import type { APIContext } from 'astro';
   import { FlashcardsService } from '../../../lib/services/flashcards.service';

   export const prerender = false;

   // Schemat walidacji parametru ID
   const paramsSchema = z.object({
     id: z.coerce.number().int().positive(),
   });

   export async function DELETE({ params, locals, request }: APIContext) {
     try {
       // Walidacja ID fiszki
       const result = paramsSchema.safeParse(params);
       if (!result.success) {
         return new Response(JSON.stringify({
           error: 'Invalid flashcard ID format',
           details: result.error.format()
         }), {
           status: 400,
           headers: { 'Content-Type': 'application/json' }
         });
       }
       
       const { id } = result.data;
       
       // Sprawdź uwierzytelnienie użytkownika
       const supabase = locals.supabase;
       const { data: { user } } = await supabase.auth.getUser();
       
       if (!user) {
         return new Response(null, { status: 401 });
       }
       
       // Wywołaj serwis fiszek
       const flashcardsService = new FlashcardsService(supabase);
       const success = await flashcardsService.deleteFlashcard(id, user.id);
       
       if (!success) {
         return new Response(null, { status: 404 });
       }
       
       // 204 No Content - pomyślne usunięcie bez treści odpowiedzi
       return new Response(null, { status: 204 });
     } catch (error) {
       console.error('Error deleting flashcard:', error);
       
       // 500 Internal Server Error dla nieoczekiwanych błędów
       return new Response(JSON.stringify({
         error: 'Internal server error',
         message: 'An unexpected error occurred while deleting the flashcard.'
       }), {
         status: 500,
         headers: { 'Content-Type': 'application/json' }
       });
     }
   }
   ```


3. **Dokumentacja**:
   - Aktualizacja dokumentacji API o nowy endpoint
   - Dodanie komentarzy JSDoc do nowych funkcji
