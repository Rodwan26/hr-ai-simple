const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  requirements: string;
}

export interface Resume {
  id: number;
  job_id: number;
  name: string;
  resume_text: string;
  ai_score: number;
  ai_feedback: string;
}

export interface RiskAnalysis {
  risk_level: string;
  details: string;
}

export interface ToxicityCheck {
  is_toxic: boolean;
  explanation: string;
}

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

// Help Desk API
export async function askQuestion(question: string): Promise<AskResponse> {
  const response = await fetch(`${API_BASE_URL}/api/helpdesk/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) throw new Error('Failed to ask question');
  return response.json();
}

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(`${API_BASE_URL}/api/helpdesk/tickets`);
  if (!response.ok) throw new Error('Failed to fetch tickets');
  return response.json();
}

// Resume API
export async function createJob(title: string, requirements: string): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, requirements }),
  });
  if (!response.ok) throw new Error('Failed to create job');
  return response.json();
}

export async function getJobs(): Promise<Job[]> {
  const response = await fetch(`${API_BASE_URL}/api/jobs`);
  if (!response.ok) throw new Error('Failed to fetch jobs');
  return response.json();
}

export async function submitResume(jobId: number, name: string, resumeText: string): Promise<Resume> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, resume_text: resumeText }),
  });
  if (!response.ok) throw new Error('Failed to submit resume');
  return response.json();
}

export async function getResumes(jobId: number): Promise<Resume[]> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/resumes`);
  if (!response.ok) throw new Error('Failed to fetch resumes');
  return response.json();
}

// Risk API
export async function analyzeRisk(employeeId: number): Promise<RiskAnalysis> {
  const response = await fetch(`${API_BASE_URL}/api/risk/analyze/${employeeId}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to analyze risk');
  return response.json();
}

export async function checkToxicity(text: string): Promise<ToxicityCheck> {
  const response = await fetch(`${API_BASE_URL}/api/risk/check-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('Failed to check toxicity');
  return response.json();
}

// Interview API
export async function createInterview(
  candidateName: string,
  candidateEmail: string,
  interviewerName: string,
  interviewerEmail: string,
  jobTitle: string,
  preferredDates: string
): Promise<Interview> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/schedule`, {
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
  const response = await fetch(`${API_BASE_URL}/api/interviews`);
  if (!response.ok) throw new Error('Failed to fetch interviews');
  return response.json();
}

export async function suggestSlots(
  interviewId: number,
  candidatePreferences: string,
  interviewerAvailability: string
): Promise<{ suggestions: SlotSuggestion[] }> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}/suggest-slots`, {
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

export async function generateQuestions(jobTitle: string, candidateResume: string): Promise<{ questions: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/generate-questions`, {
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

export async function analyzeFit(jobRequirements: string, candidateBackground: string): Promise<{ fit_score: number; reasoning: string }> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/analyze-fit`, {
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
  const response = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}/confirm`, {
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
}

export async function uploadDocument(
  file: File,
  companyId: number = 1,
  uploadedBy: string = 'system'
): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('company_id', companyId.toString());
  formData.append('uploaded_by', uploadedBy);

  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
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
    const response = await fetch(`${API_BASE_URL}/api/documents?company_id=${companyId}`);
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
): Promise<DocumentQueryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/documents/query`, {
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
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}?company_id=${companyId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete document');
}

export async function getDocumentChunks(documentId: number, companyId: number = 1): Promise<DocumentChunk[]> {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/chunks?company_id=${companyId}`);
  if (!response.ok) throw new Error('Failed to fetch document chunks');
  return response.json();
}

// Onboarding API
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed';
export type OnboardingTaskCategory = 'documentation' | 'training' | 'setup' | 'meeting' | 'other';

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
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create onboarding employee');
  return response.json();
}

export async function listOnboardingEmployees(): Promise<OnboardingEmployee[]> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees`);
  if (!response.ok) throw new Error('Failed to fetch onboarding employees');
  return response.json();
}

export async function getOnboardingEmployee(employeeId: number): Promise<OnboardingEmployee> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees/${employeeId}`);
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
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees/${employeeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update onboarding employee');
  return response.json();
}

export async function deleteOnboardingEmployee(employeeId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees/${employeeId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete onboarding employee');
}

export async function generateOnboardingChecklist(employeeId: number): Promise<OnboardingTask[]> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/generate-checklist`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to generate onboarding checklist');
  return response.json();
}

export async function getOnboardingTasks(employeeId: number): Promise<OnboardingTask[]> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/tasks`);
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
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create onboarding task');
  return response.json();
}

export async function completeOnboardingTask(taskId: number): Promise<OnboardingTask> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/tasks/${taskId}/complete`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Failed to complete onboarding task');
  return response.json();
}

export async function deleteOnboardingTask(taskId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete onboarding task');
}

export async function askOnboardingQuestion(employeeId: number, question: string): Promise<OnboardingAskResponse> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) throw new Error('Failed to ask onboarding question');
  return response.json();
}

export async function getOnboardingChatHistory(employeeId: number): Promise<OnboardingChat[]> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/chat-history`);
  if (!response.ok) throw new Error('Failed to fetch onboarding chat history');
  return response.json();
}

export async function setOnboardingChatFeedback(chatId: number, isHelpful: boolean): Promise<OnboardingChat> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/chats/${chatId}/feedback`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_helpful: isHelpful }),
  });
  if (!response.ok) throw new Error('Failed to set chat feedback');
  return response.json();
}

export async function getOnboardingTips(employeeId: number): Promise<OnboardingTips> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/tips`);
  if (!response.ok) throw new Error('Failed to fetch onboarding tips');
  return response.json();
}

export async function getOnboardingProgress(employeeId: number): Promise<OnboardingProgress> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/employees/${employeeId}/progress`);
  if (!response.ok) throw new Error('Failed to fetch onboarding progress');
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
  const response = await fetch(`${API_BASE_URL}/api/leave/request`, {
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

  const response = await fetch(`${API_BASE_URL}/api/leave/requests?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch leave requests');
  return response.json();
}

export async function getLeaveBalance(employeeId: string): Promise<LeaveBalance[]> {
  const response = await fetch(`${API_BASE_URL}/api/leave/balance/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch leave balance');
  return response.json();
}

export async function approveLeaveRequest(requestId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/leave/requests/${requestId}/approve`, {
    method: 'PUT'
  });
  if (!response.ok) {
    const errorText = await response.json();
    throw new Error(errorText.detail || 'Failed to approve request');
  }
}

export async function rejectLeaveRequest(requestId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/leave/requests/${requestId}/reject`, {
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
  const response = await fetch(`${API_BASE_URL}/api/leave/check-eligibility?${params.toString()}`, {
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
  const response = await fetch(`${API_BASE_URL}/api/payroll/calculate`, {
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
  const response = await fetch(`${API_BASE_URL}/api/payroll/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch payroll history');
  return response.json();
}

export async function getPayrollDetails(id: number): Promise<{ payroll: Payroll, components: SalaryComponent[] }> {
  const response = await fetch(`${API_BASE_URL}/api/payroll/${id}/details`);
  if (!response.ok) throw new Error('Failed to fetch payroll details');
  return response.json();
}

export async function askPayrollQuestion(question: string, context?: string): Promise<{ answer: string }> {
  const response = await fetch(`${API_BASE_URL}/api/payroll/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  });
  if (!response.ok) throw new Error('Failed to ask question');
  return response.json();
}

export async function explainPayslip(payrollId: number): Promise<{ explanation: string }> {
  const response = await fetch(`${API_BASE_URL}/api/payroll/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payroll_id: payrollId }),
  });
  if (!response.ok) throw new Error('Failed to explain payslip');
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
  risk_level: string;
  indicators: string[];
  recommendations: string[];
  ai_analysis: string;
  assessed_at: string;
}

export async function trackMetric(payload: {
  employee_id: number;
  metric_type: string;
  value: number;
  date: string;
}): Promise<PerformanceMetric> {
  const response = await fetch(`${API_BASE_URL}/api/burnout/track-metric`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to track metric');
  return response.json();
}

export async function getMetrics(employeeId: number): Promise<PerformanceMetric[]> {
  const response = await fetch(`${API_BASE_URL}/api/burnout/metrics/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch metrics');
  return response.json();
}

export async function analyzeBurnout(employeeId: number): Promise<BurnoutAssessment> {
  const response = await fetch(`${API_BASE_URL}/api/burnout/analyze/${employeeId}`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to analyze burnout');
  return response.json();
}

export async function getAssessments(employeeId: number): Promise<BurnoutAssessment[]> {
  const response = await fetch(`${API_BASE_URL}/api/burnout/assessments/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch assessments');
  return response.json();
}

export async function getBurnoutDashboard(employeeId: number): Promise<{
  assessment: BurnoutAssessment | null;
  metrics: PerformanceMetric[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/burnout/dashboard/${employeeId}`);
  if (!response.ok) throw new Error('Failed to fetch dashboard data');
  return response.json();
}
