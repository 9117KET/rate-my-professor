# Rate My Professor

A modern web application for rating and reviewing professors, built with Next.js and Firebase.

## Features

- 🔒 **Secure Authentication**: Anonymous authentication with Firebase Auth
- 📝 **Review Management**: Create, edit, and delete reviews with time-based restrictions
- ⚡ **Real-time Updates**: Live updates using Firestore
- 🎨 **Modern UI**: Clean and responsive design with Material-UI
- 🔍 **Search & Filter**: Advanced search and filtering capabilities
- 🤖 **AI-Powered**: Content moderation and search using OpenAI
- 📱 **Mobile Responsive**: Optimized for all devices

## Security Features

- Anonymous authentication with Firebase Auth
- Server-side security rules for data protection
- Time-based restrictions for review modifications
- Content moderation for reviews and replies
- Rate limiting for review submissions
- Secure user session management

## Tech Stack

- **Frontend**: Next.js 14, Material-UI, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth)
- **AI/ML**: OpenAI API
- **Search**: Pinecone Vector Database
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- OpenAI API key
- Pinecone account

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_index_name
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/rate-my-professor.git
   cd rate-my-professor
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup

1. Create a new Firebase project
2. Enable Firestore Database
3. Enable Anonymous Authentication
4. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Security Considerations

- Reviews can only be deleted within 2 hours of creation
- Reviews can only be edited within 24 hours of creation
- Content is moderated using OpenAI
- Rate limiting prevents spam
- Server-side validation ensures data integrity

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Material-UI for the component library
- Firebase for the backend infrastructure
- OpenAI for content moderation
- Pinecone for vector search capabilities
