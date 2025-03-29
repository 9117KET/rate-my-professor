# Rate My Professor - System Architecture

## System Overview

This document provides a comprehensive overview of the Rate My Professor application's architecture, including its components, data flow, and technology stack.

## Technology Stack

- **Frontend**: Next.js 13+ (App Router), React, Material-UI
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Vector Database**: Pinecone
- **AI Services**: OpenAI
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel

## System Architecture Diagram

```mermaid
graph TB
    subgraph Client Layer
        UI[User Interface]
        Components[React Components]
        State[Client State]
    end

    subgraph API Layer
        API[Next.js API Routes]
        Auth[Authentication]
        CORS[CORS Middleware]
        Error[Error Handler]
    end

    subgraph Service Layer
        Chat[Chat Service]
        Reviews[Reviews Service]
        Embedding[Embedding Service]
        BugReport[Bug Report Service]
        UserTracking[User Tracking Service]
    end

    subgraph Data Layer
        Firestore[(Firebase Firestore)]
        Pinecone[(Pinecone Vector DB)]
        OpenAI[OpenAI API]
    end

    subgraph External Services
        Vercel[Vercel Analytics]
        Cron[Cron Jobs]
    end

    %% Client Layer Connections
    UI --> Components
    Components --> State
    State --> API

    %% API Layer Connections
    API --> Auth
    API --> CORS
    API --> Error
    API --> Service Layer

    %% Service Layer Connections
    Chat --> OpenAI
    Chat --> Pinecone
    Reviews --> Firestore
    Embedding --> OpenAI
    Embedding --> Pinecone
    Embedding --> Firestore
    BugReport --> Firestore
    UserTracking --> Firestore

    %% External Service Connections
    Cron --> API
    Vercel --> UI
```

## Physical System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                    │
│                                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │   Browser   │     │   Material   │     │   React      │                 │
│  │   (Next.js) │     │     UI       │     │ Components  │                 │
│  └──────┬──────┘     └───────┬──────┘     └───────┬──────┘                 │
│         │                    │                     │                        │
│         └────────────────────┴─────────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Layer                                      │
│                                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │   Next.js   │     │  CORS & Auth │     │   Error      │                 │
│  │ API Routes  │     │  Middleware  │     │  Handler     │                 │
│  └──────┬──────┘     └───────┬──────┘     └───────┬──────┘                 │
│         │                    │                     │                        │
│         └────────────────────┴─────────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Service Layer                                  │
│                                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │   Chat      │     │   Reviews    │     │  Embedding   │                 │
│  │  Service    │     │   Service    │     │  Service     │                 │
│  └──────┬──────┘     └───────┬──────┘     └───────┬──────┘                 │
│         │                    │                     │                        │
│         └────────────────────┴─────────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Data Layer                                     │
│                                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │  Firebase   │     │   Pinecone   │     │   OpenAI     │                 │
│  │  Firestore  │     │  Vector DB   │     │    API       │                 │
│  └──────┬──────┘     └───────┬──────┘     └───────┬──────┘                 │
│         │                    │                     │                        │
│         └────────────────────┴─────────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Services                                 │
│                                                                             │
│  ┌─────────────┐     ┌──────────────┐                                      │
│  │   Vercel    │     │   Cron       │                                      │
│  │ Analytics   │     │   Jobs       │                                      │
│  └──────┬──────┘     └───────┬──────┘                                      │
│         │                    │                                             │
│         └────────────────────┘                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Data Flow:
1. User Request → Browser → Next.js API Routes
2. API Routes → Service Layer (Chat/Reviews/Embedding)
3. Services → Data Layer (Firestore/Pinecone/OpenAI)
4. Data Layer → Services → API Routes → Browser
5. Cron Jobs → API Routes → Services → Data Layer (Sync)
6. Analytics → Browser → Vercel Analytics

Legend:
┌─────┐  Component
│     │
└─────┘
    │   Data Flow
    ▼   Direction
```

## Component Relationships

### 1. Client Layer

- **User Interface**: Main application interface built with Material-UI
- **React Components**: Reusable UI components
- **Client State**: Manages local application state

### 2. API Layer

- **Next.js API Routes**: Server-side API endpoints
- **Authentication**: Handles user authentication and authorization
- **CORS Middleware**: Manages cross-origin requests
- **Error Handler**: Centralized error handling

### 3. Service Layer

- **Chat Service**: Manages AI-powered chat interactions
- **Reviews Service**: Handles professor review operations
- **Embedding Service**: Manages vector embeddings for semantic search
- **Bug Report Service**: Handles bug report submissions
- **User Tracking Service**: Manages user analytics and tracking

### 4. Data Layer

- **Firebase Firestore**: Primary database for reviews and user data
- **Pinecone Vector DB**: Stores vector embeddings for semantic search
- **OpenAI API**: Provides AI capabilities for chat and embeddings

### 5. External Services

- **Vercel Analytics**: Tracks application usage
- **Cron Jobs**: Handles scheduled tasks (e.g., vector store synchronization)

## Data Flow

1. **User Interactions**:

   - Users interact with the UI components
   - Client state is updated accordingly

2. **API Requests**:

   - Client makes API requests to Next.js routes
   - Requests are validated and authenticated
   - CORS policies are applied

3. **Service Processing**:

   - Services handle business logic
   - Data is processed and transformed
   - External APIs are called when needed

4. **Data Storage**:

   - Data is stored in Firestore
   - Vector embeddings are stored in Pinecone
   - AI responses are generated via OpenAI

5. **Scheduled Tasks**:
   - Cron jobs trigger periodic tasks
   - Vector store synchronization occurs
   - Analytics data is collected

## Security Measures

1. **Authentication**:

   - API key validation
   - User authentication
   - Session management

2. **CORS Protection**:

   - Strict CORS policies
   - Origin validation
   - Method restrictions

3. **Error Handling**:

   - Sanitized error responses
   - Secure error logging
   - Client-friendly error messages

4. **Data Protection**:
   - Environment variable management
   - Secure API key storage
   - HTTPS enforcement

## Best Practices

1. **Code Organization**:

   - Modular component structure
   - Service-based architecture
   - Clear separation of concerns

2. **Performance**:

   - Client-side caching
   - Optimized API calls
   - Efficient data fetching

3. **Scalability**:

   - Microservices architecture
   - Distributed database
   - Load balancing ready

4. **Maintenance**:
   - Comprehensive error handling
   - Detailed logging
   - Regular synchronization
