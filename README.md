# Rate My Professor AI Assistant

This project provides an AI assistant for the Rate My Professor platform, allowing users to get information about professors based on reviews.

## Features

- Chat interface for querying professor reviews
- Submit and manage professor reviews
- View existing reviews
- AI-powered responses based on review content

## Vector Store Synchronization

The application uses Pinecone as a vector database to store embeddings of professor reviews. These embeddings are used to find relevant reviews when users ask questions.

### Automatic Synchronization

The vector store is automatically synchronized with the Firestore database when:

- A new review is added
- An existing review is edited
- A review is deleted

This ensures that the AI assistant always has access to the most up-to-date review information.

### Scheduled Synchronization

The application includes a scheduled synchronization endpoint that can be configured to run regularly using a cron job. This provides an additional layer of reliability to ensure Pinecone stays in sync with Firestore.

#### Setting up scheduled synchronization with Vercel Cron

If you're hosting this application on Vercel, you can set up scheduled synchronization using Vercel Cron Jobs:

1. Add the following to your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-pinecone",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This will run the synchronization every 6 hours.

2. Add the `CRON_SECRET_KEY` environment variable to your Vercel project.

#### Setting up scheduled synchronization with other providers

For other hosting providers, you can set up a cron job to call the synchronization endpoint:

```bash
# Example cron job (every 6 hours)
0 */6 * * * curl -X GET https://your-domain.com/api/cron/sync-pinecone -H "Authorization: Bearer YOUR_CRON_SECRET_KEY"
```

### Manual Synchronization

If you need to manually synchronize the vector store with the database (for example, after importing a batch of reviews or if you suspect the databases are out of sync), you can use the following methods:

#### 1. Using the API endpoint

```bash
# Using curl
curl -X POST https://your-domain.com/api/sync-embeddings \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"useAltMethod": false}'

# Using the alternative method (deleteAll + upsert)
curl -X POST https://your-domain.com/api/sync-embeddings \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"useAltMethod": true}'
```

#### 2. Using the utility script

```bash
# Standard method
node scripts/sync-pinecone.js

# Alternative method (deleteAll + upsert)
node scripts/sync-pinecone.js --alt-method

# Show help
node scripts/sync-pinecone.js --help
```

### Synchronization Methods

The system offers two synchronization methods:

1. **Standard Method** (Default): This method:

   - Gets all reviews from Firestore
   - Gets all vector IDs from Pinecone
   - Compares the two lists and deletes vectors that no longer exist in Firestore
   - Creates or updates embeddings for all current reviews

2. **Alternative Method**: This method:
   - Deletes all vectors in the Pinecone index
   - Creates fresh embeddings for all current reviews
   - Uploads all embeddings to Pinecone

The alternative method is more reliable but might be slower for large datasets.

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables in `.env` file
4. Run the development server with `npm run dev`

## Environment Variables

You need to set the following environment variables:

```
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
API_SECRET_KEY=your_api_secret_key_for_sync_endpoint
CRON_SECRET_KEY=your_secret_key_for_cron_jobs
```

Plus Firebase configuration variables.

### Firebase Configuration

For the Firebase configuration, you must set the following environment variables in your `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

### Security Best Practices

1. **Never commit API keys or secrets to version control**

   - The project is configured to ignore `.env` and `.env.local` files in `.gitignore`
   - Always use environment variables for secrets

2. **Environment Variable Management**

   - Use `.env` for template/documentation of required variables (with empty values)
   - Use `.env.local` for actual values (this file should never be committed)
   - For production, set environment variables through your hosting platform's dashboard

3. **API Key Security**

   - Firebase API keys are meant to be public, but still follow best practices
   - Use Firebase Security Rules to secure your database (see Firebase documentation)
   - Use server-side API routes to interact with sensitive APIs where possible

4. **Required Environment Variables Check**

   - The application checks for required environment variables on startup
   - In development mode, it will log warnings if any required variables are missing

5. **HTTPS and CORS Security**

   - The application is configured to force HTTPS in production environments
   - HTTP Strict Transport Security (HSTS) is enabled to protect against downgrade attacks
   - Additional security headers are set to protect against common web vulnerabilities
   - CORS is properly configured for all API routes to prevent unauthorized cross-origin requests
   - Different CORS policies are applied to different API endpoints based on their sensitivity

6. **Secure Error Handling**
   - Error messages are sanitized to prevent leaking sensitive information
   - Detailed error information is only logged server-side, not exposed to clients
   - Client-facing error messages are user-friendly and do not reveal implementation details
   - Error logging includes context but redacts sensitive information
   - Custom error classes help standardize error handling throughout the application

### HTTPS Configuration

The application uses the following security headers:

- **Strict-Transport-Security**: Forces HTTPS for the site and all subdomains
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser's XSS filtering
- **Referrer-Policy**: Controls what information is sent in the Referer header

In production, all HTTP requests are automatically redirected to HTTPS.

### CORS Configuration

API endpoints are protected by CORS (Cross-Origin Resource Sharing) middleware:

- Only specified origins can access the API
- Different API endpoints have different CORS configurations based on their sensitivity
- The CORS middleware handles preflight requests automatically
- Only necessary HTTP methods are allowed for each endpoint
- Only required headers are allowed

To customize CORS configuration for specific environments, update the `allowedOrigins` in `app/utils/cors.js`.

### Error Handling

The application implements a comprehensive error handling strategy that prioritizes security:

#### Server-Side Error Handling

- **Centralized Error Handling**: The `errorHandler.js` utility provides standardized error handling across API routes
- **Error Categorization**: Errors are categorized by type for appropriate responses
- **Sanitized Error Responses**: API endpoints return sanitized error messages that don't expose sensitive information
- **Contextual Logging**: Detailed error information is logged server-side with relevant context for debugging
- **Custom Status Codes**: HTTP status codes are mapped appropriately to error types

#### Client-Side Error Handling

- **User-Friendly Messages**: Errors are translated into user-friendly messages via `clientErrorHandler.js`
- **Consistent Error Display**: Errors are displayed consistently in the UI (form errors, alerts, snackbars)
- **Privacy Protection**: Error messages never include stack traces or sensitive implementation details
- **Error Translation**: Raw errors are mapped to appropriate user-facing messages based on error type

#### Implementation Approach

Error handling is implemented at multiple layers:

1. **API Routes**: Use `createErrorResponse()` to generate sanitized error responses
2. **Services**: Use custom error classes like `ReviewError` to standardize error types
3. **Components**: Use `formatClientError()` to display user-friendly error messages
4. **Firebase Initialization**: Uses specialized error handling to protect sensitive configuration details

To extend or modify error handling:

- Add new error types to `ERROR_TYPES` in `errorHandler.js`
- Add new user-friendly messages to `ERROR_MESSAGES` in `clientErrorHandler.js`
- Use the appropriate error handling functions in new code

### Privacy Features

The application includes comprehensive privacy features to ensure transparency and user control over their data:

#### Privacy Policy

- **Clear Communication**: A detailed privacy policy explains what data is collected and how it's used
- **Accessible**: The privacy policy is easily accessible from the footer of the application
- **Transparent**: The policy clearly outlines data retention periods and third-party services used

#### User Data Management

- **Data Access**: Users can view all their content (reviews, replies, reactions) in one place
- **Data Export**: Users can export their data in JSON format
- **Data Deletion**: Users can delete individual reviews or all their data at once
- **Anonymous IDs**: User identification is done through anonymous UUIDs stored in local storage

#### Consent Management

- **Privacy Consent Banner**: First-time visitors see a consent banner explaining data practices
- **Consent Storage**: User consent is recorded with timestamp and policy version
- **Privacy Settings**: Users can adjust their privacy preferences

#### Implementation Details

1. **User Tracking Service**:

   - Manages anonymous user IDs
   - Handles privacy consent and settings
   - Provides methods for data deletion

2. **Privacy Components**:

   - `PrivacyPolicyModal`: Displays the detailed privacy policy
   - `UserDataManagementModal`: Interface for viewing, exporting, and deleting user data
   - `PrivacyConsentBanner`: Obtains and records user consent

3. **Backend Services**:
   - `reviewsService.getUserContent()`: Retrieves all content associated with a user ID
   - `reviewsService.deleteAllUserContent()`: Removes all user content from the database

To customize the privacy features:

- Update the privacy policy text in `PrivacyPolicyModal.js`
- Modify data retention periods in both the UI and backend services
- Adjust the consent banner messaging in `PrivacyConsentBanner.js`

## License

[MIT](LICENSE)
