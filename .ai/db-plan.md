# 10xCard — Schemat bazy danych (MVP)  
*wersja z Supabase Auth*

> **Uwaga**  
> Tabela `auth.users` jest w pełni zarządzana przez Supabase Auth  
> (PK = UUID `id`). Poniższy schemat jedynie **odwołuje się** do niej
> przy pomocy kluczy obcych; nie należy jej tworzyć ani modyfikować
> w migracjach aplikacyjnych.

---

## 1. Tabele

### users

This table is managed by Supabase Auth.

### generations
| Kolumna            | Typ danych | Ograniczenia                                                                                             |
|--------------------|-----------|----------------------------------------------------------------------------------------------------------|
| id                 | SERIAL    | PRIMARY KEY                                                                                              |
| user_id            | UUID      | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE                                                     |
| model              | TEXT      | NOT NULL                                                                                                |
| generated_count    | INTEGER   | NOT NULL DEFAULT 0                                                          |
| accepted_count     | INTEGER   | NOT NULL DEFAULT 0 CHECK (accepted_count <= generated_count)                      |
| source_text_hash   | CHAR(64)  | NOT NULL                                                                                                |
| source_text_length | INTEGER   | NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)                                              |
| duration           | INTEGER   | NOT NULL DEFAULT 0                                                                                        |
| created_at         | TIMESTAMPTZ | NOT NULL DEFAULT now()                                                                                 |
| updated_at         | TIMESTAMPTZ | NOT NULL DEFAULT now()                                                                                 |

---

### flashcards
| Kolumna        | Typ danych | Ograniczenia                                                                                              |
|----------------|-----------|-----------------------------------------------------------------------------------------------------------|
| id             | SERIAL    | PRIMARY KEY                                                                                               |
| user_id        | UUID      | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE                                                      |
| generation_id  | INTEGER   | REFERENCES generations(id) ON DELETE SET NULL                                                             |
| front          | VARCHAR(200) | NOT NULL                                                                                               |
| back           | VARCHAR(600) | NOT NULL                                                                                               |
| source         | VARCHAR(16)  | NOT NULL CHECK (source IN ('ai-full','ai-edited','manual'))                                             |
| created_at     | TIMESTAMPTZ  | NOT NULL DEFAULT now()                                                                                 |
| updated_at     | TIMESTAMPTZ  | NOT NULL DEFAULT now()                                                                                 |

---

### generation_error_logs
| Kolumna            | Typ danych | Ograniczenia                                                                                             |
|--------------------|-----------|-----------------------------------------------------------------------------------------------------------|
| id                 | SERIAL    | PRIMARY KEY                                                                                               |
| generation_id      | INTEGER   | NOT NULL REFERENCES generations(id) ON DELETE CASCADE                                                     |
| user_id            | UUID      | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE                                                      |
| model              | TEXT      | NOT NULL                                                                                                  |
| error_message      | TEXT      | NOT NULL                                                                                                  |
| error_code         | VARCHAR(100) | NOT NULL                                                                                               |
| source_text_hash   | CHAR(64)  | NOT NULL                                                                                                  |
| source_text_length | INTEGER   | NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)                                               |
| timestamp          | TIMESTAMPTZ | NOT NULL DEFAULT now()                                                                                  |

---

## 2. Relacje

| Relacja                                 | Kardynalność | Opis                                          |
|-----------------------------------------|--------------|-----------------------------------------------|
| **auth.users** → generations            | 1 : N        | Użytkownik ma wiele generacji                 |
| **auth.users** → flashcards             | 1 : N        | Użytkownik ma wiele fiszek                    |
| **auth.users** → generation_error_logs  | 1 : N        | Użytkownik ma wiele logów błędów              |
| generations → flashcards                | 1 : N        | Jedna generacja może stworzyć wiele fiszek    |

---

## 3. Indeksy

```sql
-- klucze główne/obce indeksują się automatycznie
CREATE INDEX idx_generations_user_id      ON generations(user_id);

CREATE INDEX idx_flashcards_user_id       ON flashcards(user_id);
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);

CREATE INDEX idx_error_logs_user_id       ON generation_error_logs(user_id);

---

## 4. Zasady PostgreSQL (RLS – row level security)

-- włącz RLS
ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards              ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs   ENABLE ROW LEVEL SECURITY;

-- użytkownik widzi tylko własny rekord w tabeli users
CREATE POLICY p_users_owner
    ON users
    USING (id = auth.uid());

-- Flashcards
CREATE POLICY p_flashcards_owner
    ON flashcards
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Generations
CREATE POLICY p_generations_owner
    ON generations
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Generation error logs
CREATE POLICY p_error_logs_owner
    ON generation_error_logs
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());