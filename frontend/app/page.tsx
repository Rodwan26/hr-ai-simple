'use client';

import { useState } from 'react';
import { askQuestion, getTickets, Ticket } from '@/lib/api';

export default function HelpDeskPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      const response = await askQuestion(question);
      setAnswer(response.answer);
      setQuestion('');
      // Refresh tickets
      const updatedTickets = await getTickets();
      setTickets(updatedTickets);
    } catch (error) {
      console.error('Error asking question:', error);
      setAnswer('Error: Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getTickets();
      setTickets(data);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">HR Help Desk AI</h1>
          <p className="text-gray-600">Ask questions about company policies and get AI-powered answers</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What is the vacation policy?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAsk();
                  }
                }}
              />
            </div>
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Asking AI...' : 'Ask Question'}
            </button>
          </div>

          {answer && (
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <h3 className="font-semibold text-gray-800 mb-2">AI Response:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{answer}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Ticket History</h2>
            <button
              onClick={loadHistory}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {showHistory ? 'Refresh' : 'Load History'}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-4">
              {tickets.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tickets yet</p>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-gray-800">{ticket.question}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{ticket.ai_response}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
