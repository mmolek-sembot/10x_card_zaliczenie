# Podsumowanie architektury UI dla 10xCard

## Podjęte decyzje

1. Główne widoki: Auth, dashboard, generowanie fiszek, lista fiszek z modalami do edycji i tworzenia, panel użytkownika
2. Nawigacja: Współdzielona nawigacja w formie topbara z wykorzystaniem Navigation Menu od shadcn/ui
3. Przepływ użytkownika: Logowanie, generowanie fiszek z AI, jednostkowa akceptacja/edycja/odrzucenie, zbiorczy zapis fiszek, lista fiszek z możliwością edycji i usuwania
4. Responsywność: Wdrożenie responsywnego UI z wykorzystaniem utility variants od Tailwind (sm, md, lg)
5. Zarządzanie stanem: Początkowe wykorzystanie wbudowanych hooków React i Context, z możliwością wprowadzenia Zustand w przyszłości
6. Obsługa błędów: Komunikaty o błędach prezentowane inline, bezpośrednio z API
7. Komponenty UI: Wykorzystanie gotowych komponentów z biblioteki shadcn/ui
8. Optymalizacja: Implementacja lazy loading dla poprawy wydajności
9. Zapisywanie fiszek: Zaznaczanie zatwierdzonych fiszek i zbiorcze zapisywanie
10. Uwierzytelnianie: Wykorzystanie JWT (wdrożenie na późniejszym etapie)

## Dopasowane rekomendacje

1. Zdefiniowanie oddzielnych modułów widoków dla Autoryzacji, Dashboardu, Generowania fiszek, Listy fiszek z funkcjonalnością modalów oraz Panelu użytkownika, z współdzieloną nawigacją górną
2. Stworzenie szczegółowego diagramu przepływów użytkownika, obejmującego logowanie, interakcje na ekranie generowania fiszek oraz końcowy zapis fiszek
3. Wykorzystanie gotowych komponentów shadcn/ui dla modali, przycisków i komunikatów, dostosowując je za pomocą utility variants Tailwind dla responsywnego designu
4. Wdrożenie inline error handling dla wyświetlania komunikatów o błędach bez zakłócania przepływu użytkownika
5. Rozpoczęcie zarządzania stanem aplikacji przy użyciu React Context, z możliwością wprowadzenia zustand w przyszłości
6. Implementacja lazy loadingu dla listy fiszek, aby poprawić wydajność ładowania danych
7. Ustalenie flag wyboru ("Zapisz wszystkie" vs "zapisz zatwierdzone") z intuicyjnymi akcjami do zarządzania stanem fiszek przed finalizacją zapisu
8. Planowanie iteracyjnej integracji UI z API dla testowania wydajności i spójności interfejsu

## Podsumowanie planowania architektury UI

### Główne wymagania architektury UI

10xCard to aplikacja webowa do szybkiego i wygodnego tworzenia fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji. Architektura UI została zaplanowana w oparciu o stack technologiczny obejmujący Astro 5, React 19, TypeScript 5, Tailwind 4, oraz bibliotekę komponentów shadcn/ui.

### Kluczowe widoki i przepływy użytkownika

Aplikacja będzie składać się z następujących głównych widoków:

1. **Autoryzacja**
   - **Ścieżka**: `/auth/login` i `/auth/register`
   - **Główny cel**: Umożliwienie użytkownikom utworzenia konta lub zalogowania się do systemu
   - **Kluczowe informacje**: Formularze logowania/rejestracji, komunikaty o błędach walidacji
   - **Kluczowe komponenty**: 
     - Formularz logowania/rejestracji
     - komponent walidacji

2. **Dashboard / Generowanie fiszek**
   - **Ścieżka**: `/flashcards/generate`
   - **Główny cel**: Umożliwienie wprowadzania tekstu i generowania fiszek przy pomocy AI
   - **Kluczowe informacje**: Pole tekstowe do wprowadzania treści, podgląd wygenerowanych propozycji fiszek, edycja, odrzucanie, zatwierdzenie propozycji
   - **Kluczowe komponenty**:
     - GeneratorLayout (Astro)
     - TextInput (React)
     - GenerationOptions (React)
     - FlashcardPreview (React)
     - Textarea, Button (Shadcn/ui)
     - Card, ScrollArea (Shadcn/ui)
     - Tabs dla przełączania między różnymi widokami generowania (Shadcn/ui)
     - Toast dla powiadomień o statusie generowania (Shadcn/ui)

3. **Lista fiszek**
   - **Ścieżka**: `/flashcards`
   - **Główny cel**: Zarządzanie istniejącymi fiszkami, umożliwienie edycji i usuwania
   - **Kluczowe informacje**: Lista wszystkich fiszek, opcje filtrowania i sortowania, formularze edycji
   - **Kluczowe komponenty**:
     - FlashcardsLayout (Astro)
     - FlashcardsList (React)
     - FlashcardItem (React)
     - EditFlashcardModal, DeleteFlashcardButton (React)
     - DataTable z paginacją (Shadcn/ui)
     - Dialog, Sheet dla formularzy edycji (Shadcn/ui)
     - AlertDialog dla potwierdzenia usunięcia (Shadcn/ui)
     - Input, Select, Button dla filtrów (Shadcn/ui)

4. **Panel użytkownika**
   - **Ścieżka**: `/account`
   - **Główny cel**: Zarządzanie ustawieniami konta i preferencjami użytkownika
   - **Kluczowe informacje**: Dane profilu, przycisk wylogowania
   - **Kluczowe komponenty**:
     - AccountLayout (Astro)
     - Form, FormField, Input, Button (Shadcn/ui)
     - Card, CardHeader, CardContent, CardFooter (Shadcn/ui)
     - Switch, RadioGroup dla opcji preferencji (Shadcn/ui)
     - AlertDialog dla krytycznych operacji na koncie (Shadcn/ui)

Przepływ użytkownika będzie obejmował:
- Logowanie do systemu przez `/auth/login`
- Przejście do `/flashcards/generate` w celu tworzenia nowych fiszek
- Wprowadzanie tekstu do analizy przez AI
- Jednostkowe akceptowanie, edytowanie lub odrzucanie wygenerowanych propozycji fiszek w interaktywnym interfejsie
- Zbiorczy zapis zatwierdzonych fiszek do bazy danych
- Zarządzanie biblioteką istniejących fiszek w `/flashcards`
- Edycja ustawień konta w `/account`

Dla nawigacji wykorzystany zostanie komponent Navigation Menu z biblioteki shadcn/ui, zaimplementowany jako topbar, zapewniający dostęp do wszystkich głównych sekcji aplikacji.

### Strategia integracji z API i zarządzanie stanem

Aplikacja będzie komunikować się z REST API zbudowanym na bazie Supabase. Główne endpointy obejmują:
- **GET/POST/PUT/DELETE /api/flashcards** - zarządzanie fiszkami
- **POST /api/generations** - generowanie fiszek z wykorzystaniem AI

Do zarządzania stanem aplikacji wykorzystane zostaną wbudowane mechanizmy React:
- Hooki dla lokalnego stanu komponentów
- React Context dla globalnego stanu aplikacji (z podziałem na konteksty tematyczne w miarę potrzeb)
- Możliwość wprowadzenia zustand w przyszłości, jeśli zarządzanie stanem stanie się bardziej złożone

### Responsywność, dostępność i bezpieczeństwo

Responsywność zostanie zaimplementowana z wykorzystaniem utility variants od Tailwind (sm, md, lg), aby zapewnić optymalne doświadczenie na różnych urządzeniach.

Bezpieczeństwo oparte będzie na JWT (wdrożenie na późniejszym etapie) w połączeniu z mechanizmami uwierzytelniania Supabase.

### Komponenty UI i optymalizacja

UI będzie bazować na gotowych komponentach z biblioteki shadcn/ui, dostosowanych za pomocą Tailwind CSS. Dla poprawy wydajności zastosowany zostanie lazy loading, szczególnie przy ładowaniu listy fiszek.

Obsługa błędów realizowana będzie poprzez inline error handling - wyświetlanie komunikatów o błędach bezpośrednio z API bez zakłócania przepływu użytkownika.

Zapisywanie fiszek będzie działać na zasadzie flagowania zatwierdzonych pozycji i zbiorczego zapisywania, co pozwoli na efektywne zarządzanie większą liczbą wygenerowanych fiszek.

## Nierozwiązane kwestie

1. Brak szczegółowych specyfikacji dotyczących walidacji przy generowaniu fiszek (wspomniano jedynie o długości tekstu i odpowiednim źródle)
2. Niewyjaśnione dokładnie funkcjonowanie modali w kontekście responsywności i dostępności
3. Brak określonych szczegółowych wymagań dotyczących dostępności (WCAG, ARIA)
4. Brak specyfikacji, które konkretnie komponenty z biblioteki shadcn/ui będą wykorzystane poza Navigation Menu
5. Brak szczegółów odnośnie zarządzania sesją użytkownika i mechanizmów odświeżania tokenu JWT
6. Niesprecyzowana struktura podziału React Context na poszczególne konteksty tematyczne (użytkownik, flashcards, UI state)