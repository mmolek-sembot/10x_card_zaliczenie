flowchart TD
    subgraph "Przeglądarka"
        A[Użytkownik] -->|1. Wprowadza dane| B[Strona Logowania /auth/login]
        A -->|2. Klika rejestrację| C[Strona Rejestracji /auth/register]
        A -->|3. Zapomniałem hasła| D[Strona Resetu Hasła /auth/forgot-password]
        A -->|4. Weryfikacja emaila| E[Strona Weryfikacji /auth/verify]
    end

    subgraph "Aplikacja Frontend"
        B -->|5. Wysyła dane| F[Komponent AuthForm]
        C -->|5. Wysyła dane| F
        D -->|5. Wysyła email| F
        E -->|5. Wysyła token| F

        F -->|6. Walidacja| G[react-hook-form]
        G -->|7. Wywołanie API| H[Supabase Client]
    end

    subgraph "Backend (Supabase)"
        H -->|8. Autentykacja| I[Supabase Auth]
        I -->|9. Weryfikacja| J[Baza Danych użytkowników]
        I -->|10. Wysyła email| K[Serwer Email]
        
        J -->|11. Odpowiedź| I
        K -->|12. Link weryfikacyjny| A
    end

    subgraph "Stan Aplikacji"
        L[AuthProvider] -->|13. Zarządza stanem| M[Kontekst React]
        M -->|14. Aktualizacja UI| N[Komponenty]
    end

    %% Stylizacja
    classDef page fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    classDef component fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px
    classDef state fill:#fff3e0,stroke:#f57c00,stroke-width:2px

    class B,C,D,E page
    class F,G,H component
    class I,J,K backend
    class L,M state

    %% Etykiety
    linkStyle 0,1,2,3 stroke:#333,stroke-width:1px,color:red
    linkStyle 4,5,6,7 stroke:#333,stroke-width:1px,color:blue
    linkStyle 8,9,10,11,12 stroke:#333,stroke-width:1px,color:green
    linkStyle 13,14 stroke:#333,stroke-width:1px,color:orange