'use client';

import { useState } from 'react';
import { analyzeWellbeing, checkFriction, WellbeingAssessment, FrictionCheck, TrustedAIResponse } from '@/lib/api';
import TrustedAIOutput from '@/components/TrustedAIOutput';
import { HeartIcon, ChatBubbleBottomCenterTextIcon, ShieldCheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function WellbeingPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [wellbeingAnalysis, setWellbeingAnalysis] = useState<TrustedAIResponse<WellbeingAssessment> | null>(null);
  const [wellbeingLoading, setWellbeingLoading] = useState(false);

  const [textToCheck, setTextToCheck] = useState('');
  const [frictionResult, setFrictionResult] = useState<TrustedAIResponse<FrictionCheck> | null>(null);
  const [frictionLoading, setFrictionLoading] = useState(false);

  const handleAnalyzeWellbeing = async () => {
    const id = parseInt(employeeId);
    if (isNaN(id)) {
      alert('Please enter a valid employee ID');
      return;
    }

    setWellbeingLoading(true);
    try {
      const result = await analyzeWellbeing(id);
      setWellbeingAnalysis(result);
    } catch (error) {
      console.error('Error analyzing wellbeing:', error);
      alert('Failed to analyze wellbeing support needs. Make sure the employee ID exists.');
    } finally {
      setWellbeingLoading(false);
    }
  };

  const handleCheckFriction = async () => {
    if (!textToCheck.trim()) {
      alert('Please enter text to analyze');
      return;
    }

    setFrictionLoading(true);
    try {
      const result = await checkFriction(textToCheck);
      setFrictionResult(result);
    } catch (error) {
      console.error('Error checking friction:', error);
      alert('Failed to analyze friction indicators');
    } finally {
      setFrictionLoading(false);
    }
  };

  const getPriorityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'priority':
      case 'high':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'medium':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-teal-700 bg-teal-50 border-teal-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-8 mb-8 transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-600 rounded-xl">
              <HeartIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Workplace Wellbeing Hub</h1>
              <p className="text-slate-500 mt-1">Cultivating a supportive, friction-free culture through AI-assisted early intervention.</p>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
              <ShieldCheckIcon className="w-4 h-4 mr-1" />
              Traceable Analysis
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
              <InformationCircleIcon className="w-4 h-4 mr-1" />
              Support-Oriented
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wellbeing Assessment Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <InformationCircleIcon className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-800">Support Needs Assessment</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Employee Identifier
                </label>
                <input
                  type="number"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Employee Registry ID (e.g., 1)"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
                <p className="text-xs text-slate-400 mt-2 italic">
                  Analyzes workplace signals to recommend proactive support strategies.
                </p>
              </div>
              <button
                onClick={handleAnalyzeWellbeing}
                disabled={wellbeingLoading || !employeeId}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
              >
                {wellbeingLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Assessing Wellbeing...
                  </span>
                ) : 'Assess Support Priority'}
              </button>

              {wellbeingAnalysis && wellbeingAnalysis.data && (
                <TrustedAIOutput response={wellbeingAnalysis} title="Wellbeing Analysis" showContent={false}>
                  <div className={`mt-4 p-4 rounded-xl border animate-in fade-in slide-in-from-top-4 duration-300 ${getPriorityColor(wellbeingAnalysis.data.support_priority)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-base uppercase tracking-wider">Support Priority</h3>
                      <span className="px-3 py-1 rounded-lg bg-white/80 backdrop-blur-sm font-bold shadow-sm">
                        {wellbeingAnalysis.data.support_priority}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold mb-1 opacity-80 uppercase text-xs">Contextual Findings:</h4>
                        <p className="text-sm leading-relaxed">{wellbeingAnalysis.data.details}</p>
                      </div>
                      {wellbeingAnalysis.data.recommendations && wellbeingAnalysis.data.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-bold mb-1 opacity-80 uppercase text-xs">Growth & Support Actions:</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {wellbeingAnalysis.data.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </TrustedAIOutput>
              )}
            </div>
          </div>

          {/* Friction Indicator Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-amber-600" />
              <h2 className="text-xl font-bold text-slate-800">Communication Friction Analysis</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Activity Content for Review
                </label>
                <textarea
                  value={textToCheck}
                  onChange={(e) => setTextToCheck(e.target.value)}
                  placeholder="Paste workplace communication or activity content here..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none resize-none"
                  rows={6}
                />
              </div>
              <button
                onClick={handleCheckFriction}
                disabled={frictionLoading || !textToCheck.trim()}
                className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold hover:bg-amber-700 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-100"
              >
                {frictionLoading ? 'Analyzing Sentiment...' : 'Identify Friction Points'}
              </button>

              {frictionResult && frictionResult.data && (
                <TrustedAIOutput response={frictionResult} title="Friction Analysis" showContent={false}>
                  <div className={`mt-4 p-4 rounded-xl border animate-in fade-in slide-in-from-top-4 duration-300 ${frictionResult.data.has_friction
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-teal-700 bg-teal-50 border-teal-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-base uppercase tracking-wider">Analysis Result</h3>
                      <span className={`px-3 py-1 rounded-lg bg-white/80 font-bold shadow-sm ${frictionResult.data.has_friction ? 'text-amber-700' : 'text-teal-700'
                        }`}>
                        {frictionResult.data.has_friction ? 'FRICTION DETECTED' : 'HEALTHY DIALOGUE'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold mb-1 opacity-80 uppercase text-xs">Explanation:</h4>
                        <p className="text-sm leading-relaxed">{frictionResult.data.explanation}</p>
                      </div>
                      {frictionResult.data.support_hint && (
                        <div className="p-3 bg-white/50 rounded-lg border border-current/10">
                          <h4 className="font-bold mb-1 text-xs uppercase opacity-80">Supportive Strategy:</h4>
                          <p className="text-sm italic">{frictionResult.data.support_hint}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TrustedAIOutput>
              )}
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Supportive Infrastructure</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4 text-indigo-500" />
                Early Support Intervention
              </h3>
              <p className="leading-relaxed">
                Rather than flagging policy violations, our AI identifies patterns of stress or misalignment.
                This allows managers to provide support, reduce workload, or offer mentorship before issues escalate.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-amber-500" />
                Empathetic Communication
              </h3>
              <p className="leading-relaxed">
                We monitor for "friction" rather than "toxicity." This distinction shifts the focus from
                accusation to conflict resolution and emotional intelligence coaching for the whole team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
