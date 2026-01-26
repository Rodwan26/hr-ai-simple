'use client';

import { useState, useEffect } from 'react';
import { createJob, getJobs, submitResume, getResumes, Job, Resume } from '@/lib/api';

export default function ResumesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Job form state
  const [jobTitle, setJobTitle] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');

  // Resume form state
  const [resumeName, setResumeName] = useState('');
  const [resumeText, setResumeText] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadResumes(selectedJobId);
    }
  }, [selectedJobId]);

  const loadJobs = async () => {
    try {
      const data = await getJobs();
      setJobs(data);
      if (data.length > 0 && !selectedJobId) {
        setSelectedJobId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadResumes = async (jobId: number) => {
    try {
      const data = await getResumes(jobId);
      setResumes(data);
    } catch (error) {
      console.error('Error loading resumes:', error);
    }
  };

  const handleCreateJob = async () => {
    if (!jobTitle.trim() || !jobRequirements.trim()) return;
    
    setLoading(true);
    try {
      await createJob(jobTitle, jobRequirements);
      setJobTitle('');
      setJobRequirements('');
      setShowJobForm(false);
      await loadJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResume = async () => {
    if (!selectedJobId || !resumeName.trim() || !resumeText.trim()) return;
    
    setLoading(true);
    try {
      await submitResume(selectedJobId, resumeName, resumeText);
      setResumeName('');
      setResumeText('');
      setShowResumeForm(false);
      await loadResumes(selectedJobId);
    } catch (error) {
      console.error('Error submitting resume:', error);
      alert('Failed to submit resume');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Resume Screening AI</h1>
              <p className="text-gray-600">AI-powered resume analysis against job requirements</p>
            </div>
            <button
              onClick={() => setShowJobForm(!showJobForm)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {showJobForm ? 'Cancel' : '+ New Job'}
            </button>
          </div>
        </div>

        {showJobForm && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Job</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                <textarea
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                  placeholder="List job requirements, skills, experience needed..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={6}
                />
              </div>
              <button
                onClick={handleCreateJob}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Jobs</h2>
              <div className="space-y-2">
                {jobs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No jobs yet. Create one!</p>
                ) : (
                  jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedJobId === job.id
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <p className="font-semibold text-gray-800">{job.title}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedJobId ? (
              <>
                {jobs.find(j => j.id === selectedJobId) && (
                  <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">
                        {jobs.find(j => j.id === selectedJobId)?.title}
                      </h2>
                      <button
                        onClick={() => setShowResumeForm(!showResumeForm)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        {showResumeForm ? 'Cancel' : '+ Submit Resume'}
                      </button>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700 mb-2">Requirements:</h3>
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">
                        {jobs.find(j => j.id === selectedJobId)?.requirements}
                      </p>
                    </div>
                  </div>
                )}

                {showResumeForm && (
                  <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Submit Resume</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name</label>
                        <input
                          type="text"
                          value={resumeName}
                          onChange={(e) => setResumeName(e.target.value)}
                          placeholder="e.g., John Doe"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Resume Text</label>
                        <textarea
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Paste resume content here..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                          rows={10}
                        />
                      </div>
                      <button
                        onClick={handleSubmitResume}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400"
                      >
                        {loading ? 'Analyzing...' : 'Submit & Analyze'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Resume Analysis Results</h2>
                  <div className="space-y-4">
                    {resumes.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No resumes submitted yet</p>
                    ) : (
                      resumes.map((resume) => (
                        <div key={resume.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-gray-800">{resume.name}</p>
                              <p className="text-sm text-gray-500 mt-1">Resume ID: {resume.id}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-lg font-bold ${getScoreColor(resume.ai_score)}`}>
                              Score: {resume.ai_score.toFixed(1)}/100
                            </div>
                          </div>
                          <div className="mb-3">
                            <h4 className="font-semibold text-gray-700 mb-1">AI Feedback:</h4>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap">{resume.ai_feedback}</p>
                          </div>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                              View Resume Text
                            </summary>
                            <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                              {resume.resume_text}
                            </p>
                          </details>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-xl p-6">
                <p className="text-gray-500 text-center py-8">Select a job to view resumes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
