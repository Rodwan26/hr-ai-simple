'use client';

import { useState, useEffect, useRef } from 'react';
import {
  queryDocuments,
  getDocuments,
  Document,
  DocumentQueryResponse,
} from '@/lib/api';

interface Message {
  id: number;
  question: string;
  answer: string;
  sources: DocumentQueryResponse['sources'];
  confidence: number;
  timestamp: Date;
}

export default function DocumentQueryPage() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [showSources, setShowSources] = useState<number | null>(null);
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
      answer: '',
      sources: [],
      confidence: 0,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await queryDocuments(
        userQuestion,
        1,
        selectedDocuments.length > 0 ? selectedDocuments : undefined
      );

      // Update message with answer
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            answer: result.answer,
            sources: result.sources,
            confidence: result.confidence,
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
            answer: 'Error: Failed to get answer. Please try again.',
            confidence: 0,
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600 bg-green-50';
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.4) return 'Medium';
    return 'Low';
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
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
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
                        <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-3xl">
                          <p className="font-semibold mb-1">You</p>
                          <p>{message.question}</p>
                        </div>
                      </div>

                      {/* AI Answer */}
                      {message.answer && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-3xl">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-gray-800">AI Assistant</p>
                              <div
                                className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(
                                  message.confidence
                                )}`}
                              >
                                {getConfidenceLabel(message.confidence)} Confidence
                              </div>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap mb-3">{message.answer}</p>

                            {/* Sources */}
                            {message.sources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-300">
                                <button
                                  onClick={() =>
                                    setShowSources(showSources === message.id ? null : message.id)
                                  }
                                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                  {showSources === message.id ? 'Hide' : 'Show'} Sources (
                                  {message.sources.length})
                                </button>
                                {showSources === message.id && (
                                  <div className="mt-2 space-y-2">
                                    {message.sources.map((source, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white rounded p-2 border border-gray-200"
                                      >
                                        <p className="text-xs font-semibold text-gray-800">
                                          {source.filename}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Chunk #{source.chunk_index + 1} • Similarity:{' '}
                                          {(source.similarity * 100).toFixed(1)}%
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <p className="text-gray-600">Thinking...</p>
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
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleQuery();
                      }
                    }}
                    placeholder="Ask a question about your documents... (Ctrl+Enter to send)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
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
