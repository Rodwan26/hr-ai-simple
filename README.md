# HR AI Platform

A comprehensive HR AI Platform featuring **9 intelligent modules** to streamline human resources operations. Built with Next.js, FastAPI, and OpenRouter AI.

## Features

### 1. Help Desk AI
- Instant answers to company policy questions
- AI-powered ticket resolution assistance
- Policy management and versioning
- Smart context retrieval from knowledge base

### 2. Resume Screening AI
- Automated resume parsing and scoring (0-100)
- Detailed AI feedback on candidate qualifications
- Job requirement matching
- Bulk processing capabilities

### 3. Risk Detection AI
- Real-time analysis of communication for toxicity
- Behavioral risk assessment (low/medium/high)
- Early warning system for compliance issues
- Detailed risk reasoning and evidence

### 4. Interview Scheduling AI
- Intelligent scheduling with conflict resolution
- AI-suggested optimal time slots
- Automated interview question generation
- Candidate fit analysis based on resume and requirements

### 5. Document Upload & RAG System
- Enterprise-grade Document Management System
- Support for PDF, DOCX, TXT, CSV formats
- **Hybrid Search**: Combines semantic vector search with keyword matching
- Intelligent chunking and embedding for precise information retrieval
- Source citations for every AI answer

### 6. Onboarding AI (New)
- **Automated Checklists**: Dynamic task generation for new hires
- **AI Assistant**: 24/7 onboarding support chat
- **Progress Tracking**: Real-time status dashboards for HR and managers
- **Personalized Tips**: AI-driven success suggestions based on role

### 7. Leave Management AI (New)
- **Smart Requests**: Policy-aware leave submission
- **Balance Tracking**: Automated accrual and usage monitoring
- **AI Approval Support**: Recommendations for approval/rejection based on team capacity and policy
- **Eligibility Checks**: Instant validation of leave rules

### 8. Payroll AI (New)
- **Automated Calculation**: Salary, tax, and deduction processing
- **Payslip Generation**: Detailed breakdown of earnings
- **AI Explanations**: "Explain my payslip" feature for employees
- **History & Analytics**: Comprehensive payroll records

### 9. Burnout Detection AI (New)
- **Wellness Monitoring**: Tracks key performance and engagement metrics
- **Risk Assessment**: Identifies early signs of employee burnout
- **Proactive Recommendations**: AI-suggested interventions
- **Dashboard**: Visual trends and health indicators

## Tech Stack

- **Frontend**: 
  - Next.js 14 (React Framework)
  - TypeScript
  - Tailwind CSS for styling
  - Recharts for data visualization
- **Backend**: 
  - Python 3.11+
  - FastAPI (High-performance web framework)
  - SQLAlchemy & Pydantic
- **AI & ML**: 
  - OpenRouter API (Access to Liquid LFM, GPT-4, Claude, etc.)
  - Vector Embeddings for RAG
- **Database**: 
  - SQLite (Default/Dev)
  - PostgreSQL (Production ready)

## Setup

### Backend

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment (recommended):
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure Environment:
   - Ensure `.env` contains your `OPENROUTER_API_KEY`
   - Review `DATABASE_URL` if using PostgreSQL

5. Run the server:
```bash
uvicorn app.main:app --reload
```
API runs at `http://localhost:8000`

### Frontend

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```
Frontend runs at `http://localhost:3000`

## API Endpoints

### Help Desk
- `POST /api/helpdesk/ask` - Ask policy question
- `GET /api/helpdesk/tickets` - List tickets
- `POST /api/helpdesk/policies` - Manage policies

### Resume Screening
- `POST /api/jobs` - Create job posting
- `POST /api/jobs/{id}/resumes` - Submit & analyze resume
- `GET /api/jobs` - List jobs

### Risk & Burnout
- `POST /api/risk/analyze/{employee_id}` - Analyze behavioral risk
- `POST /api/risk/check-text` - Toxicity check
- `POST /api/burnout/analyze/{employee_id}` - comprehensive burnout assessment
- `GET /api/burnout/dashboard/{employee_id}` - Get wellness metrics

### Interview Management
- `POST /api/interviews/schedule` - Schedule interview
- `POST /api/interviews/generate-questions` - Generate tailored questions
- `POST /api/interviews/analyze-fit` - Candidate fit scoring

### Onboarding
- `POST /api/onboarding/employees` - Register new hire
- `POST /api/onboarding/employees/{id}/generate-checklist` - Create tasks
- `POST /api/onboarding/employees/{id}/ask` - AI Onboarding Assistant

### Leave & Payroll
- `POST /api/leave/request` - Submit leave request
- `GET /api/leave/balance/{employee_id}` - Check balance
- `POST /api/payroll/calculate` - Run payroll
- `POST /api/payroll/explain` - "Explain this payslip"

### Documents (RAG)
- `POST /api/documents/upload` - Ingest document
- `POST /api/documents/query` - Semantic search & Q/A

## Project Structure

```
hr-ai-platform/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routers/         # API endpoints (9 modules)
│   │   │   ├── onboarding.py
│   │   │   ├── leave.py
│   │   │   ├── payroll.py
│   │   │   ├── burnout.py
│   │   │   └── ... (others)
│   │   ├── services/        # AI logic & Business logic
│   │   │   ├── onboarding_ai.py
│   │   │   ├── leave_ai.py
│   │   │   ├── payroll_ai.py
│   │   │   ├── burnout_ai.py
│   │   │   └── ... (others)
│   │   ├── main.py          # App entry point
│   │   └── database.py      # DB Config
│   ├── requirements.txt
│   └── database.db          # SQLite DB
│
└── frontend/
    ├── app/                 # Next.js Pages
    │   ├── onboarding/
    │   ├── leave/
    │   ├── payroll/
    │   ├── burnout/
    │   └── ... (others)
    ├── lib/
    │   └── api.ts           # Type-safe API client
    └── public/
```

## Notes

- **Authentication**: The platform is currently designed for demonstration/internal use with open access.
- **File Uploads**: Supports files up to 50MB.
- **AI Models**: Configurable via OpenRouter. Default is `liquid/lfm-2.5-1.2b-thinking:free`.
