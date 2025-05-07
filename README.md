# 10xCard

> A web application for fast and convenient AI-driven flashcard creation and spaced repetition learning.

---

## Table of Contents

1. [Project Description](#project-description)  
2. [Tech Stack](#tech-stack)  
3. [Getting Started Locally](#getting-started-locally)  
4. [Available Scripts](#available-scripts)  
5. [Project Scope](#project-scope)  
6. [Project Status](#project-status)  
7. [License](#license)  

---

## Project Description

10xCard enables educators and learners to rapidly generate, edit, and manage flashcards using artificial intelligence.  
Key features include:

- AI-powered flashcard generation from pasted text (1,000–10,000 characters)  
- Manual creation, inline editing, and hard deletion of flashcards  
- User registration & authentication with password strength validation and hashing  
- Logging of AI generation actions and accept/reject decisions with timestamps  
- Built-in spaced repetition algorithm to optimize review schedules  
- Prepared for internationalization (all text stored in resource files)  

---

## Tech Stack

- **Frontend**  
  - Astro 5  
  - React 19 (for dynamic components)  
  - TypeScript 5  
  - Tailwind CSS 4  
  - Shadcn/ui component library  
- **Backend**  
  - Supabase (PostgreSQL, Authentication, SDK)  
- **AI Integration**  
  - Openrouter.ai (supports OpenAI, Anthropic, Google models)  
- **CI/CD & Hosting**  
  - GitHub Actions  
  - Docker on DigitalOcean  

---

## Getting Started Locally

### Prerequisites

- Node.js v22.14.0 (managed via `.nvmrc`)  
- Git  

### Setup

1. Clone the repository  
   ```bash
   git clone https://github.com/<your-org>/10xCard.git
   cd 10xCard
   ```
2. Install dependencies  
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```bash
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   OPENROUTER_API_KEY=<your-openrouter-api-key>
   ```
4. Run the development server  
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:3000`

---

## Available Scripts

All commands assume you are in the project root.

```bash
# Start Astro development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview

# Run any Astro CLI command
npm run astro

# Lint the codebase
npm run lint

# Fix lint issues
npm run lint:fix

# Format with Prettier
npm run format
```

---

## Project Scope

### In Scope (MVP)

- AI flashcard generation from user-provided text (1k–10k chars)  
- Manual creation, inline editing, and deletion of flashcards  
- User registration and login (email/password)  
- Password strength validation and hashing  
- Logging of generation & review actions with timestamps  
- Basic spaced repetition review module  
- Internationalization readiness  

### Out of Scope (for MVP)

- Advanced spaced repetition algorithms (SuperMemo, Anki)  
- Importing documents (PDF, DOCX, etc.)  
- Sharing or collaborating on flashcard sets  
- Integrations with external educational platforms  
- Mobile application  
- Real-time API usage/budget monitoring  

---

## Project Status

🔧 MVP in active development. Core features are being implemented according to the PRD, with further improvements and QA to follow.

---

## License

This project does not currently include a license. Please add a `LICENSE` file to specify usage terms.