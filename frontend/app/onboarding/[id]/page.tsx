'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { OnboardingEmployee, OnboardingProgress, OnboardingTask, TrustedAIResponse } from '@/lib/api'
import {
  deleteOnboardingEmployee,
  generateOnboardingChecklist,
  getOnboardingEmployee,
  getOnboardingProgress,
  getOnboardingTasks,
  ApiError,
} from '@/lib/api'
import { TaskChecklist } from '@/components/onboarding/TaskChecklist'
import { OnboardingChat } from '@/components/onboarding/OnboardingChat'
import { TipsCard } from '@/components/onboarding/TipsCard'
import { ProgressAnalytics } from '@/components/onboarding/ProgressAnalytics'
import TrustedAIOutput from '@/components/TrustedAIOutput'
import { ErrorDisplay } from '@/lib/error-utils'

type Tab = 'checklist' | 'chat' | 'tips' | 'analytics'

export default function OnboardingEmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = Number(params?.id)

  const [employee, setEmployee] = useState<OnboardingEmployee | null>(null)
  const [tasks, setTasks] = useState<OnboardingTask[]>([])
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [tab, setTab] = useState<Tab>('checklist')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generationResponse, setGenerationResponse] = useState<TrustedAIResponse<OnboardingTask[]> | null>(null)

  async function loadAll() {
    if (!employeeId || Number.isNaN(employeeId)) return
    setLoading(true)
    setError(null)
    try {
      const [e, t, p] = await Promise.all([
        getOnboardingEmployee(employeeId),
        getOnboardingTasks(employeeId),
        getOnboardingProgress(employeeId),
      ])
      setEmployee(e)
      setTasks(t)
      setProgress(p)
    } catch (e: any) {
      setError(e instanceof ApiError ? e.errors : (e.message || 'Failed to load employee'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  const overdueCount = useMemo(() => progress?.overdue_tasks?.length || 0, [progress])

  async function onGenerateChecklist() {
    if (!employee) return
    if (!confirm('Generate a new AI checklist? This will replace existing tasks.')) return
    setGenerating(true)
    setGenerationResponse(null)
    try {
      const response = await generateOnboardingChecklist(employee.id)
      setGenerationResponse(response)
      await loadAll()
    } catch (e: any) {
      setError(e instanceof ApiError ? e.errors : (e.message || 'Generation failed'))
    } finally {
      setGenerating(false)
    }
  }

  async function onDeleteEmployee() {
    if (!employee) return
    if (!confirm('Delete this employee and all onboarding data?')) return
    await deleteOnboardingEmployee(employee.id)
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          {loading && <div className="text-sm text-gray-600">Loading…</div>}
          <ErrorDisplay errors={error} className="mb-4" />
          {employee && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{employee.employee_name}</h1>
                  <p className="text-gray-600">{employee.employee_email}</p>
                  <p className="text-gray-500 mt-1">
                    {employee.position} • {employee.department}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Start: {new Date(employee.start_date).toLocaleDateString()} • Manager:{' '}
                    {employee.manager_name || 'N/A'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-3xl font-extrabold text-indigo-700">{employee.completion_percentage}%</div>
                  <div className="text-xs text-gray-500">
                    Status: {employee.status.replace('_', ' ')}
                    {overdueCount > 0 && <span className="text-red-600 font-semibold"> • {overdueCount} overdue</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void onGenerateChecklist()}
                      disabled={generating}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                      {generating ? 'Generating…' : 'Generate AI Checklist'}
                    </button>
                    <button
                      onClick={() => void onDeleteEmployee()}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, employee.completion_percentage))}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTab('checklist')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === 'checklist' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Checklist
                </button>
                <button
                  onClick={() => setTab('chat')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === 'chat' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setTab('tips')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === 'tips' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Tips
                </button>
                <button
                  onClick={() => setTab('analytics')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === 'analytics' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => void loadAll()}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>

        {employee && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {tab === 'checklist' && (
                <>
                  {generationResponse && (
                    <TrustedAIOutput
                      response={generationResponse}
                      title="AI Onboarding Plan"
                      className="mb-4 text-sm"
                    />
                  )}
                  <TaskChecklist employeeId={employee.id} tasks={tasks} onChanged={loadAll} />
                </>
              )}
              {tab === 'chat' && <OnboardingChat employeeId={employee.id} />}
              {tab === 'analytics' && <ProgressAnalytics progress={progress} tasks={tasks} />}
              {tab === 'tips' && (
                <div className="space-y-4">
                  <TipsCard employeeId={employee.id} />
                </div>
              )}
            </div>
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-2">Quick Stats</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Total tasks</span>
                    <span className="font-semibold">{progress?.total_tasks ?? tasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed</span>
                    <span className="font-semibold">{progress?.completed_tasks ?? tasks.filter((t) => t.is_completed).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue</span>
                    <span className={`font-semibold ${overdueCount > 0 ? 'text-red-600' : ''}`}>{overdueCount}</span>
                  </div>
                </div>
              </div>

              {progress && progress.next_actions && progress.next_actions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-bold text-gray-800 mb-2">Suggested Priorities</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {progress.next_actions.slice(0, 5).map((a) => (
                      <li key={a.task_id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="font-semibold">{a.title}</div>
                        {a.due_date && <div className="text-xs text-gray-500">Due: {new Date(a.due_date).toLocaleDateString()}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

