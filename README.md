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

## License

[MIT](LICENSE)
