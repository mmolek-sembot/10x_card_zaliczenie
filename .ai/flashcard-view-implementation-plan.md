# Plan implementacji widoku Fiszek

## 1. Przegląd
Widok Fiszek to kluczowy element aplikacji 10xCard umożliwiający użytkownikom zarządzanie istniejącymi fiszkami. Pozwala na przeglądanie, edycję, usuwanie oraz tworzenie nowych fiszek. Widok ma formę tabeli z paginacją, filtrowaniem i sortowaniem, zapewniając intuicyjne zarządzanie biblioteką fiszek.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/flashcards` zgodnie z dokumentacją.

## 3. Struktura komponentów
```
FlashcardsLayout (Astro)
├── Header (nawigacja, informacje o użytkowniku)
└── Zawartość główna
    ├── FlashcardsList (React)
    │   ├── FilterBar
    │   │   ├── SearchInput (Shadcn/ui)
    │   │   ├── SourceFilter (Select, Shadcn/ui)
    │   │   └── SortOptions (Select, Shadcn/ui)
    │   ├── ActionBar
    │   │   └── CreateFlashcardButton (React)
    │   ├── DataTable (Shadcn/ui)
    │   │   └── FlashcardItem (React, wiersze)
    │   │       ├── EditButton
    │   │       └── DeleteFlashcardButton (React)
    │   └── Pagination (Shadcn/ui)
    ├── EditFlashcardModal (React, komponent współdzielony)
    └── DeleteConfirmDialog (AlertDialog, Shadcn/ui)
```

## 4. Szczegóły komponentów

### FlashcardsLayout (Astro)
- **Opis komponentu**: Główny layout dla widoku fiszek, zapewniający strukturę strony i integrację z resztą aplikacji.
- **Główne elementy**: Nagłówek z nawigacją, container dla zawartości, sekcja główna z komponentami React.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji (komponent statyczny).
- **Typy**: Nie wymaga specjalnych typów.
- **Propsy**: Standardowe propsy Astro.

### FlashcardsList (React)
- **Opis komponentu**: Główny interaktywny komponent wyświetlający listę fiszek z filtrowaniem, sortowaniem i paginacją.
- **Główne elementy**: FilterBar, ActionBar, DataTable, Pagination.
- **Obsługiwane interakcje**: 
  - Zmiana strony
  - Zmiana liczby elementów na stronie
  - Zastosowanie filtrów
  - Zmiana sortowania
- **Obsługiwana walidacja**: 
  - Sprawdzanie poprawności parametrów zapytania (strona, limit, źródło, sortowanie)
- **Typy**: 
  - `FlashcardsListViewModel`
  - `FlashcardsFilterViewModel`
- **Propsy**: Brak (komponent root).

### FlashcardItem (React)
- **Opis komponentu**: Reprezentuje pojedynczy wiersz w tabeli fiszek.
- **Główne elementy**: Komórki tabeli z danymi fiszki, przyciski akcji (edycja, usunięcie).
- **Obsługiwane interakcje**: 
  - Kliknięcie przycisku edycji
  - Kliknięcie przycisku usunięcia
- **Typy**: `FlashcardViewModel`
- **Propsy**: 
  - `flashcard: FlashcardViewModel`
  - `onEdit: (id: number) => void`
  - `onDelete: (id: number) => void`

### EditFlashcardModal (React)
- **Opis komponentu**: Modal z formularzem do tworzenia i edycji fiszek.
- **Główne elementy**: Dialog (Shadcn/ui), Form, InputField, TextareaField, przyciski akcji.
- **Obsługiwane interakcje**: 
  - Otwarcie/zamknięcie modalu
  - Wypełnienie formularza
  - Zatwierdzenie formularza
  - Anulowanie operacji
- **Obsługiwana walidacja**: 
  - Front: wymagane, max 200 znaków
  - Back: wymagane, max 600 znaków
- **Typy**: 
  - `CreateFlashcardViewModel`
  - `UpdateFlashcardViewModel`
- **Propsy**: 
  - `isOpen: boolean`
  - `onClose: () => void`
  - `flashcard?: FlashcardViewModel` (opcjonalne dla edycji)
  - `onSubmit: (data: CreateFlashcardViewModel | UpdateFlashcardViewModel) => Promise<void>`
  - `isLoading: boolean`

### DeleteFlashcardButton (React)
- **Opis komponentu**: Przycisk z dialogiem potwierdzenia usunięcia fiszki.
- **Główne elementy**: Button, AlertDialog (Shadcn/ui).
- **Obsługiwane interakcje**: 
  - Kliknięcie przycisku usunięcia
  - Potwierdzenie usunięcia
  - Anulowanie usunięcia
- **Typy**: Nie wymaga specjalnych typów.
- **Propsy**: 
  - `flashcardId: number`
  - `onConfirm: (id: number) => Promise<void>`
  - `isLoading: boolean`

### CreateFlashcardButton (React)
- **Opis komponentu**: Przycisk otwierający modal tworzenia nowej fiszki.
- **Główne elementy**: Button (Shadcn/ui).
- **Obsługiwane interakcje**: Kliknięcie przycisku.
- **Typy**: Nie wymaga specjalnych typów.
- **Propsy**: 
  - `onClick: () => void`

## 5. Typy

### FlashcardViewModel
```typescript
interface FlashcardViewModel {
  id: number;
  front: string;
  back: string;
  source: FlashcardSource; // 'ai-full' | 'ai-edited' | 'manual'
  createdAt: Date;
  updatedAt: Date;
}
```

### CreateFlashcardViewModel
```typescript
interface CreateFlashcardViewModel {
  front: string;
  back: string;
}
```

### UpdateFlashcardViewModel
```typescript
interface UpdateFlashcardViewModel {
  id: number;
  front?: string;
  back?: string;
}
```

### FlashcardsListViewModel
```typescript
interface FlashcardsListViewModel {
  flashcards: FlashcardViewModel[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
}
```

### FlashcardsFilterViewModel
```typescript
interface FlashcardsFilterViewModel {
  page: number;
  limit: number;
  source?: FlashcardSource;
  sort?: 'created_at' | 'updated_at' | 'id';
  order?: 'asc' | 'desc';
}
```

## 6. Zarządzanie stanem

### useFlashcards Custom Hook
Utworzymy customowy hook do zarządzania stanem fiszek, który będzie zawierał logikę komunikacji z API i operacje CRUD:

```typescript
function useFlashcards() {
  // Stan
  const [flashcards, setFlashcards] = useState<FlashcardViewModel[]>([]);
  const [pagination, setPagination] = useState<PaginationMetaDto>({
    total: 0, page: 1, limit: 20, pages: 0
  });
  const [filters, setFilters] = useState<FlashcardsFilterViewModel>({
    page: 1, limit: 20
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardViewModel | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Metody pobierania i zarządzania danymi
  const fetchFlashcards = async (filters: FlashcardsFilterViewModel) => {...}
  const createFlashcard = async (data: CreateFlashcardViewModel) => {...}
  const updateFlashcard = async (id: number, data: UpdateFlashcardViewModel) => {...}
  const deleteFlashcard = async (id: number) => {...}

  // Metody obsługi interfejsu
  const openCreateForm = () => {...}
  const openEditForm = (id: number) => {...}
  const openDeleteDialog = (id: number) => {...}
  const handlePageChange = (page: number) => {...}
  const handleLimitChange = (limit: number) => {...}
  const handleSortChange = (sort: string, order: 'asc' | 'desc') => {...}
  const handleSourceFilterChange = (source?: FlashcardSource) => {...}

  return {
    // Eksportowane stany i metody
  };
}
```

## 7. Integracja API

### Mapowanie endpointów
- **Pobieranie listy fiszek**: `GET /api/flashcards` z parametrami w query string (page, limit, source, sort, order)
- **Pobieranie pojedynczej fiszki**: `GET /api/flashcards/:id`
- **Tworzenie fiszki**: `POST /api/flashcards` z payloadem `{ flashcards: [{ front, back, source: 'manual', generation_id: null }] }`
- **Aktualizacja fiszki**: `PUT /api/flashcards/:id` z payloadem `{ front?, back? }` (co najmniej jedno pole musi być podane)
- **Usuwanie fiszki**: `DELETE /api/flashcards/:id`

### Przykładowe implementacje funkcji API

```typescript
const fetchFlashcards = async (filters: FlashcardsFilterViewModel) => {
  setIsLoading(true);
  setError(null);
  
  try {
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.source) queryParams.append('source', filters.source);
    if (filters.sort) queryParams.append('sort', filters.sort);
    if (filters.order) queryParams.append('order', filters.order);
    
    const response = await fetch(`/api/flashcards?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data: FlashcardsPaginatedResponseDto = await response.json();
    setFlashcards(data.data);
    setPagination(data.pagination);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas pobierania fiszek');
  } finally {
    setIsLoading(false);
  }
};
```

## 8. Interakcje użytkownika

1. **Przeglądanie listy fiszek**
   - Użytkownik wchodzi na stronę `/flashcards`
   - System wyświetla załadowaną tabelę z fiszkami z paginacją
   - Użytkownik może przewijać strony, zmieniać liczbę elementów na stronie
   
2. **Filtrowanie i sortowanie**
   - Użytkownik wybiera opcje filtrowania po źródle (ai-full, ai-edited, manual)
   - Użytkownik wybiera pole sortowania i kierunek (rosnąco/malejąco)
   - System odświeża listę zgodnie z wybranymi opcjami
   
3. **Tworzenie nowej fiszki**
   - Użytkownik klika przycisk "Utwórz fiszkę"
   - System wyświetla modal z formularzem
   - Użytkownik wypełnia pola front i back
   - Użytkownik klika "Zapisz"
   - System waliduje dane formularza
   - System zapisuje fiszkę i odświeża listę
   
4. **Edycja fiszki**
   - Użytkownik klika ikonę edycji przy wybranej fiszce
   - System wyświetla modal z wypełnionym formularzem
   - Użytkownik modyfikuje pola
   - Użytkownik klika "Zapisz"
   - System waliduje dane
   - System aktualizuje fiszkę i odświeża listę
   
5. **Usuwanie fiszki**
   - Użytkownik klika ikonę usunięcia przy wybranej fiszce
   - System wyświetla dialog potwierdzenia
   - Użytkownik potwierdza usunięcie
   - System usuwa fiszkę i odświeża listę

## 9. Warunki i walidacja

### Walidacja formularza tworzenia/edycji fiszki
- **Front**:
  - Pole wymagane: "Treść przedniej strony jest wymagana"
  - Maksymalna długość 200 znaków: "Treść przedniej strony nie może przekraczać 200 znaków"
- **Back**:
  - Pole wymagane: "Treść tylnej strony jest wymagana"
  - Maksymalna długość 600 znaków: "Treść tylnej strony nie może przekraczać 600 znaków"

### Walidacja parametrów filtrowania
- **Page**: Liczba całkowita > 0
- **Limit**: Liczba całkowita > 0
- **Source**: Jedna z wartości: 'ai-full', 'ai-edited', 'manual' lub undefined
- **Sort**: Jedna z wartości: 'created_at', 'updated_at', 'id' lub undefined
- **Order**: Jedna z wartości: 'asc', 'desc' lub undefined

## 10. Obsługa błędów

### Scenariusze błędów i ich obsługa

1. **Błąd pobierania listy fiszek**
   - Wyświetlenie komunikatu błędu nad tabelą
   - Przycisk ponowienia próby

2. **Błąd walidacji formularza**
   - Wyświetlenie komunikatów błędów przy odpowiednich polach
   - Zablokowanie możliwości zapisania do czasu poprawy błędów

3. **Błąd tworzenia/edycji fiszki**
   - Wyświetlenie komunikatu błędu w modalu
   - Pozostawienie formularza otwartego do korekty

4. **Błąd usuwania fiszki**
   - Wyświetlenie powiadomienia o błędzie
   - Możliwość ponowienia próby

5. **Pusta lista fiszek**
   - Wyświetlenie przyjaznego komunikatu o pustej bibliotece
   - Sugestia utworzenia pierwszej fiszki

6. **Błąd autoryzacji**
   - Przekierowanie do ekranu logowania
   - Komunikat o konieczności zalogowania się

## 11. Kroki implementacji

1. **Przygotowanie struktury plików**
   - Utworzenie katalogu `/src/pages/flashcards`
   - Utworzenie pliku `/src/pages/flashcards/index.astro`
   - Utworzenie struktury katalogów dla komponentów React

2. **Implementacja layoutu (FlashcardsLayout.astro)**
   - Utworzenie podstawowego szablonu strony
   - Dodanie nagłówka i podstawowej struktury

3. **Utworzenie typów i modeli**
   - Implementacja wszystkich typów ViewModel w `/src/components/flashcards/types.ts`

4. **Implementacja custom hook useFlashcards**
   - Utworzenie pliku `/src/components/hooks/useFlashcards.ts`
   - Implementacja logiki zarządzania stanem i komunikacji z API

5. **Implementacja komponentów UI**
   - Zbudowanie komponentu FlashcardsList
   - Dodanie komponentu DataTable z paginacją
   - Implementacja komponentu FilterBar
   - Implementacja modalu EditFlashcardModal
   - Implementacja komponentu DeleteFlashcardButton

6. **Integracja komponentów**
   - Połączenie wszystkich komponentów w widoku głównym
   - Przekazanie danych i funkcji przez hooki

7. **Stylizacja komponentów**
   - Zastosowanie styli Tailwind do wszystkich komponentów
   - Zapewnienie responsywności widoku

8. **Testowanie**
   - Sprawdzenie działania głównych funkcji CRUD
   - Testowanie przypadków brzegowych i obsługi błędów
   - Weryfikacja responsywności na różnych urządzeniach

9. **Finalizacja i optymalizacja**
   - Refaktoryzacja kodu jeśli potrzebna
   - Optymalizacja wydajności
   - Dokumentacja implementacji
