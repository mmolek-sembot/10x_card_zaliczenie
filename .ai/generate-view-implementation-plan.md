# Plan implementacji widoku Generowanie Fiszek

## 1. Przegląd
Widok "Generowanie Fiszek" umożliwia użytkownikom wprowadzanie tekstu źródłowego, który zostanie przetworzony przez AI w celu wygenerowania propozycji fiszek edukacyjnych. Użytkownicy mogą przeglądać, edytować, akceptować lub odrzucać wygenerowane propozycje przed zapisaniem ich do swojej biblioteki fiszek.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką: `/flashcards/generate`

## 3. Struktura komponentów
Jako starszy programista frontendu Twoim zadaniem jest stworzenie szczegółowego planu wdrożenia nowego widoku w aplikacji internetowej. Plan ten powinien być kompleksowy i wystarczająco jasny dla innego programisty frontendowego, aby mógł poprawnie i wydajnie wdrożyć widok.

GeneratorLayout (Astro)
└── GeneratorPage (React)
├── GenerationForm
│ ├── TextInput
│ │ └── Textarea (Shadcn/ui)
│ └── GenerationOptions
│ └── Button (Shadcn/ui)
├── GenerationResults
│ ├── FlashcardsList
│ │ └── FlashcardPreview (dla każdej propozycji)
│ │ ├── Card (Shadcn/ui)
│ │ ├── EditableTextarea (custom)
│ │ └── ActionButtons
│ └── FlashcardsSummary
└── Toast (Shadcn/ui, dla powiadomień)


## 4. Szczegóły komponentów

### GeneratorLayout (Astro)
- Opis komponentu: Główny layout Astro definiujący strukturę strony generatora
- Główne elementy: Nagłówek, stopka, kontener na zawartość komponentu React
- Obsługiwane interakcje: Brak (komponenty statyczny)
- Propsy: Brak

```astro
---
import Layout from '../../layouts/Layout.astro';
---

<Layout title="Generowanie Fiszek - 10xCard">
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Generator Fiszek</h1>
    <div class="generator-container">
      <div id="generator-root"></div>
    </div>
  </main>
</Layout>

<script>
  import { createRoot } from 'react-dom/client';
  import { GeneratorPage } from '../../components/Generator/GeneratorPage';
  
  const container = document.getElementById('generator-root');
  if (container) {
    const root = createRoot(container);
    root.render(<GeneratorPage client:load />);
  }
</script>
```

### GeneratorPage (React)
- Opis komponentu: Główny komponent React zarządzający całym procesem generowania fiszek
- Główne elementy: Formularz generowania, wyniki generowania, powiadomienia
- Obsługiwane interakcje: Zarządzanie globalnym stanem procesu generowania
- Typy: GeneratorViewModel, GenerationState
- Propsy: Brak

### GenerationForm
- Opis komponentu: Formularz do wprowadzania tekstu źródłowego i opcji generowania
- Główne elementy: TextInput, GenerationOptions, przycisk "Generuj"
- Obsługiwane interakcje: 
  - Wprowadzanie tekstu źródłowego (1000-10000 znaków)
  - Zlecenie generowania fiszek
- Obsługiwana walidacja: 
  - Długość tekstu (min. 1000, maks. 10000 znaków)
- Typy: GenerationFormState
- Propsy: 
  - onGenerate: (text: string) => Promise<void>
  - isGenerating: boolean

### TextInput
- Opis komponentu: Pole tekstowe z licznikiem znaków do wprowadzania tekstu źródłowego
- Główne elementy: Textarea (Shadcn/ui), licznik znaków
- Obsługiwane interakcje: Wprowadzanie i edycja tekstu
- Obsługiwana walidacja: 
  - Długość tekstu (min. 1000, maks. 10000 znaków)
  - Wyświetlanie licznika znaków z kolorystyką (czerwony gdy poza zakresem)
- Typy: TextInputProps
- Propsy: 
  - value: string
  - onChange: (value: string) => void
  - minLength: number
  - maxLength: number
  - disabled: boolean

### GenerationOptions
- Opis komponentu: Panel opcji generowania i przycisk "Generuj"
- Główne elementy: Button (Shadcn/ui)
- Obsługiwane interakcje: Kliknięcie przycisku "Generuj"
- Obsługiwana walidacja: Dezaktywacja przycisku gdy tekst nie spełnia wymagań
- Propsy: 
  - onGenerate: () => void
  - isGenerating: boolean
  - isValid: boolean

### GenerationResults
- Opis komponentu: Kontener wyświetlający wyniki generowania
- Główne elementy: FlashcardsList, FlashcardsSummary
- Obsługiwane interakcje: Zarządzanie stanem wyników
- Typy: GenerationResultsViewModel
- Propsy: 
  - generationId: number | null
  - flashcards: FlashcardProposalViewModel[]
  - onSaveAccepted: () => Promise<void>
  - isLoading: boolean

### FlashcardsList
- Opis komponentu: Lista propozycji fiszek z możliwością edycji
- Główne elementy: FlashcardPreview (dla każdej propozycji)
- Obsługiwane interakcje: Renderowanie listy fiszek i przekazywanie akcji
- Propsy: 
  - flashcards: FlashcardProposalViewModel[]
  - onUpdate: (id: number, data: FlashcardUpdateData) => void
  - onAccept: (id: number) => void
  - onReject: (id: number) => void

### FlashcardPreview
- Opis komponentu: Karta pojedynczej propozycji fiszki z możliwością edycji
- Główne elementy: Card (Shadcn/ui), EditableTextarea, ActionButtons
- Obsługiwane interakcje: 
  - Edycja treści przodu i tyłu fiszki
  - Akceptacja lub odrzucenie fiszki
- Obsługiwana walidacja: 
  - Niepuste pola front/back
  - Długość tekstu przód (maks. 200 znaków) i tył (maks. 600 znaków)
- Typy: FlashcardPreviewProps
- Propsy: 
  - flashcard: FlashcardProposalViewModel
  - onUpdate: (data: FlashcardUpdateData) => void
  - onAccept: () => void
  - onReject: () => void

### EditableTextarea
- Opis komponentu: Edytowalne pole tekstowe z walidacją
- Główne elementy: Textarea (Shadcn/ui)
- Obsługiwane interakcje: Edycja tekstu
- Obsługiwana walidacja: Długość tekstu, wymagane pole
- Propsy: 
  - value: string
  - onChange: (value: string) => void
  - maxLength: number
  - placeholder: string
  - label: string
  - error?: string

### FlashcardsSummary
- Opis komponentu: Podsumowanie procesu generowania z przyciskiem zapisu
- Główne elementy: Button (Shadcn/ui), statystyki akceptacji/odrzucenia
- Obsługiwane interakcje: Zapisanie zaakceptowanych fiszek
- Propsy: 
  - totalCount: number
  - acceptedCount: number
  - rejectedCount: number
  - onSave: () => Promise<void>
  - isLoading: boolean

## 5. Typy

### GeneratorViewModel
```typescript
interface GeneratorViewModel {
  state: GenerationState;
  sourceText: string;
  generationId: number | null;
  flashcards: FlashcardProposalViewModel[];
  isGenerating: boolean;
  isSaving: boolean;
  error: string | null;
}
```

### GenerationState
```typescript
type GenerationState = 'input' | 'generating' | 'review' | 'saving' | 'complete';
```

### FlashcardProposalViewModel
```typescript
interface FlashcardProposalViewModel {
  id: number;             // Lokalny identyfikator (nie z bazy)
  front: string;
  back: string;
  source: FlashcardSource;
  status: FlashcardStatus;
  errors: {
    front?: string;
    back?: string;
  };
}
```

### FlashcardStatus
```typescript
type FlashcardStatus = 'pending' | 'accepted' | 'rejected' | 'edited';
```

### FlashcardUpdateData
```typescript
interface FlashcardUpdateData {
  front?: string;
  back?: string;
}
```

### GenerationFormState
```typescript
interface GenerationFormState {
  text: string;
  isValid: boolean;
  errors: {
    text?: string;
  };
}
```

### TextInputProps
```typescript
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  minLength: number;
  maxLength: number;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}
```

### SaveFlashcardsPayload
```typescript
interface SaveFlashcardsPayload {
  flashcards: CreateFlashcardInputDto[];
}
```

## 6. Zarządzanie stanem

### useGeneratorState
Customowy hook zarządzający całym procesem generacji fiszek:

```typescript
const useGeneratorState = () => {
  const [state, setState] = useState<GenerationState>('input');
  const [sourceText, setSourceText] = useState<string>('');
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardProposalViewModel[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Walidacja tekstu źródłowego
  const isTextValid = useMemo(() => {
    return sourceText.length >= 1000 && sourceText.length <= 10000;
  }, [sourceText]);

  // Generowanie fiszek
  const generateFlashcards = async () => {
    if (!isTextValid) return;
    
    setIsGenerating(true);
    setState('generating');
    setError(null);
    
    try {
      // Wywołanie API
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_text: sourceText })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd generowania fiszek');
      }
      
      const data = await response.json();
      setGenerationId(data.generation_id);
      
      // Przekształcenie propozycji na model widoku
      const viewModels = data.flashcards_proposal.map((card, index) => ({
        id: index + 1,
        front: card.front,
        back: card.back,
        source: card.source,
        status: 'pending' as FlashcardStatus,
        errors: {}
      }));
      
      setFlashcards(viewModels);
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
      setState('input');
    } finally {
      setIsGenerating(false);
    }
  };

  // Aktualizacja stanu fiszki
  const updateFlashcard = (id: number, data: FlashcardUpdateData) => {
    setFlashcards(currentCards => 
      currentCards.map(card => 
        card.id === id 
          ? { 
              ...card, 
              ...data, 
              status: card.status === 'pending' ? 'edited' : card.status,
              source: 'ai-edited' as FlashcardSource,
              errors: validateFlashcard(data.front || card.front, data.back || card.back)
            } 
          : card
      )
    );
  };

  // Walidacja pojedynczej fiszki
  const validateFlashcard = (front: string, back: string) => {
    const errors: {front?: string, back?: string} = {};
    
    if (!front.trim()) errors.front = 'Treść przodu jest wymagana';
    else if (front.length > 200) errors.front = 'Treść przodu nie może przekraczać 200 znaków';
    
    if (!back.trim()) errors.back = 'Treść tyłu jest wymagana';
    else if (back.length > 600) errors.back = 'Treść tyłu nie może przekraczać 600 znaków';
    
    return errors;
  };

  // Akceptacja fiszki
  const acceptFlashcard = (id: number) => {
    setFlashcards(currentCards => 
      currentCards.map(card => 
        card.id === id ? { ...card, status: 'accepted' } : card
      )
    );
  };

  // Odrzucenie fiszki
  const rejectFlashcard = (id: number) => {
    setFlashcards(currentCards => 
      currentCards.map(card => 
        card.id === id ? { ...card, status: 'rejected' } : card
      )
    );
  };

  // Zapisanie zaakceptowanych fiszek
  const saveAcceptedFlashcards = async () => {
    const acceptedCards = flashcards.filter(card => card.status === 'accepted' || card.status === 'edited');
    
    if (acceptedCards.length === 0) {
      setError('Brak fiszek do zapisania');
      return;
    }
    
    // Walidacja wszystkich fiszek przed zapisem
    const hasErrors = acceptedCards.some(card => Object.keys(card.errors).length > 0);
    if (hasErrors) {
      setError('Nie można zapisać fiszek z błędami');
      return;
    }
    
    setIsSaving(true);
    setState('saving');
    setError(null);
    
    try {
      // Przygotowanie danych do zapisu
      const payload: SaveFlashcardsPayload = {
        flashcards: acceptedCards.map(card => ({
          front: card.front,
          back: card.back,
          source: card.status === 'edited' ? 'ai-edited' : 'ai-full',
          generation_id: generationId
        }))
      };
      
      // Wywołanie API
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd zapisywania fiszek');
      }
      
      setState('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
      setState('review');
    } finally {
      setIsSaving(false);
    }
  };

  // Resetowanie stanu
  const reset = () => {
    setState('input');
    setSourceText('');
    setGenerationId(null);
    setFlashcards([]);
    setError(null);
  };

  return {
    state,
    sourceText,
    setSourceText,
    generationId,
    flashcards,
    isGenerating,
    isSaving,
    error,
    isTextValid,
    generateFlashcards,
    updateFlashcard,
    acceptFlashcard,
    rejectFlashcard,
    saveAcceptedFlashcards,
    reset
  };
};
```

## 7. Integracja API

### Generowanie fiszek (POST /api/generations)

- Żądanie:
```typescript
{
  source_text: string; // 1000-10000 znaków
}
```

- Odpowiedź:
```typescript
{
  generation_id: number;
  flashcards_proposal: FlashcardProposalDto[];
}
```

### Zapisywanie fiszek (POST /api/flashcards)

- Żądanie:
```typescript
{
  flashcards: {
    front: string;       // Treść przodu fiszki
    back: string;        // Treść tyłu fiszki
    source: FlashcardSource; // 'ai-full', 'ai-edited' lub 'manual'
    generation_id: number | null; // null dla ręcznie tworzonych fiszek
  }[];
}
```

- Odpowiedź:
```typescript
{
  flashcards: FlashcardDto[];
}
```

## 8. Interakcje użytkownika

1. **Wprowadzanie tekstu źródłowego**:
   - Użytkownik wprowadza lub wkleja tekst w polu tekstowym
   - System na bieżąco waliduje długość tekstu i informuje o limitach
   - Przycisk "Generuj" jest aktywny tylko dla poprawnej długości tekstu

2. **Generowanie fiszek**:
   - Użytkownik klika przycisk "Generuj"
   - System pokazuje stan ładowania i blokuje pole tekstowe
   - Po zakończeniu generowania wyświetlane są propozycje fiszek

3. **Przeglądanie i edycja propozycji**:
   - Użytkownik widzi listę propozycji fiszek
   - Każda fiszka zawiera przód, tył oraz przyciski akcji
   - Użytkownik może edytować treść przodu i tyłu bezpośrednio w karcie

4. **Akceptacja/odrzucenie propozycji**:
   - Użytkownik może zaakceptować pojedynczą propozycję (przycisk "Akceptuj")
   - Użytkownik może odrzucić pojedynczą propozycję (przycisk "Odrzuć")
   - Zaakceptowane/odrzucone fiszki zmieniają swój wygląd wizualny

5. **Zapisywanie fiszek**:
   - Użytkownik klika przycisk "Zapisz zaakceptowane fiszki"
   - System pokazuje stan ładowania
   - Po zapisie wyświetla się komunikat sukcesu i opcja powrotu do generatora

## 9. Warunki i walidacja

### Walidacja tekstu źródłowego:
- Minimum 1000 znaków
- Maksimum 10000 znaków
- Wymagane niepuste pole

### Walidacja fiszki:
- Przód fiszki:
  - Wymagane niepuste pole
  - Maksimum 200 znaków
- Tył fiszki:
  - Wymagane niepuste pole
  - Maksimum 600 znaków

### Walidacja zapisu:
- Co najmniej jedna fiszka musi być zaakceptowana
- Wszystkie zaakceptowane fiszki muszą przejść walidację

## 10. Obsługa błędów

1. **Błędy walidacji formularza**:
   - Komunikaty błędów wyświetlane pod odpowiednimi polami
   - Dezaktywacja przycisku "Generuj" gdy formularz jest niepoprawny

2. **Błędy API podczas generowania**:
   - Wyświetlenie komunikatu błędu w Toast
   - Możliwość ponowienia próby
   - Logowanie błędów na serwerze

3. **Błędy walidacji fiszek**:
   - Wyświetlenie komunikatów błędów pod polami fiszki
   - Uniemożliwienie zapisu fiszek z błędami

4. **Błędy API podczas zapisywania**:
   - Wyświetlenie komunikatu błędu w Toast
   - Możliwość ponowienia próby
   - Zachowanie stanu edycji

5. **Utrata połączenia**:
   - Obsługa offline poprzez komunikat i opcję ponowienia
   - Cache'owanie formularza aby uniknąć utraty danych

## 11. Kroki implementacji

1. **Utworzenie struktury plików**:
   - Utworzenie katalogu `/src/components/Generator`
   - Utworzenie komponentu `GeneratorPage.tsx`
   - Utworzenie strony Astro `/src/pages/flashcards/generate.astro`

2. **Implementacja typów i modeli**:
   - Dodanie typów w pliku dedykowanym dla generatora `/src/components/Generator/types.ts`

3. **Implementacja hook'a zarządzającego stanem**:
   - Utworzenie pliku `/src/components/Generator/useGeneratorState.ts`
   - Implementacja logiki zarządzania stanem generacji

4. **Implementacja komponentów UI**:
   - Implementacja komponentu TextInput
   - Implementacja komponentu GenerationForm
   - Implementacja komponentu FlashcardPreview
   - Implementacja komponentu FlashcardsList
   - Implementacja komponentu GenerationResults

5. **Integracja z API**:
   - Implementacja wywołań API w hooku useGeneratorState
   - Dodanie obsługi błędów i stanów ładowania

6. **Stylizacja i poprawki UX**:
   - Dopracowanie wyglądu komponentów
   - Dodanie animacji przejść między stanami
   - Poprawienie dostępności (accessibility)

7. **Dokumentacja**:
   - Dodanie komentarzy do kodu
   - Utworzenie dokumentu dla zespołu opisującego komponent