# AuthAI - Insurance Authorization Parser

An AI-powered web application for parsing and analyzing insurance authorization documents using Supabase for storage and Next.js for the frontend.

## Features

- **File Upload**: Drag-and-drop interface for uploading insurance documents (PDFs, images, Word docs)
- **Supabase Storage**: Secure cloud storage for uploaded documents
- **AI-Powered Parsing**: Extract key information from authorization documents
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- **Real-time Feedback**: Upload progress and status updates

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd authai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a storage bucket called `auth-documents` (or update the bucket name in the code)
4. Configure bucket permissions to allow uploads from authenticated users

### Running the Application

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
authai/
├── app/
│   ├── api/upload/route.ts    # File upload API endpoint
│   ├── about/page.tsx         # About page
│   ├── layout.tsx             # Root layout with navigation
│   └── page.tsx               # Home page with upload interface
├── utils/
│   └── storage.ts             # Supabase storage utilities
├── .env.example               # Environment variables template
└── package.json
```

## API Endpoints

### POST /api/upload

Uploads files to Supabase storage.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `files` (File array), `bucket` (optional), `folder` (optional)

**Response:**
```json
{
  "success": true,
  "uploaded": 2,
  "failed": 0,
  "results": [...],
  "message": "Successfully uploaded 2 of 2 files"
}
```

## File Upload Features

- **Supported Formats**: PDF, JPEG, PNG, GIF, Word documents
- **File Size Limit**: 10MB per file
- **Multiple Files**: Upload multiple files simultaneously
- **Drag & Drop**: Intuitive drag-and-drop interface
- **Progress Feedback**: Real-time upload status and results

## Storage Utilities

The `utils/storage.ts` file provides the following functions:

- `uploadFile(file, bucket, folder)` - Upload single file
- `uploadFiles(files, bucket, folder)` - Upload multiple files
- `getSignedUrl(path, bucket, expiresIn)` - Get signed download URL
- `listFiles(bucket, folder)` - List files in bucket/folder
- `deleteFile(path, bucket)` - Delete file
- `getFileMetadata(path, bucket)` - Get file metadata

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Tailwind CSS for styling
- Prettier for code formatting (via Next.js)

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
