'use client';

import { useState, useEffect, useRef } from 'react';
import {
  queryDocuments,
  getDocuments,
  Document,
  TrustedAIResponse
} from '@/lib/api';
import TrustedAIOutput from '@/components/TrustedAIOutput';

interface Message {
  id: number;
  question: string;
  response: TrustedAIResponse | null;
  isError?: boolean;
  timestamp: Date;
}

export default function DocumentQueryPage() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleQuery = async () => {
    if (!question.trim()) return;

    const userQuestion = question;
    setQuestion('');
    setLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      question: userQuestion,
      response: null,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await queryDocuments(
        userQuestion,
        1,
        selectedDocuments.length > 0 ? selectedDocuments : undefined
      );

      // Update message with AI response
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            response: result,
          };
        }
        return updated;
      });
    } catch (error) {
      console.error('Error querying documents:', error);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            isError: true,
            response: null
          };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDocumentSelection = (docId: number) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Document Q&A</h1>
          <p className="text-gray-600">Ask questions about your uploaded documents using AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Document Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-xl p-4 sticky top-4">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Documents</h2>
              <p className="text-xs text-gray-500 mb-3">
                Select documents to search (leave empty for all)
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {documents.length === 0 ? (
                  <p className="text-sm text-gray-500">No documents available</p>
                ) : (
                  documents.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 truncate">{doc.filename}</span>
                    </label>
                  ))
                )}
              </div>
              {selectedDocuments.length > 0 && (
                <button
                  onClick={() => setSelectedDocuments([])}
                  className="mt-3 w-full px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col" style={{ height: '600px' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-lg mb-2">Start asking questions about your documents</p>
                    <p className="text-sm">Select specific documents or search all documents</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="space-y-3">
                      {/* User Question */}
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-3xl shadow-sm">
                          <p className="font-semibold mb-1 text-xs uppercase tracking-wider opacity-75">You</p>
                          <p>{message.question}</p>
                        </div>
                      </div>

                      {/* AI Answer */}
                      {message.response ? (
                        <div className="flex justify-start w-full">
                          <div className="max-w-3xl w-full">
                            <TrustedAIOutput
                              response={message.response}
                              title="AI Assistant"
                              className="shadow-sm border-blue-100"
                            />
                          </div>
                        </div>
                      ) : message.isError ? (
                        <div className="flex justify-start">
                          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 max-w-3xl border border-red-200">
                            <p>Error: Failed to get answer. Please try again.</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 rounded-lg px-4 py-2 border border-gray-100 animate-pulse">
                      <p className="text-gray-500 text-sm">Thinking...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex space-x-2">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleQuery();
                      }
                    }}
                    placeholder="Ask a question about your documents... (Enter to send)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                    disabled={loading}
                  />
                  <button
                    onClick={handleQuery}
                    disabled={loading || !question.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? '...' : 'Ask'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
