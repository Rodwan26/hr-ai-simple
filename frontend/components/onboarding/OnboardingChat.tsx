'use client'

import { useEffect, useMemo, useState } from 'react'
import type { OnboardingAskResponse, OnboardingChat } from '@/lib/api'
import { askOnboardingQuestion, getOnboardingChatHistory, setOnboardingChatFeedback } from '@/lib/api'

export function OnboardingChat({ employeeId }: { employeeId: number }) {
  const [history, setHistory] = useState<OnboardingChat[]>([])
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [lastAskMeta, setLastAskMeta] = useState<OnboardingAskResponse | null>(null)

  async function load() {
    const h = await getOnboardingChatHistory(employeeId)
    setHistory(h)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  const messages = useMemo(() => history, [history])

  async function send() {
    if (!question.trim()) return
    setSending(true)
    setLastAskMeta(null)
    try {
      const res = await askOnboardingQuestion(employeeId, question.trim())
      setLastAskMeta(res)
      setQuestion('')
      await load()
    } finally {
      setSending(false)
    }
  }

  async function feedback(chatId: number, helpful: boolean) {
    await setOnboardingChatFeedback(chatId, helpful)
    await load()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">Onboarding Q&A</h3>
        <div className="text-xs text-gray-500">Ask anything about your first weeks</div>
      </div>

      <div className="h-80 overflow-y-auto space-y-3 border border-gray-100 rounded-lg p-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-600">No questions yet. Ask your first onboarding question below.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-indigo-600 text-white rounded-lg px-3 py-2">
                  <div className="text-xs opacity-90 font-semibold">You</div>
                  <div className="text-sm whitespace-pre-wrap">{m.question}</div>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-gray-500 font-semibold">AI</div>
                    {m.is_helpful !== null ? (
                      <div className="text-xs text-gray-500">
                        Feedback: {m.is_helpful ? 'Helpful' : 'Not helpful'}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => void feedback(m.id, true)}
                          className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          Helpful
                        </button>
                        <button
                          onClick={() => void feedback(m.id, false)}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Not helpful
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{m.ai_response}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {lastAskMeta && (
        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-800">Sources & Confidence</div>
            <div className="text-xs text-gray-600">
              Confidence: {(lastAskMeta.confidence * 100).toFixed(0)}%
            </div>
          </div>
          {lastAskMeta.sources.length === 0 ? (
            <div className="text-xs text-gray-600 mt-2">No document sources were matched.</div>
          ) : (
            <div className="mt-2 space-y-1">
              {lastAskMeta.sources.slice(0, 5).map((s, i) => (
                <div key={i} className="text-xs text-gray-700">
                  - {s.filename} (chunk {s.chunk_index + 1})
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask an onboarding question… (Ctrl+Enter to send)"
          rows={3}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) void send()
          }}
          disabled={sending}
        />
        <button
          onClick={() => void send()}
          disabled={sending || !question.trim()}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

