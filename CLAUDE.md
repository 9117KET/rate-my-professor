# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Essential Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing
- `node tests/database.test.js` - Run basic database tests

### Vector Store Synchronization
- `node scripts/sync-pinecone.js` - Sync Firestore with Pinecone vector database
- `node scripts/sync-pinecone.js --alt-method` - Full resync (delete all + upsert)
- `node scripts/check-embeddings.js` - Check embedding consistency

## Architecture Overview

This is a Next.js application with App Router that provides an AI-powered Rate My Professor interface. The architecture follows a layered approach:

### Tech Stack
- **Frontend**: Next.js 15+ (App Router), React 19, Material-UI
- **Backend**: Next.js API Routes with service layer
- **Database**: Firebase Firestore (primary) + Pinecone (vector embeddings)
- **AI**: OpenAI API for chat and embeddings
- **Deployment**: Vercel with cron jobs

### Key Architectural Patterns

**Service Layer Architecture**: Business logic is organized into services in `app/services/`:
- `chatService.js` - AI chat interactions using RAG (Retrieval Augmented Generation)
- `reviewsService.js` - Professor review CRUD operations
- `embeddingService.js` - Vector embedding management and Pinecone operations
- `bugReportService.js` - Bug report handling
- `userTrackingService.js` - Anonymous user tracking and privacy management

**Dual Database System**: 
- Firestore stores the source of truth for reviews and user data
- Pinecone stores vector embeddings for semantic search in the chat feature
- Synchronization between databases is handled automatically and via cron jobs

**RAG Implementation**: The chat feature uses Retrieval Augmented Generation:
1. User queries are converted to embeddings
2. Similar professor reviews are retrieved from Pinecone
3. Retrieved context is sent to OpenAI with the user query
4. AI generates responses based on actual review data

## Key Directory Structure

```
app/
├── api/                    # Next.js API routes
│   ├── chat/              # AI chat endpoint
│   ├── sync-embeddings/   # Manual vector sync
│   ├── cron/              # Scheduled tasks
│   └── admin/             # Admin endpoints
├── components/            # React UI components
├── services/              # Business logic layer
├── utils/                 # Utility functions
└── lib/                   # External service configs
scripts/                   # Maintenance scripts
tests/                     # Test files
```

## Important Implementation Details

### Environment Variables
The application requires these environment variables:
- `OPENAI_API_KEY` - OpenAI API access
- `PINECONE_API_KEY` - Pinecone vector database
- `API_SECRET_KEY` - API authentication
- `CRON_SECRET_KEY` - Cron job authentication
- Firebase config variables (all prefixed with `NEXT_PUBLIC_FIREBASE_`)

### Security & Privacy
- **Anonymous User System**: Users are identified by UUIDs in localStorage
- **Comprehensive Privacy Features**: Data export, deletion, consent management
- **Security Headers**: HTTPS enforcement, CORS protection, error sanitization
- **Error Handling**: Centralized error handling with sanitized client responses

### Data Synchronization
The system maintains consistency between Firestore and Pinecone:
- **Automatic Sync**: Triggered on review create/update/delete
- **Scheduled Sync**: Cron job runs every 6 hours (`/api/cron/sync-pinecone`)
- **Manual Sync**: Available via API endpoint or script

### Chat Feature Implementation
The AI chat uses semantic search over professor reviews:
1. Reviews are embedded using OpenAI's text-embedding-ada-002
2. User queries are embedded and matched against review vectors in Pinecone
3. Top relevant reviews provide context for OpenAI's response generation
4. Responses include source attribution and professor information

## Development Workflow

1. **Adding New Features**: Follow the service layer pattern - create services for business logic, use API routes as thin controllers
2. **Database Changes**: Remember to sync both Firestore and Pinecone when dealing with review data
3. **Testing**: Run existing tests and add new ones for complex business logic
4. **Privacy Compliance**: Ensure new features respect the anonymous user system and privacy controls

## Common Patterns

### Error Handling
- Use `createErrorResponse()` from `utils/errorHandler.js` in API routes
- Use `formatClientError()` from `utils/clientErrorHandler.js` for user-facing errors
- Custom error classes are defined in service files

### CORS and Security
- API routes use `cors.js` middleware for cross-origin protection
- Different endpoints have different CORS policies based on sensitivity
- All API keys are validated server-side

### Component Architecture
- Components are organized by functionality, not by type
- Modal components handle their own state and visibility
- Services are imported directly into components for data operations