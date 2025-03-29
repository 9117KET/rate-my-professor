```mermaid
classDiagram
    class Review {
        +String professor
        +String subject
        +Number stars
        +String review
        +Date timestamp
        +String userId
        +Array~String~ tags
        +createReview()
        +updateReview()
        +deleteReview()
        +validateReview()
    }

    class Professor {
        +String name
        +Array~String~ subjects
        +Number averageRating
        +Number reviewCount
        +getProfessorInfo()
        +getProfessorReviews()
        +calculateAverageRating()
    }

    class ContentModerationService {
        -Array~String~ inappropriateWords
        -Object contentRules
        +validateContent()
        +checkInappropriateWords()
        +applyContentRules()
    }

    class EmbeddingService {
        +createEmbedding()
        +storeEmbedding()
        +searchSimilarReviews()
        +syncVectorStore()
    }

    class ReviewsService {
        -String COLLECTION_NAME
        +addReview()
        +getReviews()
        +updateReview()
        +deleteReview()
        +getProfessorStats()
    }

    class ViewReviewsModal {
        -Array~Review~ reviews
        -String selectedSubject
        -String selectedProfessor
        +filterReviews()
        +sortReviews()
        +calculateStats()
    }

    class ReviewError {
        +String message
        +String name
    }

    class ReviewPermissionError {
        +String message
        +String name
    }

    class ReviewNotFoundError {
        +String message
        +String name
    }

    class ReviewTimeWindowError {
        +String message
        +String name
    }

    Review --> Professor : belongs to
    Review --> ContentModerationService : validates through
    Review --> EmbeddingService : creates embeddings for
    ReviewsService --> Review : manages
    ReviewsService --> Professor : calculates stats for
    ViewReviewsModal --> Review : displays
    ViewReviewsModal --> Professor : shows stats for
    ReviewError <|-- ReviewPermissionError
    ReviewError <|-- ReviewNotFoundError
    ReviewError <|-- ReviewTimeWindowError
```

## Component Relationships

1. **Review Class**

   - Core entity representing a professor review
   - Contains review data and validation methods
   - Connected to Professor and various services

2. **Professor Class**

   - Represents a professor with their information
   - Contains methods for retrieving reviews and calculating statistics
   - Connected to Review and ReviewsService

3. **ContentModerationService**

   - Handles content validation and moderation
   - Contains rules and inappropriate words lists
   - Validates Review content

4. **EmbeddingService**

   - Manages vector embeddings for semantic search
   - Creates and stores embeddings for reviews
   - Handles vector store synchronization

5. **ReviewsService**

   - Manages review operations (CRUD)
   - Handles database interactions
   - Calculates professor statistics

6. **ViewReviewsModal**

   - UI component for displaying reviews
   - Handles filtering and sorting
   - Shows professor statistics

7. **Error Classes**
   - Hierarchy of error classes for review-related errors
   - Includes permission, not found, and time window errors

## Database Schema

```mermaid
erDiagram
    REVIEW ||--o{ PROFESSOR : has
    REVIEW {
        string professor
        string subject
        number stars
        string review
        timestamp timestamp
        string userId
        array tags
    }
    PROFESSOR {
        string name
        array subjects
        number averageRating
        number reviewCount
    }
```

## System Architecture

```mermaid
graph TB
    subgraph Frontend
        UI[User Interface]
        ViewReviews[View Reviews Modal]
        Components[React Components]
    end

    subgraph Services
        Reviews[Reviews Service]
        Embedding[Embedding Service]
        Moderation[Content Moderation]
    end

    subgraph Database
        Firestore[(Firebase Firestore)]
        Pinecone[(Pinecone Vector DB)]
    end

    UI --> ViewReviews
    ViewReviews --> Reviews
    Reviews --> Firestore
    Reviews --> Embedding
    Embedding --> Pinecone
    Reviews --> Moderation
```
