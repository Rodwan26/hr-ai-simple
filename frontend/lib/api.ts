import { config, getApiUrl } from './config';

const API_BASE_URL = config.apiBaseUrl;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: any;
  timestamp?: string;
}

// Helper to get CSRF token from cookies
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const name = 'csrftoken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

// Client-side sanitization
function sanitize(text: string): string {
  if (!text) return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
/**
 * Custom error class to propagate structured API errors
 */
export class ApiError extends Error {
  public errors: any[];
  public status: number;

  constructor(message: string, status: number, errors: any[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Helper for authenticated fetches with retry logic
async function fetchWithAuth(url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(config.auth.tokenKey) : null;
  const requestId = typeof window !== 'undefined' ? crypto.randomUUID() : 'ssr-req';

  const startTime = Date.now();

  const csrfToken = getCsrfToken();

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    [config.requestIdHeader]: requestId,
    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  } as Record<string, string>;

  try {
    let response = await fetch(url, { ...options, headers });

    const duration = Date.now() - startTime;
    if (duration > config.resilience.slowRequestThreshold) {
      console.warn(`[Performance] Slow request: ${options.method || 'GET'} ${url} (${duration}ms)`);
    }

    // Handle 401 and refresh token logic
    if (response.status === 401 && typeof window !== 'undefined' && retryCount === 0) {
      const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
      if (refreshToken) {
        try {
          const refreshUrl = getApiUrl(`/auth/refresh?refresh_token=${refreshToken}`);
          const refreshResponse = await fetch(refreshUrl, { method: 'POST' });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem(config.auth.tokenKey, data.access_token);
            localStorage.setItem(config.auth.refreshTokenKey, data.refresh_token);

            // Retry with new token
            return fetchWithAuth(url, options, retryCount + 1);
          } else {
            localStorage.removeItem(config.auth.tokenKey);
            localStorage.removeItem(config.auth.refreshTokenKey);
            window.location.href = '/login';
            return response; // Return response to stop chain, though redirect will happen
          }
        } catch (err) {
          console.error('Refresh token error', err);
          // Fall through to error throwing
        }
      } else {
        // No refresh token, direct logout
        localStorage.removeItem(config.auth.tokenKey);
        window.location.href = '/login';
        return response;
      }
    }

    // Enterprise Retry Logic for 5xx errors or Rate Limits (429)
    if ((response.status >= 500 || response.status === 429) && retryCount < config.resilience.maxRetries) {
      const delay = Math.pow(2, retryCount) * config.resilience.retryDelayBase;
      console.log(`[Resilience] Retrying ${url} (Attempt ${retryCount + 1}/${config.resilience.maxRetries}) in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithAuth(url, options, retryCount + 1);
    }

    // Unified Error Handling for standardized and legacy responses
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      // 1. New Structured Error Format: { success: false, errors: [...] }
      if (errorData && errorData.success === false && Array.isArray(errorData.errors)) {
        const firstError = errorData.errors[0]?.msg || 'Request failed';
        throw new ApiError(firstError, response.status, errorData.errors);
      }

      // 2. Legacy ApiResponse error: { success: false, error: { message, ... } }
      if (errorData && errorData.success === false && errorData.error) {
        const { code, message, details } = errorData.error;
        console.error(`[API Error] ${code}: ${message}`, details);
        throw new ApiError(message || 'Request failed', response.status, [{ code, msg: message, details }]);
      }

      // 3. Raw FastAPI error: { detail: "..." } or { detail: [{ ... }] }
      if (errorData.detail) {
        const msg = typeof errorData.detail === 'string' ? errorData.detail : 'Validation failed';
        const errors = Array.isArray(errorData.detail) ? errorData.detail : [{ msg }];
        throw new ApiError(msg, response.status, errors);
      }

      throw new ApiError(errorData.message || 'Request failed', response.status);
    }

    return response;
  } catch (error: any) {
    // If it's already an ApiError, rethrow it
    if (error instanceof ApiError) throw error;

    if (retryCount < config.resilience.maxRetries && error.name === 'TypeError') { // Likely network error
      console.log(`[Resilience] Network error detected, retrying...`);
      await new Promise(resolve => setTimeout(resolve, config.resilience.retryDelayBase));
      return fetchWithAuth(url, options, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Standardized data extraction for ApiResponse
 */
async function processResponse<T>(response: Response): Promise<T> {
  const json: ApiResponse<T> = await response.json();
  if (json.success) {
    return json.data as T;
  }
  // In case success is false but didn't throw in fetchWithAuth (unlikely given current logic)
  throw new Error(json.error?.message || 'Data extraction failed');
}

export interface AskRequest {
  question: string;
}

export interface AskResponse {
  answer: string;
  ticket_id: number;
}

export interface Ticket {
  id: number;
  question: string;
  ai_response: string;
  created_at: string;
}

export interface Job {
  id: number;
  title: string;
  description?: string;
  requirements: string;
  roles_responsibilities?: string;
  desired_responsibilities?: string;
  candidate_profile?: {
    education: string;
    experience: string;
    skills: string[];
  };
  department?: string;
  location?: string;
  employment_type?: string;
  experience_level?: string;
  required_skills?: string[];
  is_active: boolean;
}

export interface AIEvidence {
  signal: string;
  proof: string;
  assessment: string;
}

export interface Resume {
  id: number;
  job_id: number;
  name: string;
  resume_text: string;
  anonymized_text?: string;
  ai_score: number;
  ai_feedback: string;
  rejection_reason?: string;
  ai_evidence?: AIEvidence[];
  status: string;
  trust_metadata?: TrustMetadata;
}

export interface WellbeingAssessment {
  support_priority: string;
  details: string;
  recommendations: string[];
  trust_metadata?: any;
}

export interface FrictionCheck {
  has_friction: boolean;
  explanation: string;
  support_hint: string;
  trust_metadata?: any;
}

// Backward compatibility or internal aliases
export interface RiskAnalysis extends WellbeingAssessment { }
export interface ToxicityCheck extends FrictionCheck { }

// --- AI Trust Layer Types ---

export interface SourceCitation {
  source_file: string;
  chunk_id: number;
  text_snippet: string;
  relevance_score: number;
}

export interface TrustMetadata {
  confidence_score: number;
  confidence_level: 'low' | 'medium' | 'high';
  sources: SourceCitation[];
  ai_model: string;
  model_version?: string;
  reasoning?: string;
  timestamp?: string;
  request_id?: string;
  is_fallback: boolean;
  fallback_reason?: string;
  requires_human_confirmation?: boolean;
}

export interface TrustedAIResponse<T = any> {
  content: string;
  trust: TrustMetadata;
  data?: T;
}

// --- Domain Interfaces ---

export interface Interview {
  id: number;
  candidate_name: string;
  candidate_email: string;
  interviewer_name: string;
  interviewer_email: string;
  job_title: string;
  preferred_dates: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  meeting_link: string | null;
  status: string;
  ai_suggestion: string | null;
  created_at: string;
}

export interface SlotSuggestion {
  date: string;
  time: string;
  reasoning: string;
}

export interface InterviewKit {
  id: number;
  interview_id: number;
  job_title: string;
  questions: Array<{ id: number; text: string; criteria: string; category: string }>;
  evaluation_criteria: Array<{ category: string; weight: number; description: string }>;
  status: string;
}

export interface InterviewFeedback {
  id: number;
  interview_id: number;
  interviewer_email: string;
  scores: Record<number, number>;
  overall_score: number;
  strengths: string;
  weaknesses: string;
  recommendation: 'hire' | 'reconsider' | 'reject';
  comments: string;
  trust_metadata?: any;
}

// Help Desk API
export async function askQuestion(question: string): Promise<AskResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/helpdesk/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) throw new Error('Failed to ask question');
  return response.json();
}

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/helpdesk/tickets`);
  if (!response.ok) throw new Error('Failed to fetch tickets');
  return response.json();
}

// Resume API
export async function createJob(payload: {
  title: string;
  requirements: string;
  description?: string;
  department?: string;
  location?: string;
  employment_type?: string;
  experience_level?: string;
  required_skills?: string[];
}): Promise<Job> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create job');
  return response.json();
}

export async function getJobs(): Promise<Job[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/jobs`);
  if (!response.ok) throw new Error('Failed to fetch jobs');
  return response.json();
}

export async function updateJob(jobId: number, payload: Partial<Job>): Promise<Job> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/jobs/${jobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update job');
  return response.json();
}

export async function deleteJob(jobId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/jobs/${jobId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete job');
}

export async function submitResume(jobId: number, name: string, resumeText: string): Promise<Resume> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/jobs/${jobId}/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, resume_text: resumeText }),
  });
  if (!response.ok) throw new Error('Failed to submit resume');
  return response.json();
}

export async function getResumes(jobId: number): Promise<Resume[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/jobs/${jobId}/resumes`);
  if (!response.ok) throw new Error('Failed to fetch resumes');
  return response.json();
}

export async function updateResumeStatus(jobId: number, resumeId: number, status: string): Promise<Resume> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/jobs/${jobId}/resumes/${resumeId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update resume status');
  return response.json();
}

// Wellbeing API (formerly Risk)
export async function analyzeWellbeing(employeeId: number): Promise<TrustedAIResponse<WellbeingAssessment>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/burnout/analyze/${employeeId}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to analyze wellbeing');
  return response.json();
}

export async function checkFriction(text: string): Promise<TrustedAIResponse<FrictionCheck>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/risk/check-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('Failed to check friction');
  return response.json();
}

export async function getWellbeingHistory(employeeId: number): Promise<WellbeingAssessment[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/wellbeing/assessments/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch wellbeing history');
  return response.json();
}

// Aliases for compatibility
export const analyzeRisk = analyzeWellbeing;
export const checkToxicity = checkFriction;

// Interview API
export async function createInterview(
  candidateName: string,
  candidateEmail: string,
  interviewerName: string,
  interviewerEmail: string,
  jobTitle: string,
  preferredDates: string
): Promise<Interview> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/interviews/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      interviewer_name: interviewerName,
      interviewer_email: interviewerEmail,
      job_title: jobTitle,
      preferred_dates: preferredDates,
    }),
  });
  if (!response.ok) throw new Error('Failed to create interview');
  return response.json();
}

export async function getInterviews(): Promise<Interview[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/interviews`);
  if (!response.ok) throw new Error('Failed to fetch interviews');
  return response.json();
}

export async function suggestSlots(
  interviewId: number,
  candidatePreferences: string,
  interviewerAvailability: string
): Promise<TrustedAIResponse<{ suggestions: SlotSuggestion[] }>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/interviews/${interviewId}/suggest-slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_preferences: candidatePreferences,
      interviewer_availability: interviewerAvailability,
    }),
  });
  if (!response.ok) throw new Error('Failed to suggest slots');
  return response.json();
}

export async function generateQuestions(jobTitle: string, candidateResume: string): Promise<TrustedAIResponse<{ questions: string[] }>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/interviews/generate-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_title: jobTitle,
      candidate_resume: candidateResume,
    }),
  });
  if (!response.ok) throw new Error('Failed to generate questions');
  return response.json();
}

export async function analyzeFit(jobRequirements: string, candidateBackground: string): Promise<TrustedAIResponse<{ fit_score: number; reasoning: string }>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/interviews/analyze-fit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_requirements: jobRequirements,
      candidate_background: candidateBackground,
    }),
  });
  if (!response.ok) throw new Error('Failed to analyze fit');
  return response.json();
}

export async function confirmInterview(
  interviewId: number,
  scheduledDate: string,
  scheduledTime: string,
  meetingLink?: string
): Promise<Interview> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/interviews/${interviewId}/confirm`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      meeting_link: meetingLink || null,
    }),
  });
  if (!response.ok) throw new Error('Failed to confirm interview');
  return response.json();
}

export async function generateInterviewKit(interviewId: number): Promise<InterviewKit> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/interviews/${interviewId}/generate-kit`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to generate kit');
  return response.json();
}

export async function getInterviewKit(interviewId: number): Promise<InterviewKit> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/interviews/${interviewId}/kit`);
  if (!response.ok) throw new Error('Failed to fetch kit');
  return response.json();
}

export async function submitInterviewFeedback(payload: {
  interview_id: number;
  scores: Record<number, number>;
  overall_score: number;
  strengths: string;
  weaknesses: string;
  recommendation: string;
  comments: string;
}): Promise<InterviewFeedback> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/interviews/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to submit feedback');
  return response.json();
}

export async function getInterviewAnalysis(interviewId: number): Promise<any> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/interviews/${interviewId}/analysis`);
  if (!response.ok) throw new Error('Failed to fetch analysis');
  return response.json();
}

// Documents API
export interface Document {
  id: number;
  filename: string;
  file_path: string;
  file_type: string;
  upload_date: string;
  uploaded_by: string | null;
  company_id: number;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  chunk_text: string;
  chunk_index: number;
}

export interface DocumentQueryRequest {
  question: string;
  company_id: number;
  document_ids?: number[];
}

export interface DocumentQueryResponse {
  answer: string;
  sources: Array<{
    document_id: number;
    filename: string;
    chunk_index: number;
    similarity: number;
    combined_score: number;
  }>;
  confidence: number;
  trust_metadata_obj?: TrustMetadata; // From backend
}

export async function uploadDocument(
  file: File,
  companyId: number = 1,
  uploadedBy: string = 'system'
): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  // Backend relies on token for org_id and user info. 
  // Explicitly sending them is redundant and potentially confusing if mismatched.

  const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload document');
  }

  return response.json();
}

export async function getDocuments(companyId: number = 1): Promise<Document[]> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/documents?company_id=${companyId}`);
    if (!response.ok) {
      console.error('Failed to fetch documents');
      return [];
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

export async function queryDocuments(
  question: string,
  companyId: number = 1,
  documentIds?: number[]
): Promise<TrustedAIResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      company_id: companyId,
      document_ids: documentIds,
    }),
  });
  if (!response.ok) throw new Error('Failed to query documents');
  return response.json();
}

export async function deleteDocument(documentId: number, companyId: number = 1): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/${documentId}?company_id=${companyId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete document');
}

export async function getDocumentChunks(documentId: number, companyId: number = 1): Promise<DocumentChunk[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/documents/${documentId}/chunks?company_id=${companyId}`);
  if (!response.ok) throw new Error('Failed to fetch document chunks');
  return response.json();
}



// Onboarding API
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed';
export type OnboardingTaskCategory = 'documentation' | 'training' | 'setup' | 'meeting' | 'other';

// Payroll API
export async function lockPayroll(month: number, year: number): Promise<any> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/payroll/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, year }),
  });
  // Handle 400 specifically if needed, but fetchWithAuth throws on error
  if (!response.ok) throw new Error('Failed to lock payroll');
  return response.json();
}

export interface OnboardingEmployee {
  id: number;
  employee_name: string;
  employee_email: string;
  position: string;
  department: string;
  start_date: string; // ISO date
  manager_name: string | null;
  status: OnboardingStatus;
  completion_percentage: number;
  company_id: number;
  created_at: string;
}

export interface OnboardingTask {
  id: number;
  employee_id: number;
  task_title: string;
  task_description: string;
  task_category: OnboardingTaskCategory;
  is_completed: boolean;
  due_date: string | null; // ISO date
  completed_at: string | null;
  task_order: number;
  created_at: string;
}

export interface OnboardingDocument {
  id: number;
  employee_id: number;
  document_name: string;
  document_type: string;
  is_signed: boolean;
  signed_at: string | null;
  required_by: string | null;
}

export interface OnboardingChat {
  id: number;
  employee_id: number;
  question: string;
  ai_response: string;
  is_helpful: boolean | null;
  created_at: string;
}

export interface OnboardingAskResponse {
  chat_id: number;
  answer: string;
  sources: Array<{
    document_id: number;
    filename: string;
    chunk_index: number;
    similarity: number;
    combined_score: number;
  }>;
  confidence: number;
}

export interface OnboardingProgress {
  employee_id: number;
  completion_percentage: number;
  status: OnboardingStatus;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: Array<{
    task_id: number;
    title: string;
    due_date: string;
    category: string;
  }>;
  next_actions: Array<{
    task_id: number;
    title: string;
    due_date: string | null;
    category: string;
  }>;
}

export interface OnboardingTips {
  tips: string[];
  next_actions: string[];
  motivation: string;
  progress: OnboardingProgress;
}

export async function createOnboardingEmployee(payload: {
  employee_name: string;
  employee_email: string;
  position: string;
  department: string;
  start_date: string; // ISO date
  manager_name?: string;
  company_id?: number;
}): Promise<OnboardingEmployee> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create onboarding employee');
  return response.json();
}

export async function listOnboardingEmployees(): Promise<OnboardingEmployee[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees`);
  if (!response.ok) throw new Error('Failed to fetch onboarding employees');
  return response.json();
}

export async function getOnboardingEmployee(employeeId: number): Promise<OnboardingEmployee> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch onboarding employee');
  return response.json();
}

export async function updateOnboardingEmployee(
  employeeId: number,
  payload: Partial<{
    employee_name: string;
    employee_email: string;
    position: string;
    department: string;
    start_date: string;
    manager_name: string | null;
    status: OnboardingStatus;
  }>
): Promise<OnboardingEmployee> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update onboarding employee');
  return response.json();
}

export async function deleteOnboardingEmployee(employeeId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete onboarding employee');
}

export async function generateOnboardingChecklist(employeeId: number): Promise<TrustedAIResponse<OnboardingTask[]>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/generate-checklist`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to generate onboarding checklist');
  return response.json();
}

export async function getOnboardingTasks(employeeId: number): Promise<OnboardingTask[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/tasks`);
  if (!response.ok) throw new Error('Failed to fetch onboarding tasks');
  return response.json();
}

export async function createOnboardingTask(
  employeeId: number,
  payload: {
    task_title: string;
    task_description: string;
    task_category?: OnboardingTaskCategory;
    due_date?: string | null;
  }
): Promise<OnboardingTask> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create onboarding task');
  return response.json();
}

export async function completeOnboardingTask(taskId: number): Promise<OnboardingTask> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/tasks/${taskId}/complete`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Failed to complete onboarding task');
  return response.json();
}

export async function deleteOnboardingTask(taskId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete onboarding task');
}

export async function askOnboardingQuestion(employeeId: number, question: string): Promise<TrustedAIResponse<OnboardingAskResponse>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) throw new Error('Failed to ask onboarding question');
  return response.json();
}

export async function getOnboardingChatHistory(employeeId: number): Promise<OnboardingChat[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/chat-history`);
  if (!response.ok) throw new Error('Failed to fetch onboarding chat history');
  return response.json();
}

export async function setOnboardingChatFeedback(chatId: number, isHelpful: boolean): Promise<OnboardingChat> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/chats/${chatId}/feedback`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_helpful: isHelpful }),
  });
  if (!response.ok) throw new Error('Failed to set chat feedback');
  return response.json();
}

export async function getOnboardingTips(employeeId: number): Promise<OnboardingTips> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/tips`);
  if (!response.ok) throw new Error('Failed to fetch onboarding tips');
  return response.json();
}

export async function getOnboardingProgress(employeeId: number): Promise<OnboardingProgress> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/progress`);
  if (!response.ok) throw new Error('Failed to fetch onboarding progress');
  return response.json();
}

export async function getOnboardingDocuments(employeeId: number): Promise<OnboardingDocument[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/documents`);
  if (!response.ok) throw new Error('Failed to fetch onboarding documents');
  return response.json();
}

export async function signOnboardingDocument(docId: number): Promise<OnboardingDocument> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/documents/${docId}/sign`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Failed to sign document');
  return response.json();
}

// Leave Management API

export interface LeaveRequest {
  id: number;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  ai_decision: string | null;
  ai_reasoning: string | null;
  created_at: string;
}

export interface LeaveBalance {
  id: number;
  employee_id: string;
  leave_type: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
}

export interface LeaveEligibility {
  eligible: boolean;
  reason: string;
  balance?: LeaveBalance;
  policy?: any;
}

export async function submitLeaveRequest(payload: {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
}): Promise<LeaveRequest> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/leave/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.json();
    throw new Error(errorText.detail || 'Failed to submit leave request');
  }
  return response.json();
}

export async function getLeaveRequests(employeeId?: string, status?: string): Promise<LeaveRequest[]> {
  const params = new URLSearchParams();
  if (employeeId) params.append('employee_id', employeeId);
  if (status) params.append('status', status);

  const response = await fetchWithAuth(`${API_BASE_URL}/api/leave/requests?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch leave requests');
  return response.json();
}

export async function getLeaveBalance(employeeId: string): Promise<LeaveBalance[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/leave/balance/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch leave balance');
  return response.json();
}

export async function approveLeaveRequest(requestId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/leave/requests/${requestId}/approve`, {
    method: 'PUT'
  });
  if (!response.ok) {
    const errorText = await response.json();
    throw new Error(errorText.detail || 'Failed to approve request');
  }
}

export async function rejectLeaveRequest(requestId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/leave/requests/${requestId}/reject`, {
    method: 'PUT'
  });
  if (!response.ok) throw new Error('Failed to reject request');
}

export async function checkLeaveEligibility(employeeId: string, leaveType: string, daysCount: number): Promise<LeaveEligibility> {
  const params = new URLSearchParams({
    employee_id: employeeId,
    leave_type: leaveType,
    days_count: daysCount.toString()
  });
  const response = await fetchWithAuth(`${API_BASE_URL}/api/leave/check-eligibility?${params.toString()}`, {
    method: 'POST'
  });
  return response.json();
}

// Payroll API

export interface Payroll {
  id: number;
  employee_id: string;
  month: number;
  year: number;
  base_salary: number;
  bonuses: number;
  deductions: number;
  net_salary: number;
  payment_date: string | null;
  status: string;
  created_at: string;
  components?: SalaryComponent[];
}

export interface SalaryComponent {
  id: number;
  component_type: string;
  name: string;
  amount: number;
  description: string;
}

export async function calculatePayroll(employeeId: string, month: number, year: number, baseSalary: number): Promise<Payroll> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/payroll/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: employeeId,
      month,
      year,
      base_salary: baseSalary
    }),
  });
  if (!response.ok) throw new Error('Failed to calculate payroll');
  return response.json();
}

export async function getPayrollHistory(employeeId: string): Promise<Payroll[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/payroll/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch payroll history');
  return response.json();
}

export async function getPayrollDetails(id: number): Promise<{ payroll: Payroll, components: SalaryComponent[] }> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/payroll/${id}/details`);
  if (!response.ok) throw new Error('Failed to fetch payroll details');
  return response.json();
}

export async function askPayrollQuestion(question: string, context?: string): Promise<TrustedAIResponse<{ answer: string }>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/payroll/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  });
  if (!response.ok) throw new Error('Failed to ask question');
  return response.json();
}

export async function explainPayslip(payrollId: number): Promise<TrustedAIResponse<{ explanation: string }>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/payroll/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payroll_id: payrollId }),
  });
  if (!response.ok) throw new Error('Failed to explain payslip');
  return response.json();
}

export async function calculateBulkPayroll(month: number, year: number): Promise<Payroll[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/payroll/calculate-bulk?month=${month}&year=${year}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to run bulk payroll');
  return response.json();
}

// Burnout API

export interface PerformanceMetric {
  id: number;
  employee_id: number;
  metric_type: string;
  value: number;
  date: string;
  created_at: string;
}

export interface BurnoutAssessment {
  id: number;
  employee_id: number;
  support_priority: string; // Formerly risk_level
  indicators: string[];
  recommendations: string[];
  ai_analysis: string;
  trust_metadata?: any;
  assessed_at: string;
}

export async function trackMetric(payload: {
  employee_id: number;
  metric_type: string;
  value: number;
  date: string;
}): Promise<PerformanceMetric> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/burnout/track-metric`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to track metric');
  return response.json();
}

export async function getMetrics(employeeId: number): Promise<PerformanceMetric[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/burnout/metrics/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch metrics');
  return response.json();
}

export async function analyzeBurnout(employeeId: number): Promise<BurnoutAssessment> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/burnout/analyze/${employeeId}`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to analyze burnout');
  return response.json();
}

export async function getAssessments(employeeId: number): Promise<BurnoutAssessment[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/burnout/assessments/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch assessments');
  return response.json();
}

export async function getBurnoutDashboard(employeeId: number): Promise<{
  assessment: BurnoutAssessment | null;
  metrics: PerformanceMetric[];
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/burnout/dashboard/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch dashboard data');
  return response.json();
}

// Audit API

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  user_id: number | null;
  user_role: string | null;
  details: any;
  ai_recommended: boolean;
  timestamp: string;
}

export async function getAuditLogs(entityType?: string, action?: string): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (entityType) params.append('entity_type', entityType);
  if (action) params.append('action', action);

  const response = await fetchWithAuth(`${API_BASE_URL}/api/audit?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
}
// Bulk Operations

export interface BulkPayrollValidationResponse {
  valid: boolean;
  errors: Array<{ employee_id: number; error: string; name: string }>;
  warnings: Array<{ employee_id: number; warning: string; name: string }>;
}

export async function validateAllPayroll(month: number, year: number): Promise<BulkPayrollValidationResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/payroll/validate-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, year }),
  });
  if (!response.ok) throw new Error('Failed to validate payroll');
  return response.json();
}

export async function downloadAllPayslips(month: number, year: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/payroll/payslips/pdf-all?month=${month}&year=${year}`, {
    method: 'GET',
  });

  if (!response.ok) throw new Error('Failed to download payslips');

  // Trigger download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payslips_${year}_${month}.zip`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export interface BulkOnboardingResponse {
  message: string;
  successful_ids: number[];
  failed_ids: number[];
}

export async function applyOnboardingTemplateBulk(templateId: number, employeeIds: number[]): Promise<BulkOnboardingResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/employees/apply-template-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template_id: templateId, employee_ids: employeeIds }),
  });
  if (!response.ok) throw new Error('Failed to apply template bulk');
  return response.json();
}

export interface OnboardingTemplate {
  id: number;
  name: string;
  department_id: number | null;
  tasks: any[];
  is_active: boolean;
}

export async function listOnboardingTemplates(departmentId?: number): Promise<OnboardingTemplate[]> {
  const params = new URLSearchParams();
  if (departmentId) {
    params.append('department_id', departmentId.toString());
  }

  const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/templates?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
}

