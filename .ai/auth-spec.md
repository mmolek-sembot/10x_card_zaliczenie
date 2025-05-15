# Specyfikacja techniczna modułu autentykacji

## 1. Architektura interfejsu użytkownika

### 1.1 Strony i komponenty

#### Strony (Astro)

1. **`/auth/login`** - Strona logowania
   - Formularz z polami email i hasło
   - Link do strony rejestracji i odzyskiwania hasła
   - Komunikat błędu w przypadku nieudanego logowania

2. **`/auth/register`** - Strona rejestracji
   - Formularz z polami email i hasło (z potwierdzeniem)
   - Walidacja siły hasła (min. 8 znaków, wielka litera, cyfra, znak specjalny)
   - Link do strony logowania

3. **`/auth/forgot-password`** - Strona resetowania hasła
   - Formularz z polem email
   - Instrukcje dotyczące resetowania hasła
   - Komunikat o wysłaniu linku resetującego

4. **`/auth/reset-password`** - Strona ustawiania nowego hasła
   - Formularz z nowym hasłem i potwierdzeniem
   - Komunikat o powodzeniu/niepowodzeniu zmiany hasła

5. **`/auth/verify`** - Strona weryfikacji emaila
   - Komunikat o konieczności weryfikacji adresu email
   - Przycisk do ponownego wysłania emaila weryfikacyjnego

#### Komponenty React

1. **`AuthForm`** - Generyczny komponent formularza autentykacji
   - Wspólne style i zachowania dla formularzy
   - Obsługa błędów i stanu ładowania
   - Integracja z react-hook-form do walidacji

2. **`ProtectedRoute`** - Komponent chroniący trasy wymagające autentykacji
   - Przekierowuje niezalogowanych użytkowników na stronę logowania
   - Zachowuje oryginalny URL do przekierowania po zalogowaniu

3. **`AuthProvider`** - Kontekst autentykacji
   - Przechowuje stan użytkownika
   - Udostępnia metody do logowania, rejestracji, wylogowywania
   - Synchronizuje stan z Supabase Auth

4. **`UserMenu`** - Menu użytkownika w nagłówku
   - Wyświetla email użytkownika
   - Opcja wylogowania
   - Link do profilu (jeśli potrzebny)

### 1.2 Przepływ danych i stan

- **Stan autentykacji** jest zarządzany przez kontekst React (`AuthProvider`)
- Po odświeżeniu strony stan jest przywracany z sesji Supabase
- Komunikacja z backendem odbywa się przez klienta Supabase
- Formularze korzystają z `react-hook-form` do walidacji i obsługi błędów

### 1.3 Walidacja i komunikaty błędów

- **Email**: Wymagany, poprawny format
- **Hasło**:
  - Minimum 8 znaków
  - Co najmniej 1 wielka litera
  - Co najmniej 1 cyfra
  - Co najmniej 1 znak specjalny
- Komunikaty błędów są wyświetlane w formie toastów (używając istniejącego `ToastProvider`)
- Błędy z Supabase są tłumaczone na przyjazne komunikaty

## 2. Logika backendowa

### 2.1 Endpointy API

1. **`POST /api/auth/register`** - Rejestracja nowego użytkownika
   - Walidacja danych wejściowych (email, hasło)
   - Sprawdzenie czy użytkownik już istnieje
   - Utworzenie konta w Supabase Auth
   - Wysłanie emaila weryfikacyjnego

2. **`POST /api/auth/login`** - Logowanie użytkownika
   - Weryfikacja danych logowania
   - Ustanowienie sesji
   - Przekierowanie na stronę główną

3. **`POST /api/auth/logout`** - Wylogowanie użytkownika
   - Zakończenie sesji
   - Przekierowanie na stronę logowania

4. **`POST /api/auth/forgot-password`** - Żądanie resetu hasła
   - Wysłanie linku resetującego hasło

5. **`POST /api/auth/reset-password`** - Ustawienie nowego hasła
   - Weryfikacja tokenu resetującego
   - Aktualizacja hasła

### 2.2 Modele danych

```typescript
// types/auth.ts
type User = {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
};

type AuthResponse = {
  user: User | null;
  error: Error | null;
  session: Session | null;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterData = LoginCredentials & {
  password_confirmation: string;
};

type ForgotPasswordData = {
  email: string;
};

type ResetPasswordData = {
  password: string;
  password_confirmation: string;
  token: string;
};
```

### 2.3 Middleware autoryzacji

1. **`authMiddleware`** - Chroni trasy wymagające autoryzacji
   - Sprawdza czy użytkownik jest zalogowany
   - Weryfikuje token JWT
   - Dołącza dane użytkownika do kontekstu

2. **`guestMiddleware`** - Chroni trasy dostępne tylko dla niezalogowanych użytkowników
   - Przekierowuje zalogowanych użytkowników na stronę główną

## 3. System autentykacji

### 3.1 Integracja z Supabase Auth

1. **Konfiguracja klienta Supabase**
   - Klient jest już skonfigurowany w `supabase.client.ts`
   - Wykorzystujemy `@supabase/supabase-js`

2. **Metody autentykacji**
   - Rejestracja z emailem i hasłem
   - Logowanie z emailem i hasłem
   - Wylogowanie
   - Reset hasła
   - Weryfikacja emaila

3. **Obsługa sesji**
   - Automatyczne odświeżanie tokenów
   - Synchronizacja stanu między zakładkami
   - Obsługa wygaśnięcia sesji

### 3.2 Bezpieczeństwo

1. **Ochrona przed atakami**
   - CSRF: Wbudowana ochrona w Supabase
   - XSS: Sanityzacja danych wejściowych
   - CORS: Konfiguracja w Supabase

2. **Polityka haseł**
   - Silna walidacja po stronie klienta i serwera
   - Hasła są haszowane przed zapisem (obsługa przez Supabase)
   - Wymagana weryfikacja emaila przed pierwszym logowaniem

3. **Ochrona tras**
   - Wszystkie trasy wymagające autoryzacji są chronione przez `ProtectedRoute`
   - Dostęp do API jest weryfikowany przez middleware

## 4. Integracja z istniejącym kodem

### 4.1 Modyfikacje istniejących komponentów

1. **`Navigation`**
   - Warunkowe wyświetlanie przycisków logowania/wylogowania
   - Wyświetlanie emaila zalogowanego użytkownika

2. **Layout**
   - Dodanie `AuthProvider` do głównego layoutu
   - Ewentualne dostosowanie stylów dla formularzy autentykacji

### 4.2 Konfiguracja środowiska

Wymagane zmienne środowiskowe (`.env`):

```
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key

# Dla środowiska produkcyjnego
PRODUCTION_URL=your-production-url
```

## 5. Testowanie

1. **Testy jednostkowe**
   - Komponenty React (React Testing Library)
   - Hooks i konteksty
   - Funkcje pomocnicze

2. **Testy integracyjne**
   - Przepływy autentykacji
   - Chronione trasy
   - Formularze i walidacja

3. **Testy ręczne**
   - Przepływy użytkownika
   - Obsługa błędów
   - Responsywność

## 6. Wdrożenie

1. **Migracje bazy danych**
   - Tabele użytkowników są zarządzane przez Supabase Auth
   - Ewentualne dodatkowe tabele będą wymagały migracji

2. **Weryfikacja konfiguracji**
   - Upewnij się, że adresy URL przekierowań są poprawnie skonfigurowane w ustawieniach Supabase
   - Sprawdź ustawienia CORS w Supabase
   - Zweryfikuj ustawienia emaila (SMTP) w Supabase

## 7. Monitorowanie i logowanie

1. **Logi błędów**
   - Błędy autentykacji są logowane na konsoli
   - Możliwość integracji z usługą monitorującą (np. Sentry)

2. **Analityka**
   - Śledzenie zdarzeń autentykacji
   - Anonimowe statystyki użycia

## 8. Dostępność (a11y)

1. Formularze są odpowiednio oznakowane etykietami ARIA
2. Komunikaty błędów są dostępne dla czytników ekranu
3. Nawigacja klawiaturą jest w pełni obsługiwana
4. Kontrast kolorów spełnia wytyczne WCAG 2.1
