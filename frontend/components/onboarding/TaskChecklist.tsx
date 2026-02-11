/* eslint-disable @typescript-eslint/no-misused-promises */
'use client'

import { useMemo, useState } from 'react'
import type { OnboardingTask, OnboardingTaskCategory } from '@/lib/api'
import { completeOnboardingTask, createOnboardingTask, deleteOnboardingTask, ApiError } from '@/lib/api'
import { ErrorDisplay } from '@/lib/error-utils'

const categoryMeta: Record<OnboardingTaskCategory, { label: string; icon: string; color: string }> = {
  documentation: { label: 'Documentation', icon: '📄', color: 'bg-purple-50 border-purple-200' },
  training: { label: 'Training', icon: '🎓', color: 'bg-indigo-50 border-indigo-200' },
  setup: { label: 'Setup', icon: '🛠️', color: 'bg-blue-50 border-blue-200' },
  meeting: { label: 'Meetings', icon: '📅', color: 'bg-pink-50 border-pink-200' },
  other: { label: 'Other', icon: '✅', color: 'bg-gray-50 border-gray-200' },
}

export function TaskChecklist({
  employeeId,
  tasks,
  onChanged,
}: {
  employeeId: number
  tasks: OnboardingTask[]
  onChanged: () => Promise<void>
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState<OnboardingTaskCategory>('other')
  const [newDueDate, setNewDueDate] = useState<string>('')
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<any>(null)

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === 'pending') return !t.is_completed
      if (filter === 'completed') return t.is_completed
      return true
    })
  }, [tasks, filter])

  const grouped = useMemo(() => {
    const map = new Map<OnboardingTaskCategory, OnboardingTask[]>()
    for (const t of filtered) {
      const c = t.task_category || 'other'
      map.set(c, [...(map.get(c) || []), t])
    }
    return map
  }, [filtered])

  async function onToggleComplete(task: OnboardingTask) {
    if (task.is_completed) return
    setBusyTaskId(task.id)
    try {
      setError(null)
      await completeOnboardingTask(task.id)
      await onChanged()
    } catch (e: any) {
      setError(e instanceof ApiError ? e.errors : e.message)
    } finally {
      setBusyTaskId(null)
    }
  }

  async function onDelete(task: OnboardingTask) {
    if (!confirm('Delete this task?')) return
    setBusyTaskId(task.id)
    try {
      setError(null)
      await deleteOnboardingTask(task.id)
      await onChanged()
    } catch (e: any) {
      setError(e instanceof ApiError ? e.errors : e.message)
    } finally {
      setBusyTaskId(null)
    }
  }

  async function onAddTask() {
    if (!newTitle.trim() || !newDesc.trim()) return
    setBusy(true)
    try {
      setError(null)
      await createOnboardingTask(employeeId, {
        task_title: newTitle.trim(),
        task_description: newDesc.trim(),
        task_category: newCategory,
        due_date: newDueDate ? newDueDate : null,
      })
      setNewTitle('')
      setNewDesc('')
      setNewCategory('other')
      setNewDueDate('')
      setAdding(false)
      await onChanged()
    } catch (e: any) {
      setError(e instanceof ApiError ? e.errors : e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Completed
          </button>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          {adding ? 'Close' : '+ Add Task'}
        </button>
      </div>

      <ErrorDisplay errors={error} />

      {adding && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as OnboardingTaskCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {Object.keys(categoryMeta).map((k) => (
                  <option key={k} value={k}>
                    {categoryMeta[k as OnboardingTaskCategory].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Due date (optional)</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button
            disabled={busy || !newTitle.trim() || !newDesc.trim()}
            onClick={onAddTask}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {busy ? 'Adding…' : 'Add Task'}
          </button>
        </div>
      )}

      {Array.from(grouped.entries()).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-600">
          No tasks yet. Generate a checklist or add a custom task.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, list]) => {
          const meta = categoryMeta[category] || categoryMeta.other
          return (
            <div key={category} className={`rounded-xl border p-4 ${meta.color}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{meta.icon}</span>
                <h3 className="font-bold text-gray-800">{meta.label}</h3>
                <span className="text-xs text-gray-500">({list.length})</span>
              </div>
              <div className="space-y-2">
                {list.map((t) => (
                  <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex gap-2 items-start">
                        <input
                          type="checkbox"
                          checked={t.is_completed}
                          disabled={t.is_completed || busyTaskId === t.id}
                          onChange={() => void onToggleComplete(t)}
                          className="mt-1"
                        />
                        <div>
                          <div className={`font-semibold ${t.is_completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            {t.task_title}
                          </div>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">{t.task_description}</div>
                          <div className="text-xs text-gray-500 mt-1 flex gap-3 flex-wrap">
                            {t.due_date && <span>Due: {new Date(t.due_date).toLocaleDateString()}</span>}
                            {t.completed_at && <span>Done: {new Date(t.completed_at).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </label>
                      <button
                        disabled={busyTaskId === t.id}
                        onClick={() => void onDelete(t)}
                        className="px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:bg-gray-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

