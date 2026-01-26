# HR AI Platform

A minimal HR AI Platform using OpenRouter API with the `liquid/lfm-2.5-1.2b-thinking:free` model.

## Features

### 1. Help Desk AI
- Ask questions about company policies
- Get AI-powered answers based on policy context
- View ticket history
- Manage policies (create, list, delete)

### 2. Resume Screening AI
- Create job postings with requirements
- Submit resumes for analysis
- Get AI-generated scores (0-100) and detailed feedback

### 3. Risk Detection AI
- Analyze employee activities for potential risks
- Detect toxic language in text
- Get risk level assessments (low/medium/high)

### 4. Interview Scheduling AI
- Schedule interviews with candidate and interviewer info
- AI-suggested time slots with reasoning
- Generate interview questions based on job and candidate
- Analyze candidate fit for positions

### 5. Document Upload & RAG System
- Upload company documents (PDF, DOCX, TXT, CSV)
- Intelligent document chunking and embedding
- Semantic search with hybrid search (semantic + keyword)
- AI-powered Q&A about documents with source citations
- Confidence scores for answers

## Tech Stack

- **Backend**: Python 3.11 + FastAPI
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **AI**: OpenRouter API (liquid/lfm-2.5-1.2b-thinking:free)
- **Database**: SQLite

## Setup

### Backend

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. The `.env` file is already configured with the API key. The database will be created automatically on first run.

5. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Help Desk
- `POST /api/helpdesk/ask` - Ask a question
- `GET /api/helpdesk/tickets` - Get all tickets
- `POST /api/helpdesk/policies` - Create a policy
- `GET /api/helpdesk/policies` - Get all policies
- `DELETE /api/helpdesk/policies/{id}` - Delete a policy

### Resume Screening
- `POST /api/jobs` - Create a job
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs/{id}/resumes` - Submit a resume
- `GET /api/jobs/{id}/resumes` - Get resumes for a job

### Risk Detection
- `POST /api/risk/analyze/{employee_id}` - Analyze employee risk
- `POST /api/risk/check-text` - Check text for toxicity

### Interview Scheduling
- `POST /api/interviews/schedule` - Create interview request
- `GET /api/interviews` - List all interviews
- `POST /api/interviews/{id}/suggest-slots` - AI suggests time slots
- `POST /api/interviews/generate-questions` - Generate interview questions
- `POST /api/interviews/analyze-fit` - Analyze candidate fit
- `PUT /api/interviews/{id}/confirm` - Confirm scheduled interview

### Document Management & RAG
- `POST /api/documents/upload` - Upload company document
- `GET /api/documents` - List company documents
- `POST /api/documents/query` - Ask question about documents
- `DELETE /api/documents/{id}` - Delete document
- `GET /api/documents/{id}/chunks` - View document chunks

## Project Structure

```
backend/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models/
│   │   ├── policy.py
│   │   ├── ticket.py
│   │   ├── job.py
│   │   ├── resume.py
│   │   ├── employee.py
│   │   ├── activity.py
│   │   ├── interview.py
│   │   ├── interviewer_availability.py
│   │   ├── company.py
│   │   ├── document.py
│   │   ├── document_chunk.py
│   │   └── embedding_cache.py
│   ├── services/
│   │   ├── openrouter_client.py
│   │   ├── helpdesk_ai.py
│   │   ├── resume_ai.py
│   │   ├── risk_ai.py
│   │   ├── interview_ai.py
│   │   ├── document_ai.py
│   │   └── embedding_service.py
│   └── routers/
│       ├── helpdesk.py
│       ├── resume.py
│       ├── risk.py
│       ├── interview.py
│       └── documents.py
├── requirements.txt
├── .env
├── uploads/ (auto-created)
└── database.db (auto-created)

frontend/
├── app/
│   ├── page.tsx (Help Desk)
│   ├── resumes/page.tsx
│   ├── risk/page.tsx
│   ├── interviews/page.tsx
│   ├── documents/
│   │   ├── page.tsx
│   │   └── query/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   └── api.ts
└── package.json
```

## Notes

- The SQLite database is automatically created on first run
- All AI calls use OpenRouter API with the specified model
- The frontend connects to `http://localhost:8000` by default
- CORS is configured to allow requests from `http://localhost:3000`
- Documents are stored in `backend/uploads/{company_id}/`
- Supports both SQLite (default) and PostgreSQL (set `DATABASE_URL` env var)
- Document embeddings are cached for performance
- File upload limit: 50MB per file
- Supported file types: PDF, DOCX, TXT, CSV
