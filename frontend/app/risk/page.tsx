'use client';

import { useState } from 'react';
import { analyzeRisk, checkToxicity, RiskAnalysis, ToxicityCheck } from '@/lib/api';

export default function RiskPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);

  const [textToCheck, setTextToCheck] = useState('');
  const [toxicityResult, setToxicityResult] = useState<ToxicityCheck | null>(null);
  const [toxicityLoading, setToxicityLoading] = useState(false);

  const handleAnalyzeRisk = async () => {
    const id = parseInt(employeeId);
    if (isNaN(id)) {
      alert('Please enter a valid employee ID');
      return;
    }

    setRiskLoading(true);
    try {
      const result = await analyzeRisk(id);
      setRiskAnalysis(result);
    } catch (error) {
      console.error('Error analyzing risk:', error);
      alert('Failed to analyze risk. Make sure the employee ID exists.');
    } finally {
      setRiskLoading(false);
    }
  };

  const handleCheckToxicity = async () => {
    if (!textToCheck.trim()) {
      alert('Please enter text to check');
      return;
    }

    setToxicityLoading(true);
    try {
      const result = await checkToxicity(textToCheck);
      setToxicityResult(result);
    } catch (error) {
      console.error('Error checking toxicity:', error);
      alert('Failed to check toxicity');
    } finally {
      setToxicityLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Risk Detection AI</h1>
          <p className="text-gray-600">AI-powered risk analysis and toxicity detection for employee activities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Risk Analysis */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Employee Risk Analysis</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID
                </label>
                <input
                  type="number"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g., 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter an employee ID to analyze their activities for risks
                </p>
              </div>
              <button
                onClick={handleAnalyzeRisk}
                disabled={riskLoading || !employeeId}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {riskLoading ? 'Analyzing...' : 'Analyze Risk'}
              </button>

              {riskAnalysis && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${getRiskColor(riskAnalysis.risk_level)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">Risk Level</h3>
                    <span className="px-3 py-1 rounded-full bg-white font-semibold uppercase">
                      {riskAnalysis.risk_level}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h4 className="font-semibold mb-1">Analysis Details:</h4>
                    <p className="text-sm whitespace-pre-wrap">{riskAnalysis.details}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Toxicity Check */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Toxicity Detection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text to Check
                </label>
                <textarea
                  value={textToCheck}
                  onChange={(e) => setTextToCheck(e.target.value)}
                  placeholder="Enter text to check for toxic language..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                  rows={6}
                />
              </div>
              <button
                onClick={handleCheckToxicity}
                disabled={toxicityLoading || !textToCheck.trim()}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {toxicityLoading ? 'Checking...' : 'Check Toxicity'}
              </button>

              {toxicityResult && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${
                  toxicityResult.is_toxic
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : 'text-green-600 bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">Result</h3>
                    <span className={`px-3 py-1 rounded-full bg-white font-semibold ${
                      toxicityResult.is_toxic ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {toxicityResult.is_toxic ? 'TOXIC' : 'SAFE'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h4 className="font-semibold mb-1">Explanation:</h4>
                    <p className="text-sm whitespace-pre-wrap">{toxicityResult.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Employee Risk Analysis</h3>
              <p>
                Analyzes all activities associated with an employee to detect potential risks such as
                policy violations, workplace safety concerns, or behavioral issues. The AI reviews
                activity history and provides a risk level assessment.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Toxicity Detection</h3>
              <p>
                Checks any text input for toxic, harmful, or inappropriate language. Useful for
                monitoring communications, comments, or reports for content that violates company
                policies or creates a hostile work environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
