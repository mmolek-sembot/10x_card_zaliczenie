# Dokument wymagań produktu (PRD) - 10xCard

## 1. Przegląd produktu

10xCard to aplikacja webowa umożliwiająca szybkie i wygodne tworzenie fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji. MVP obejmuje generowanie fiszek na podstawie wklejonego tekstu, ręczne tworzenie i edycję fiszek, proste zarządzanie biblioteką oraz wbudowany algorytm spaced repetition.

## 2. Problem użytkownika

Manualne przygotowanie fiszek edukacyjnych jest pracochłonne i czasochłonne, co często zniechęca użytkowników do korzystania z metody spaced repetition. Brak szybkiego rozwiązania powoduje mniejszą efektywność nauki.

## 3. Wymagania funkcjonalne

1. Generowanie fiszek przez AI na podstawie wprowadzonego tekstu (1000–10000 znaków)
2. Możliwość ręcznego tworzenia nowej fiszki: przód i tył
3. Edycja i usuwanie pojedynczych fiszek (inline editing, hard delete)
4. System kont użytkowników:

   * rejestracja e‑mail i hasło
   * walidacja siły hasła
   * szyfrowanie hasła 
5. Logowanie akcji generacji i decyzji (accept/reject) z timestampem
6. Wbudowany algorytm spaced repetition (bez eksportu danych)
7. Przygotowanie aplikacji do i18n (wszystkie teksty w plikach zasobów)

## 4. Granice produktu

W MVP nie obejmujemy:

* zaawansowanego algorytmu powtórek (SuperMemo, Anki)
* importu wielu formatów plików (PDF, DOCX, itp.)
* współdzielenia zestawów fiszek między użytkownikami
* integracji z zewnętrznymi platformami edukacyjnymi
* aplikacji mobilnej
* monitorowania budżetu API AI w czasie rzeczywistym

## 5. Historyjki użytkowników

US-001
Tytuł: Rejestracja nowego użytkownika
Opis: Nieznajomy użytkownik rejestruje konto, podając e‑mail i hasło
Kryteria akceptacji:

* Formularz rejestracji zawiera pola e‑mail i hasło
* Walidacja siły hasła (min. długość 8, litera wielka, cyfra, znak specjalny)
* Hasło jest haszowane przy zapisie

US-002
Tytuł: Logowanie istniejącego użytkownika
Opis: Użytkownik loguje się, podając e‑mail i hasło
Kryteria akceptacji:

* Formularz logowania z e‑mailem i hasłem
* Błędne dane wyświetlają komunikat o nieprawidłowym logowaniu
* Po udanym logowaniu użytkownik przechodzi do pulpitu
* Użytkownik nie może korzystać z funkcjonalnosci systemu bez logowania
* Użytkownik może się wylogować z systemu poprzez przycisk w prawym górnym rogu w głównym @Navigation.astro 
* Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub).

US-003
Tytuł: Wklejenie tekstu i generowanie fiszek AI
Opis: Po zalogowaniu użytkownik wkleja tekst (1000–10000 znaków) i uruchamia generowanie
Kryteria akceptacji:

* Pola textarea z licznikiem znaków
* Przy wciśnięciu przycisku 'Generuj' wywołanie API AI
* Odpowiedź wyświetla listę proponowanych fiszek

US-004
Tytuł: Edycja wygenerowanej fiszki przed zatwierdzeniem
Opis: Użytkownik może zmodyfikować treść pytania lub odpowiedzi wygenerowanej fiszki
Kryteria akceptacji:

* Editable pola tekstowe dla każdej fiszki
* Opcja 'Zapisz' lub 'Odrzuć'

US-005
Tytuł: Akceptacja lub odrzucenie fiszek AI
Opis: Użytkownik akceptuje lub odrzuca każdą z wygenerowanych fiszek
Kryteria akceptacji:

* Przyciski 'Akceptuj' i 'Odrzuć' przy każdej fiszce
* Akceptowane fiszki trafiają do biblioteki

US-006
Tytuł: Ręczne tworzenie nowej fiszki
Opis: Użytkownik wprowadza przód i tył ręcznie i zapisuje fiszkę
Kryteria akceptacji:

* Formularz z polami przód i tył
* Opcja 'Zapisz'; wymaga niepustych pól
* Zapisanie fiszki do biblioteki

US-007
Tytuł: Przegląd biblioteki fiszek dla zalogowanego uytkownika
Opis: Użytkownik przegląda listę swoich zapisanych fiszek
Kryteria akceptacji:

* Widok tabelaryczny lub kafelkowy z fiszkami
* Pagination dla dużej liczby fiszek
* Użytkownik ma dostęp tylko do swoich fiszek

US-008
Tytuł: Edycja istniejącej fiszki
Opis: Użytkownik edytuje dowolną fiszkę z biblioteki
Kryteria akceptacji:

* Modal z polami pytanie i odpowiedź
* Zapisanie zmian w bazie danych

US-09
Tytuł: Usunięcie fiszki
Opis: Użytkownik usuwa pojedynczą fiszkę
Kryteria akceptacji:

* Przyciski 'Usuń' przy każdej fiszce
* Potwierdzenie usunięcia
* Hard delete

US-010
Tytuł: Powtórki spaced repetition
Opis: Użytkownik włącza moduł powtórek i przegląda fiszki zgodnie z harmonogramem
Kryteria akceptacji:

* Algorytm spaced repetition przydziela fiszki do powtórek
* Na start algorytm wyświetla przód fiszki, poprzez integrację uytkownik wyświetla tył
* Uytkownik ocenia zgodnie z oczekiwaniami algorytmu na ile przyswoił fiszkę
* Następnie algorytm pokazuje kolejną fiszkę w ramach sesji powtórki

## 6. Metryki sukcesu

1. co najmniej 75% fiszek wygenerowanych przez AI zaakceptowanych przez użytkowników
2. co najmniej 75% wszystkich fiszek utworzonych z użyciem AI
