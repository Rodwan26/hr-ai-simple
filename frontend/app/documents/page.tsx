'use client';

import { useState, useEffect, useRef } from 'react';
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  getDocumentChunks,
  Document,
  DocumentChunk,
} from '@/lib/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [showChunks, setShowChunks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      // Don't show alert on initial load - just log the error
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.csv'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      alert(`File type ${fileExt} not allowed. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + 10;
      });
    }, 300);

    try {
      const result = await uploadDocument(file);
      console.log('Upload successful:', result);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(async () => {
        setUploadProgress(0);
        setUploading(false);
        await loadDocuments();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      
      alert('Upload failed. Please try again.');
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await deleteDocument(documentId);
      await loadDocuments();
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setChunks([]);
        setShowChunks(false);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleViewChunks = async (document: Document) => {
    setSelectedDocument(document);
    setLoading(true);
    try {
      const data = await getDocumentChunks(document.id);
      setChunks(data);
      setShowChunks(true);
    } catch (error) {
      console.error('Error loading chunks:', error);
      alert('Failed to load document chunks');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case '.pdf':
        return '📄';
      case '.docx':
        return '📝';
      case '.txt':
        return '📃';
      case '.csv':
        return '📊';
      default:
        return '📎';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Document Management</h1>
              <p className="text-gray-600">Upload and manage company documents for AI-powered Q&A</p>
            </div>
            <a
              href="/documents/query"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Ask Questions →
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Document</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-green-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div className="space-y-4">
                <div className="text-4xl">📤</div>
                <div>
                  <p className="text-gray-700 font-semibold">Uploading...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl">📁</div>
                <div>
                  <p className="text-gray-700 font-semibold">
                    Drag and drop files here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-green-600 hover:text-green-700 underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supported formats: PDF, DOCX, TXT, CSV (Max 50MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Uploaded Documents</h2>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">File</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Uploaded</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
                          <span className="font-medium text-gray-800">{doc.filename}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{doc.file_type.toUpperCase()}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(doc.upload_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewChunks(doc)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            View Chunks
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showChunks && selectedDocument && (
          <div className="mt-6 bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Document Chunks: {selectedDocument.filename}
              </h2>
              <button
                onClick={() => {
                  setShowChunks(false);
                  setChunks([]);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading chunks...</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {chunks.map((chunk) => (
                  <div key={chunk.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-600">
                        Chunk #{chunk.chunk_index + 1}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{chunk.chunk_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}