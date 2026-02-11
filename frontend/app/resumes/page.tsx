'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  createJob, getJobs, submitResume, getResumes,
  updateResumeStatus, deleteJob, Job, Resume
} from '@/lib/api';
import {
  ShieldCheckIcon, EyeIcon, EyeSlashIcon,
  CheckCircleIcon, XCircleIcon,
  InformationCircleIcon, BriefcaseIcon,
  BeakerIcon, UserGroupIcon, PlusIcon, TrashIcon, PencilIcon
} from '@heroicons/react/24/outline';

type Tab = 'jobs' | 'screening';

export default function ResumesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnonymized, setIsAnonymized] = useState(true);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  // Expanded Job form state
  const [jobData, setJobData] = useState({
    title: '',
    department: '',
    location: '',
    employment_type: 'Full-time',
    experience_level: 'Mid',
    description: '',
    requirements: '', // Legacy/Summary
    roles_responsibilities: '',
    desired_responsibilities: '',
    candidate_profile_education: '',
    candidate_profile_experience: '',
    candidate_profile_skills: ''
  });

  // Resume form state
  const [resumeData, setResumeData] = useState({
    name: '',
    text: '',
    blind_screening: true
  });

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId && activeTab === 'screening') {
      loadResumes(selectedJobId);
    }
  }, [selectedJobId, activeTab]);

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
    if (!jobData.title.trim() || !jobData.requirements.trim()) return;

    setLoading(true);
    try {
      // Parse comma-separated skills
      const skillsList = jobData.candidate_profile_skills.split(',').map(s => s.trim()).filter(Boolean);

      await createJob({
        title: jobData.title,
        department: jobData.department,
        location: jobData.location,
        employment_type: jobData.employment_type,
        experience_level: jobData.experience_level,
        description: jobData.description,
        requirements: jobData.requirements,
        roles_responsibilities: jobData.roles_responsibilities,
        desired_responsibilities: jobData.desired_responsibilities,
        candidate_profile: {
          education: jobData.candidate_profile_education,
          experience: jobData.candidate_profile_experience,
          skills: skillsList
        },
        required_skills: skillsList
      });

      resetJobForm();
      setShowJobForm(false);
      await loadJobs();
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job? This action is audited.')) return;
    try {
      await deleteJob(id);
      await loadJobs();
      if (selectedJobId === id) setSelectedJobId(null);
    } catch (error) {
      alert('Failed to delete job. You might not have permission.');
    }
  };

  const resetJobForm = () => {
    setJobData({
      title: '', department: '', location: '', employment_type: 'Full-time', experience_level: 'Mid',
      description: '', requirements: '', roles_responsibilities: '', desired_responsibilities: '',
      candidate_profile_education: '', candidate_profile_experience: '', candidate_profile_skills: ''
    });
  };

  const handleSubmitResume = async () => {
    if (!selectedJobId || !resumeData.name.trim() || !resumeData.text.trim()) return;

    setLoading(true);
    try {
      await submitResume(selectedJobId, resumeData.name, resumeData.text);
      setResumeData({ name: '', text: '', blind_screening: true });
      setShowResumeForm(false);
      await loadResumes(selectedJobId);
    } catch (error) {
      console.error('Error submitting resume:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (resumeId: number, status: string) => {
    if (!selectedJobId) return;
    try {
      await updateResumeStatus(selectedJobId, resumeId, status);
      await loadResumes(selectedJobId);
      if (selectedResume?.id === resumeId) {
        setSelectedResume(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const sortedResumes = useMemo(() => {
    return [...resumes].sort((a, b) => b.ai_score - a.ai_score);
  }, [resumes]);

  const selectedJob = useMemo(() => {
    return jobs.find(j => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Shortlisted': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'Reviewing': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Dashboard Section */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Talent Acquisition</h1>
              <p className="text-slate-500 mt-2 text-lg">Manage jobs and screen candidates with AI fairness.</p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Job Management
              </button>
              <button
                onClick={() => setActiveTab('screening')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'screening' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Resume Screening
              </button>
            </div>
          </div>
        </section>

        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Active Job Postings</h2>
              <button
                onClick={() => setShowJobForm(true)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95 flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create New Job</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                    <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Edit (Coming Soon)">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteJob(job.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Delete">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 pr-12">{job.title}</h3>
                  <p className="text-sm font-semibold text-slate-500 mt-1">{job.department} &bull; {job.location}</p>

                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Candidate Profile</div>
                    {job.candidate_profile ? (
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>🎓 {job.candidate_profile.education}</p>
                        <p>💼 {job.candidate_profile.experience}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.candidate_profile.skills.slice(0, 5).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium">{s}</span>
                          ))}
                          {job.candidate_profile.skills.length > 5 && <span className="px-2 py-0.5 text-xs text-slate-400">+{job.candidate_profile.skills.length - 5}</span>}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Legacy job format</p>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                      {job.is_active ? 'Active' : 'Archived'}
                    </span>
                    <button onClick={() => { setSelectedJobId(job.id); setActiveTab('screening'); }} className="text-indigo-600 text-sm font-bold hover:underline">
                      View Applicants &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'screening' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Job Sidebar for Screening */}
            <aside className="lg:col-span-1 space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Select Role</h3>
              <div className="space-y-3">
                {jobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full text-left p-5 rounded-3xl transition-all border ${selectedJobId === job.id
                      ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-500/20'
                      : 'bg-transparent border-transparent hover:bg-slate-200/50 grayscale hover:grayscale-0'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 leading-tight">{job.title}</h4>
                        <p className="text-xs text-slate-400 font-bold mt-1">{job.department || 'General'}</p>
                      </div>
                      {selectedJobId === job.id && <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />}
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {/* Main Dashboard Section */}
            <main className="lg:col-span-3 space-y-6">
              {selectedJob ? (
                <>
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
                      <div className="flex items-center space-x-4">
                        <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                          <UserGroupIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold text-slate-900">{selectedJob.title} Applicants</h2>
                          <span className="text-slate-400 font-semibold">{selectedJob.location || 'Remote'} &bull; {selectedJob.employment_type}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setIsAnonymized(!isAnonymized)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${isAnonymized ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}
                          title="Toggle Blind Screening Mode"
                        >
                          {isAnonymized ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          <span>{isAnonymized ? 'Blind Mode' : 'Revealed'}</span>
                        </button>
                        <button
                          onClick={() => setShowResumeForm(true)}
                          className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
                        >
                          Process Resume
                        </button>
                      </div>
                    </div>

                    <div className="p-0">
                      {sortedResumes.length === 0 ? (
                        <div className="p-20 text-center space-y-4">
                          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                            <BeakerIcon className="w-10 h-10 text-slate-300" />
                          </div>
                          <p className="text-slate-400 font-bold text-lg">No candidates processed for this role.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {sortedResumes.map(resume => (
                            <div key={resume.id} className="p-6 hover:bg-slate-50/50 transition-colors group">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 ${resume.ai_score >= 80 ? 'bg-green-50 border-green-200' :
                                    resume.ai_score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                                    } shadow-sm`}>
                                    <span className={`text-xl font-black ${resume.ai_score >= 80 ? 'text-green-700' :
                                      resume.ai_score >= 60 ? 'text-amber-700' : 'text-red-700'
                                      }`}>{resume.ai_score.toFixed(0)}</span>
                                    <span className="text-[10px] font-black uppercase opacity-50">Score</span>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-xl font-bold text-slate-900 flex items-center">
                                      {isAnonymized ? `Candidate #${resume.id.toString().padStart(4, '0')}` : resume.name}
                                      {resume.trust_metadata && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded textxs font-medium bg-blue-100 text-blue-800">
                                          <ShieldCheckIcon className="w-3 h-3 mr-1" />
                                          Verified
                                        </span>
                                      )}
                                    </h4>
                                    <div className="flex items-center space-x-3">
                                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${getStatusColor(resume.status)}`}>
                                        {resume.status}
                                      </span>
                                      {/* Rejection Reason Snippet */}
                                      {resume.rejection_reason && (
                                        <span className="text-xs text-red-500 font-medium max-w-md truncate" title={resume.rejection_reason}>
                                          &bull; {resume.rejection_reason}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setSelectedResume(resume)}
                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                                    title="Expand Inspection"
                                  >
                                    <InformationCircleIcon className="w-6 h-6" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(resume.id, 'Shortlisted')}
                                    className="p-3 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all"
                                  >
                                    <CheckCircleIcon className="w-6 h-6" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(resume.id, 'Rejected')}
                                    className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                                  >
                                    <XCircleIcon className="w-6 h-6" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-20 text-center space-y-4">
                  <BriefcaseIcon className="w-16 h-16 text-slate-200 mx-auto" />
                  <h3 className="text-2xl font-bold text-slate-400">Select a job to start screening</h3>
                  <p className="text-slate-400">Manage applicants, view AI feedback, and shortlist talent.</p>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Expanded Job Creation Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Define New Role</h2>
                <button onClick={() => setShowJobForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Core Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800">Job Details</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Job Title</label>
                    <input type="text" value={jobData.title} onChange={e => setJobData({ ...jobData, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="Product Designer" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Department</label>
                      <input type="text" value={jobData.department} onChange={e => setJobData({ ...jobData, department: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl" placeholder="Design" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Location</label>
                      <input type="text" value={jobData.location} onChange={e => setJobData({ ...jobData, location: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl" placeholder="Remote / NY" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Type</label>
                      <select value={jobData.employment_type} onChange={e => setJobData({ ...jobData, employment_type: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl">
                        <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Freelance</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Level</label>
                      <select value={jobData.experience_level} onChange={e => setJobData({ ...jobData, experience_level: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl">
                        <option>Junior</option><option>Mid</option><option>Senior</option><option>Lead</option><option>Executive</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Short Description</label>
                    <textarea value={jobData.description} onChange={e => setJobData({ ...jobData, description: e.target.value })} rows={3} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl resize-none" placeholder="We are looking for..." />
                  </div>
                </div>

                {/* Candidate Profile */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800">Ideal Candidate Profile (AI Anchor)</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Education Requirements</label>
                    <input type="text" value={jobData.candidate_profile_education} onChange={e => setJobData({ ...jobData, candidate_profile_education: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl" placeholder="BS in Computer Science or equivalent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Experience Requirements</label>
                    <textarea value={jobData.candidate_profile_experience} onChange={e => setJobData({ ...jobData, candidate_profile_experience: e.target.value })} rows={2} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl resize-none" placeholder="3+ years in React..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Required Skills (Comma separated)</label>
                    <input type="text" value={jobData.candidate_profile_skills} onChange={e => setJobData({ ...jobData, candidate_profile_skills: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl" placeholder="React, TypeScript, Node.js" />
                  </div>
                </div>
              </div>

              {/* Responsibilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Roles & Responsibilities</label>
                  <textarea value={jobData.roles_responsibilities} onChange={e => setJobData({ ...jobData, roles_responsibilities: e.target.value })} rows={4} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl resize-none" placeholder="- Lead the frontend team..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Desired Responsibilities (Optional)</label>
                  <textarea value={jobData.desired_responsibilities} onChange={e => setJobData({ ...jobData, desired_responsibilities: e.target.value })} rows={4} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl resize-none" placeholder="- Contribute to open source..." />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Detailed Requirements (Legacy/Fallback)</label>
                <textarea value={jobData.requirements} onChange={e => setJobData({ ...jobData, requirements: e.target.value })} rows={2} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl resize-none" placeholder="Paste full specs if needed for detailed AI context..." />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button onClick={() => setShowJobForm(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                <button onClick={handleCreateJob} disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg disabled:bg-slate-300">
                  {loading ? 'Creating...' : 'Publish Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Structured Resume Submission Modal */}
      {showResumeForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Process Applicant Data</h2>
                <button onClick={() => setShowResumeForm(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
              </div>
              <div className="space-y-4">
                <div onClick={() => setResumeData(prev => ({ ...prev, blind_screening: !prev.blind_screening }))} className={`border p-4 rounded-2xl flex items-start space-x-3 cursor-pointer transition-all ${resumeData.blind_screening ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                  <ShieldCheckIcon className={`w-6 h-6 ${resumeData.blind_screening ? 'text-amber-600' : 'text-slate-400'}`} />
                  <div>
                    <p className={`font-bold text-sm ${resumeData.blind_screening ? 'text-amber-800' : 'text-slate-600'}`}>Automated Bias Control</p>
                    <p className="text-xs mt-0.5 text-slate-500">Resume will be anonymized before AI processing to ensure merit-only scoring.</p>
                  </div>
                  <div className={`ml-auto w-6 h-6 rounded-full border flex items-center justify-center ${resumeData.blind_screening ? 'bg-amber-500 border-amber-500' : 'bg-white border-slate-300'}`}>
                    {resumeData.blind_screening && <CheckCircleIcon className="w-5 h-5 text-white" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Full Candidate Name</label>
                  <input type="text" value={resumeData.name} onChange={e => setResumeData({ ...resumeData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl" placeholder="Johnathan Smith" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Original Resume Text</label>
                  <textarea value={resumeData.text} onChange={e => setResumeData({ ...resumeData, text: e.target.value })} rows={8} className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-xs" placeholder="Paste full resume content..." />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button onClick={() => setShowResumeForm(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl">Cancel</button>
                <button onClick={handleSubmitResume} disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg">{loading ? 'AI Processing...' : 'Execute AI Analysis'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recruitment Inspection Modal */}
      {selectedResume && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col scale-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-3xl flex flex-col items-center justify-center border-2 ${selectedResume.ai_score >= 80 ? 'bg-green-50 border-green-200' : 'bg-indigo-50 border-indigo-200'
                  }`}>
                  <span className="text-2xl font-black">{selectedResume.ai_score.toFixed(0)}</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900">
                    {isAnonymized ? `Candidate #${selectedResume.id}` : selectedResume.name}
                  </h3>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">AI Evaluation Proof-Points</p>
                </div>
              </div>
              <button onClick={() => setSelectedResume(null)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">
                <XCircleIcon className="w-8 h-8 text-slate-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  {/* Rejection/Low Score Reason */}
                  {selectedResume.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
                      <h4 className="text-red-800 font-black uppercase tracking-widest text-xs mb-2">Analysis: Why Not?</h4>
                      <p className="text-red-800 font-medium leading-relaxed">{selectedResume.rejection_reason}</p>
                    </div>
                  )}

                  <section>
                    <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center">
                      <CheckCircleIcon className="w-6 h-6 text-indigo-600 mr-2" />
                      Extracted Evidence
                    </h4>
                    <div className="space-y-4">
                      {selectedResume.ai_evidence?.map((item: any, i: number) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                          <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">{item.signal}</span>
                          <blockquote className="mt-3 text-slate-700 italic border-l-4 border-indigo-200 pl-4 py-1 bg-white/50 rounded-r-xl">
                            "{item.proof}"
                          </blockquote>
                          <p className="mt-3 text-sm text-slate-600 font-medium">{item.assessment}</p>
                        </div>
                      )) || <p className="text-slate-400 italic">No structured evidence artifacts found for this analysis.</p>}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="bg-indigo-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <ShieldCheckIcon className="w-24 h-24" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest opacity-60 mb-1">AI Trust Certificate</h4>
                    <p className="text-xl font-bold mb-6">Verified Analysis</p>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-80">Confidence</span>
                        <span className="font-bold">{(selectedResume.trust_metadata?.confidence_score * 100 || 85).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] opacity-60 font-bold uppercase tracking-wider">
                        <span>Model</span>
                        <span>{selectedResume.trust_metadata?.ai_model || 'Standard RAG Ensemble'}</span>
                      </div>
                    </div>
                  </section>

                  <section className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Executive Summary</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">{selectedResume.ai_feedback}</p>
                  </section>

                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedResume.id, 'Shortlisted')}
                      className="w-full py-4 bg-green-600 text-white rounded-2xl font-black hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
                    >
                      Shortlist Candidate
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedResume.id, 'Rejected')}
                      className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all"
                    >
                      Decline Application
                    </button>
                  </div>
                </div>
              </div>

              <section>
                <h4 className="text-lg font-black text-slate-900 mb-4">Inspection: {isAnonymized ? 'Scrubbed Profile' : 'Original Resume'}</h4>
                <div className="bg-slate-900 p-8 rounded-3xl text-slate-300 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto custom-scrollbar shadow-inner">
                  {isAnonymized ? selectedResume.anonymized_text : selectedResume.resume_text}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 20px; }
        .scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

    </div>
  );
}
