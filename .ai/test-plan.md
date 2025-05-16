# Plan Testów dla Aplikacji 10xCard

## 1. Wprowadzenie i cele testowania

Aplikacja **10xCard** to narzędzie do szybkiego tworzenia fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji. Głównym celem testowania jest zapewnienie poprawnego działania wszystkich funkcjonalności, bezpieczeństwa danych użytkowników oraz wysokiej jakości doświadczenia użytkownika.

**Cele szczegółowe testowania:**
- Weryfikacja poprawnego działania generowania fiszek z wykorzystaniem AI
- Sprawdzenie integralności danych podczas zapisywania i odczytywania fiszek
- Potwierdzenie poprawności procesu autentykacji i autoryzacji
- Weryfikacja zgodności interfejsu użytkownika z projektem i zasadami dostępności
- Zapewnienie niezawodności i wydajności aplikacji przy obciążeniu

## 2. Zakres testów

### 2.1. Elementy podlegające testowaniu
- Komponenty interfejsu użytkownika
- Endpointy API
- Proces autentykacji i autoryzacji użytkowników
- Integracja z Supabase
- Integracja z usługą OpenRouter.ai
- Workflow generowania fiszek z AI
- Zarządzanie fiszkami (tworzenie, edycja, usuwanie, przeglądanie)

### 2.2. Elementy niepodlegające testowaniu
- Wewnętrzne działanie usług zewnętrznych (Supabase, OpenRouter.ai)
- Skalowanie i wydajność na poziomie infrastruktury DigitalOcean

## 3. Typy testów

### 3.1. Testy jednostkowe
- **Komponenty React:** Testowanie pojedynczych komponentów (np. `FlashcardPreview.tsx`, `GenerationForm.tsx`)
- **Hooki React:** Testowanie logiki zarządzania stanem (np. `useGeneratorState.ts`)
- **Usługi:** Testowanie logiki biznesowej w katalogach `lib/services`
- **Walidatory:** Testowanie schematów Zod (np. `flashcardsQuerySchema`)

### 3.2. Testy integracyjne
- **Integracja front-end / back-end:** Interakcja komponentów React z API Astro
- **Integracja z bazą danych:** Poprawność zapisywania i pobierania danych z Supabase
- **Integracja z AI:** Komunikacja z OpenRouter.ai i obsługa odpowiedzi

### 3.3. Testy end-to-end
- **Pełne scenariusze użytkownika:** Od rejestracji przez generowanie fiszek do zapisania ich w systemie
- **Obsługa błędów:** Zachowanie systemu przy braku połączenia z AI lub bazą danych

### 3.4. Testy wydajnościowe
- **Generowanie dużej liczby fiszek:** Obsługa długich tekstów źródłowych
- **Równoczesne zapytania:** Zachowanie systemu przy wielu równoczesnych żądaniach

### 3.5. Testy bezpieczeństwa
- **Autentykacja:** Weryfikacja zabezpieczeń procesu logowania
- **Autoryzacja:** Sprawdzenie dostępu do zasobów tylko dla uprawnionych użytkowników
- **Walidacja danych wejściowych:** Ochrona przed atakami typu injection

### 3.6. Testy dostępności
- **Zgodność z WCAG 2.1:** Sprawdzenie zgodności z wytycznymi dostępności
- **Testy czytników ekranowych:** Weryfikacja poprawnego odczytu przez technologie asystujące

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Proces rejestracji i logowania
1. **Rejestracja nowego użytkownika**
   - Weryfikacja poprawnych danych
   - Weryfikacja błędów przy niepoprawnych danych
   - Sprawdzenie wymagań co do hasła
   - Weryfikacja unikalności emaila

2. **Logowanie użytkownika**
   - Logowanie z poprawnymi danymi
   - Obsługa niepoprawnych danych logowania
   - Funkcjonalność "Zapomniałem hasła"
   - Persystencja sesji użytkownika

### 4.2. Generowanie fiszek z AI
1. **Generowanie fiszek z tekstu źródłowego**
   - Generacja z krótkiego tekstu (1000-3000 znaków)
   - Generacja z długiego tekstu (5000-10000 znaków)
   - Obsługa różnych języków w tekście źródłowym
   - Zachowanie podczas przerwanego połączenia z AI

2. **Edycja wygenerowanych fiszek**
   - Modyfikacja przodu i tyłu fiszki
   - Usuwanie fiszek z propozycji
   - Dodawanie własnych fiszek do wygenerowanych
   - Weryfikacja limitów długości tekstu (200 znaków front, 600 znaków back)

3. **Zapisywanie wygenerowanych fiszek**
   - Poprawność zapisania wszystkich fiszek
   - Walidacja przed zapisem
   - Obsługa błędów podczas zapisu
   - Przekierowanie po zapisie

### 4.3. Zarządzanie fiszkami
1. **Przeglądanie zapisanych fiszek**
   - Paginacja wyników
   - Filtrowanie według źródła (ai-full, ai-edited, manual)
   - Sortowanie według różnych kryteriów
   - Wyświetlanie szczegółów fiszki

2. **Edycja istniejących fiszek**
   - Modyfikacja treści istniejącej fiszki
   - Walidacja zmian
   - Anulowanie edycji
   - Zachowanie historii zmian

3. **Usuwanie fiszek**
   - Usuwanie pojedynczej fiszki
   - Usuwanie wielu fiszek naraz
   - Potwierdzenie przed usunięciem
   - Możliwość przywrócenia usuniętych fiszek

### 4.4. Integracja z zewnętrznymi systemami
1. **Integracja z Supabase**
   - Autoryzacja za pomocą Supabase Auth
   - Operacje CRUD na tabelach flashcards i generations
   - Obsługa błędów połączenia
   - Zachowanie podczas problemów z bazą danych

2. **Integracja z OpenRouter.ai**
   - Poprawność komunikacji z modelami AI
   - Przetwarzanie odpowiedzi z różnych modeli
   - Obsługa limitów API i kosztów
   - Mechanizmy retry w przypadku błędów

## 5. Środowisko testowe

### 5.1. Środowiska
- **Lokalne środowisko deweloperskie**
  - Node.js 18+ 
  - Dostęp do lokalnych instancji Supabase lub emulatorów
  - Klucze API dla OpenRouter.ai w trybie testowym

- **Środowisko testowe (staging)**
  - Deweloperska instancja Supabase
  - Testowe klucze API
  - Wdrożenie na osobnym kontenerze DigitalOcean

- **Środowisko produkcyjne**
  - Produkcyjna baza danych Supabase
  - Produkcyjne klucze API z limitami
  - Wdrożenie na docelowym kontenerze DigitalOcean

### 5.2. Konfiguracja testowa
- Przeglądarki: Chrome, Firefox, Safari, Edge
- Urządzenia mobilne: iPhone, iPad, urządzenia Android
- Rozdzielczości ekranu: 375px, 768px, 1024px, 1440px, 1920px
- Dostęp do narzędzi deweloperskich przeglądarek
- Mierzenie wydajności i monitorowanie błędów

## 6. Narzędzia do testowania

### 6.1. Narzędzia do testów jednostkowych i integracyjnych
- Vitest
- React Testing Library
- Jest
- TypeScript Compiler (dla weryfikacji typów)

### 6.2. Narzędzia do testów end-to-end
- Playwright
- Cypress

### 6.3. Narzędzia do testów wydajnościowych
- Lighthouse
- Chrome DevTools Performance
- Web Vitals

### 6.4. Narzędzia do testów bezpieczeństwa
- OWASP ZAP
- Burp Suite (wersja community)
- SonarQube

### 6.5. Narzędzia do testów dostępności
- Axe
- Lighthouse Accessibility
- Emulatory technologii asystujących (VoiceOver, NVDA)

## 7. Harmonogram testów

### 7.1. Testy ciągłe
- Testy jednostkowe podczas każdego PR
- Podstawowe testy integracyjne podczas każdego PR
- Statyczna analiza kodu (ESLint, TypeScript)

### 7.2. Testy cykliczne
- Testy end-to-end - raz w tygodniu
- Testy wydajnościowe - raz na dwa tygodnie
- Testy bezpieczeństwa - raz w miesiącu
- Testy dostępności - raz na dwa tygodnie

### 7.3. Testy wdrożeniowe
- Testy regresji przed każdym wdrożeniem produkcyjnym
- Testy smoke po każdym wdrożeniu
- Testy A/B dla nowych funkcjonalności

## 8. Kryteria akceptacji testów

### 8.1. Kryteria ogólne
- 0 błędów krytycznych i wysokiego ryzyka
- Pokrycie kodu testami jednostkowymi minimum 80%
- Wszystkie najważniejsze scenariusze użytkownika przechodzą testy end-to-end
- Czas odpowiedzi API poniżej 500ms dla 95% zapytań
- Aplikacja działa poprawnie na wszystkich wspieranych przeglądarkach

### 8.2. Kryteria funkcjonalne
- Generowanie fiszek z AI działa z dokładnością minimum 90%
- Proces rejestracji i logowania działa bezbłędnie
- Zapisane fiszki są poprawnie przechowywane i wyświetlane
- Paginacja i filtrowanie działają zgodnie ze specyfikacją
- Walidacja danych działa poprawnie dla wszystkich formularzy

### 8.3. Kryteria wydajnościowe
- Czas pierwszego renderowania (FCP) poniżej 1.5s
- Largest Contentful Paint (LCP) poniżej 2.5s
- First Input Delay (FID) poniżej 100ms
- Cumulative Layout Shift (CLS) poniżej 0.1

### 8.4. Kryteria bezpieczeństwa
- Brak podatności krytycznych i o wysokim ryzyku
- Wszystkie dane osobowe są odpowiednio chronione
- Sesje użytkowników wygasają po określonym czasie
- Hasła są przechowywane zgodnie z najlepszymi praktykami

## 9. Role i odpowiedzialności w procesie testowania

### 9.1. Test Manager
- Nadzór nad całym procesem testowania
- Planowanie i koordynacja działań testowych
- Raportowanie do zespołu zarządzającego

### 9.2. Inżynier QA
- Projektowanie i wykonywanie testów manualnych
- Tworzenie i utrzymanie testów automatycznych
- Identyfikacja i raportowanie błędów
- Weryfikacja poprawek

### 9.3. Deweloper
- Tworzenie i wykonywanie testów jednostkowych
- Weryfikacja problemów zgłoszonych przez QA
- Poprawianie znalezionych błędów
- Wsparcie w tworzeniu testów integracyjnych

### 9.4. DevOps Engineer
- Konfiguracja środowisk testowych
- Monitoring wydajności aplikacji
- Wsparcie w testach wydajnościowych
- Automatyzacja procesów testowych w CI/CD

### 9.5. UX Designer
- Weryfikacja zgodności implementacji z projektem
- Udział w testach użyteczności
- Konsultacje w zakresie dostępności
- Analiza ścieżek użytkownika

## 10. Procedury raportowania błędów

### 10.1. Klasyfikacja błędów
- **Krytyczne:** Uniemożliwiają działanie głównych funkcjonalności, wymagają natychmiastowej reakcji
- **Wysokie:** Znacząco utrudniają korzystanie z aplikacji, wymagają szybkiej reakcji
- **Średnie:** Powodują problemy, ale można je obejść, mogą poczekać na kolejną iterację
- **Niskie:** Drobne problemy, głównie kosmetyczne, niewymagające pilnej naprawy

### 10.2. Format zgłaszania błędów
- **Tytuł:** Krótki, opisowy tytuł problemu
- **Środowisko:** Przeglądarka, urządzenie, wersja aplikacji
- **Kroki reprodukcji:** Dokładny opis kroków prowadzących do błędu
- **Aktualny rezultat:** Co się dzieje obecnie
- **Oczekiwany rezultat:** Co powinno się dziać
- **Dodatkowe informacje:** Zrzuty ekranu, logi, nagrania
- **Priorytet i dotkliwość:** Ocena wagi błędu

### 10.3. Proces zarządzania błędami
1. Zgłoszenie błędu przez testera
2. Triage błędu przez zespół deweloperski
3. Przypisanie priorytetu i osoby odpowiedzialnej
4. Naprawienie błędu
5. Weryfikacja poprawki przez QA
6. Zamknięcie zgłoszenia

### 10.4. Narzędzia do zarządzania błędami
- GitHub Issues
- Jira
- Linear

## 11. Dokumentacja testowa

### 11.1. Dokumenty do przygotowania
- Szczegółowe przypadki testowe
- Raporty z wykonanych testów
- Raporty błędów
- Metryki i statystyki testów
- Podsumowania po każdej iteracji testowej

### 11.2. Szablony dokumentów
- Szablon raportu z testów
- Szablon przypadku testowego
- Szablon raportu błędu
- Szablon raportu z testów wydajnościowych
- Szablon raportu z testów bezpieczeństwa

## 12. Strategia automatyzacji testów

### 12.1. Obszary do automatyzacji
- Testy jednostkowe (priorytet wysoki)
- Testy API (priorytet wysoki)
- Podstawowe scenariusze e2e (priorytet średni)
- Testy regresji (priorytet wysoki)

### 12.2. Podejście do automatyzacji
- Automatyzacja od początku dla nowych funkcjonalności
- Ciągła integracja z pipeline'ami CI/CD
- Automatyczne raportowanie wyników
- Regularna konserwacja testów automatycznych
