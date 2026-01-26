'use client';

import { useState, useEffect } from 'react';
import {
  createInterview,
  getInterviews,
  suggestSlots,
  generateQuestions,
  analyzeFit,
  confirmInterview,
  Interview,
  SlotSuggestion,
} from '@/lib/api';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [preferredDates, setPreferredDates] = useState('');
  const [interviewerAvailability, setInterviewerAvailability] = useState('');

  // AI features state
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<SlotSuggestion[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [fitScore, setFitScore] = useState<number | null>(null);
  const [fitReasoning, setFitReasoning] = useState('');
  const [candidateResume, setCandidateResume] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const data = await getInterviews();
      setInterviews(data);
    } catch (error) {
      console.error('Error loading interviews:', error);
    }
  };

  const handleCreateInterview = async () => {
    if (!candidateName || !candidateEmail || !interviewerName || !interviewerEmail || !jobTitle || !preferredDates) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createInterview(
        candidateName,
        candidateEmail,
        interviewerName,
        interviewerEmail,
        jobTitle,
        preferredDates
      );
      setCandidateName('');
      setCandidateEmail('');
      setInterviewerName('');
      setInterviewerEmail('');
      setJobTitle('');
      setPreferredDates('');
      setShowForm(false);
      await loadInterviews();
    } catch (error) {
      console.error('Error creating interview:', error);
      alert('Failed to create interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestSlots = async (interview: Interview) => {
    if (!interviewerAvailability.trim()) {
      alert('Please enter interviewer availability');
      return;
    }

    setLoading(true);
    try {
      const result = await suggestSlots(interview.id, interview.preferred_dates, interviewerAvailability);
      setSuggestedSlots(result.suggestions);
      setSelectedInterview(interview);
    } catch (error) {
      console.error('Error suggesting slots:', error);
      alert('Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSlot = async (interview: Interview, slot: SlotSuggestion) => {
    setLoading(true);
    try {
      await confirmInterview(interview.id, slot.date, slot.time);
      setSuggestedSlots([]);
      setSelectedInterview(null);
      await loadInterviews();
      alert('Interview confirmed successfully!');
    } catch (error) {
      console.error('Error confirming interview:', error);
      alert('Failed to confirm interview');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!jobTitle.trim() || !candidateResume.trim()) {
      alert('Please enter job title and candidate resume');
      return;
    }

    setLoading(true);
    try {
      const result = await generateQuestions(jobTitle, candidateResume);
      setQuestions(result.questions);
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeFit = async () => {
    if (!jobRequirements.trim() || !candidateResume.trim()) {
      alert('Please enter job requirements and candidate background');
      return;
    }

    setLoading(true);
    try {
      const result = await analyzeFit(jobRequirements, candidateResume);
      setFitScore(result.fit_score);
      setFitReasoning(result.reasoning);
    } catch (error) {
      console.error('Error analyzing fit:', error);
      alert('Failed to analyze fit');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview Scheduling AI</h1>
              <p className="text-gray-600">AI-powered interview scheduling, question generation, and candidate fit analysis</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showForm ? 'Cancel' : '+ Schedule Interview'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Schedule New Interview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name *</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Email *</label>
                <input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer Name *</label>
                <input
                  type="text"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer Email *</label>
                <input
                  type="email"
                  value={interviewerEmail}
                  onChange={(e) => setInterviewerEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Dates *</label>
                <textarea
                  value={preferredDates}
                  onChange={(e) => setPreferredDates(e.target.value)}
                  placeholder="e.g., 2024-01-15, 2024-01-16, 2024-01-17 or any format"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <button
              onClick={handleCreateInterview}
              disabled={loading}
              className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Interview'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Tools Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Generate Questions */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Generate Interview Questions</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Developer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Resume</label>
                  <textarea
                    value={candidateResume}
                    onChange={(e) => setCandidateResume(e.target.value)}
                    placeholder="Paste candidate resume..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                    rows={4}
                  />
                </div>
                <button
                  onClick={handleGenerateQuestions}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                >
                  {loading ? 'Generating...' : 'Generate Questions'}
                </button>
                {questions.length > 0 && (
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2 text-sm">Generated Questions:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                      {questions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Analyze Fit */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Analyze Candidate Fit</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Requirements</label>
                  <textarea
                    value={jobRequirements}
                    onChange={(e) => setJobRequirements(e.target.value)}
                    placeholder="Enter job requirements..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Background</label>
                  <textarea
                    value={candidateResume}
                    onChange={(e) => setCandidateResume(e.target.value)}
                    placeholder="Enter candidate background..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleAnalyzeFit}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                >
                  {loading ? 'Analyzing...' : 'Analyze Fit'}
                </button>
                {fitScore !== null && (
                  <div className={`mt-4 p-3 rounded-lg ${getFitScoreColor(fitScore)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Fit Score</span>
                      <span className="text-2xl font-bold">{fitScore.toFixed(1)}/100</span>
                    </div>
                    <p className="text-sm mt-2">{fitReasoning}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interviews List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Scheduled Interviews</h2>
              
              {/* Interviewer Availability Input */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interviewer Availability (for AI suggestions)
                </label>
                <textarea
                  value={interviewerAvailability}
                  onChange={(e) => setInterviewerAvailability(e.target.value)}
                  placeholder="e.g., Available: 2024-01-15 10:00-12:00, 2024-01-16 14:00-16:00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                {interviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No interviews scheduled yet</p>
                ) : (
                  interviews.map((interview) => (
                    <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{interview.candidate_name}</h3>
                          <p className="text-sm text-gray-600">{interview.candidate_email}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Interviewer: {interview.interviewer_name} | Job: {interview.job_title}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(interview.status)}`}>
                          {interview.status.toUpperCase()}
                        </span>
                      </div>

                      {interview.scheduled_date && interview.scheduled_time ? (
                        <div className="mb-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-semibold text-gray-800">
                            Scheduled: {interview.scheduled_date} at {interview.scheduled_time}
                          </p>
                          {interview.meeting_link && (
                            <a
                              href={interview.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:underline"
                            >
                              Meeting Link
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">
                            Preferred: {interview.preferred_dates}
                          </p>
                          <button
                            onClick={() => handleSuggestSlots(interview)}
                            disabled={loading || !interviewerAvailability.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                          >
                            {loading ? 'Loading...' : 'Get AI Suggestions'}
                          </button>
                        </div>
                      )}

                      {selectedInterview?.id === interview.id && suggestedSlots.length > 0 && (
                        <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-3 text-sm">AI Suggested Time Slots:</h4>
                          <div className="space-y-3">
                            {suggestedSlots.map((slot, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-semibold text-gray-800 text-sm">
                                      {slot.date} at {slot.time}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">{slot.reasoning}</p>
                                  </div>
                                  <button
                                    onClick={() => handleConfirmSlot(interview, slot)}
                                    disabled={loading}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                                  >
                                    Confirm
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
