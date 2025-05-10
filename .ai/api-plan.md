# REST API Plan

## 1. Resources
- **Users** - Corresponds to `auth.users` table (managed by Supabase Auth)
- **Generations** - Corresponds to `generations` table
- **Flashcards** - Corresponds to `flashcards` table
- **Generation Error Logs** - Corresponds to `generation_error_logs` table

## 2. Endpoints

### Authentication
Authentication is handled by Supabase Auth, accessed through the client-side SDK.

### Flashcards

#### GET /api/flashcards
- **Description**: Retrieve a paginated list of user's flashcards
- **Query Parameters**:
  - `page` (optional): Page number, default 1
  - `limit` (optional): Items per page, default 20
  - `source` (optional): Filter by source type ('ai-full', 'ai-edited', 'manual')
  - `sort` (optional): Sort field ('created_at', 'updated_at', 'id')
  - `order` (optional): Sort order ('asc', 'desc')
- **Response Payload**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "user_id": "uuid",
        "generation_id": 1,
        "front": "Question text",
        "back": "Answer text",
        "source": "ai-full",
        "created_at": "2025-05-08T00:00:00Z",
        "updated_at": "2025-05-08T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 500 Internal Server Error

#### GET /api/flashcards/:id
- **Description**: Retrieve a specific flashcard by ID
- **Response Payload**:
  ```json
  {
    "id": 1,
    "user_id": "uuid",
    "generation_id": 1,
    "front": "Question text",
    "back": "Answer text",
    "source": "ai-full",
    "created_at": "2025-05-08T00:00:00Z",
    "updated_at": "2025-05-08T00:00:00Z"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### POST /api/flashcards
- **Description**: Create multiple flashcards (manual or AI-generated)
- **Request Payload**:
  ```json
  {
    "flashcards": [
      {
        "front": "Question text 1",
        "back": "Answer text 1",
        "source": "manual",
        "generation_id": null
      },
      {
        "front": "Question text 2",
        "back": "Answer text 2",
        "source": "ai-full",
        "generation_id": 1
      }
    ]
  }
  ```
- **Response Payload**:
  ```json
  {
    "flashcards": [
      {
        "id": 1,
        "user_id": "uuid",
        "generation_id": null,
        "front": "Question text 1",
        "back": "Answer text 1",
        "source": "manual",
        "created_at": "2025-05-08T00:00:00Z",
        "updated_at": "2025-05-08T00:00:00Z"
      },
      {
        "id": 2,
        "user_id": "uuid",
        "generation_id": 1,
        "front": "Question text 2",
        "back": "Answer text 2",
        "source": "ai-full",
        "created_at": "2025-05-08T00:00:01Z",
        "updated_at": "2025-05-08T00:00:01Z"
      }
    ]
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

#### PUT /api/flashcards/:id
- **Description**: Update an existing flashcard
- **Request Payload**:
  ```json
  {
    "front": "Updated question text",
    "back": "Updated answer text"
  }
  ```
- **Response Payload**:
  ```json
  {
    "id": 1,
    "user_id": "uuid",
    "generation_id": 1,
    "front": "Updated question text",
    "back": "Updated answer text",
    "source": "ai-edited",
    "created_at": "2025-05-08T00:00:00Z",
    "updated_at": "2025-05-08T01:00:00Z"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### DELETE /api/flashcards/:id
- **Description**: Delete a flashcard
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Generations

#### POST /api/generations
- **Description**: Generate flashcards from source text using AI
- **Request Payload**:
  ```json
  {
    "source_text": "Long text content between 1000-10000 characters",
  }
  ```
- **Response Payload**:
  ```json
  {
    "generation_id": 123,
    "flashcards_proposal": [
      {
        "front": "Generated question 1",
        "back": "Generated answer 1",
        "source": "ai-full"
      },
      {
        "front": "Generated question 2",
        "back": "Generated answer 2",
        "source": "ai-full"
      }
    ]
  }
  ```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error


#### GET /api/generations
- **Description**: Get a list of user's generation sessions
- **Query Parameters**:
  - `page` (optional): Page number, default 1
  - `limit` (optional): Items per page, default 20
  - `sort` (optional): Sort field ('created_at')
  - `order` (optional): Sort order ('asc', 'desc')
- **Response Payload**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "user_id": "uuid",
        "model": "model-name",
        "generated_count": 10,
        "accepted_count": 8,
        "source_text_hash": "hash",
        "source_text_length": 5000,
        "duration": 3500,
        "created_at": "2025-05-08T00:00:00Z",
        "updated_at": "2025-05-08T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 500 Internal Server Error

#### GET /api/generations/:id
- **Description**: Get details of a specific generation
- **Response Payload**:
  ```json
  {
    "id": 1,
    "user_id": "uuid",
    "model": "model-name",
    "generated_count": 10,
    "accepted_count": 8,
    "source_text_hash": "hash",
    "source_text_length": 5000,
    "duration": 3500,
    "created_at": "2025-05-08T00:00:00Z",
    "updated_at": "2025-05-08T00:00:00Z"
  }
  ```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

## 3. Authentication and Authorization

Authentication is handled by Supabase Auth, which is integrated into the application. The authentication flow is as follows:

1. **Client-side Authentication**:
   - User registration and login are handled by Supabase Auth client SDK
   - Tokens are stored securely on the client side
   - All API requests include the auth token in headers

2. **Server-side Authorization**:
   - Astro middleware validates the auth token for protected routes
   - Supabase Row Level Security (RLS) ensures that users can only access their own data
   - API endpoints additionally verify user identity before processing requests

3. **Security Measures**:
   - Password strength validation (minimum 8 characters, uppercase letter, number, special character)
   - Password hashing implemented by Supabase Auth
   - Token-based authentication with short-lived tokens and refresh capability
   - HTTPS for all communications

## 4. Validation and Business Logic

### Validation Rules

#### Flashcards
- `front`: Required, string, max 200 characters
- `back`: Required, string, max 600 characters
- `source`: Valid values: 'ai-full', 'ai-edited', 'manual'
- `generation_id`: Required for 'ai-full' and 'ai-edited'

#### Generation
- `source_text`: Required, string, between 1000-10000 characters

### Business Logic Implementation

1. **Flashcard Generation**:
   - Text submitted for generation is validated for length (1000-10000 chars)
   - AI service is called to generate flashcards
   - Generation metadata (duration, count, etc.) is recorded
   - Generated flashcard are returned in the response as `flashcards_proposal`
   - Flashcards are stored after user confirmation, with 'ai-full' or 'ai-edited' source
   - If errors occur, they are logged to generation_error_logs

2. **Flashcard Processing**:
   - When a user edits an AI-generated flashcard, source is updated to 'ai-edited'
   - Generation statistics are updated when flashcards are accepted/rejected
   - Deleted flashcards are permanently removed (hard delete)

