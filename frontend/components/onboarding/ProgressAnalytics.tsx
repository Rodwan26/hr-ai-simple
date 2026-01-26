'use client'

import { useMemo } from 'react'
import type { OnboardingProgress, OnboardingTask } from '@/lib/api'

function pct(n: number) {
  return `${Math.min(100, Math.max(0, n))}%`
}

export function ProgressAnalytics({
  progress,
  tasks,
}: {
  progress: OnboardingProgress | null
  tasks: OnboardingTask[]
}) {
  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>()
    for (const t of tasks) {
      const c = t.task_category || 'other'
      const cur = map.get(c) || { total: 0, done: 0 }
      cur.total += 1
      if (t.is_completed) cur.done += 1
      map.set(c, cur)
    }
    return Array.from(map.entries())
  }, [tasks])

  const completedTimeline = useMemo(() => {
    const done = tasks
      .filter((t) => t.is_completed && t.completed_at)
      .sort((a, b) => new Date(a.completed_at || 0).getTime() - new Date(b.completed_at || 0).getTime())
    return done.slice(-10)
  }, [tasks])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-bold text-gray-800 mb-3">Progress Overview</h3>
        {!progress ? (
          <div className="text-sm text-gray-600">No progress data yet.</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {progress.completed_tasks}/{progress.total_tasks} tasks completed
              </div>
              <div className="text-2xl font-extrabold text-indigo-700">{progress.completion_percentage}%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: pct(progress.completion_percentage) }} />
            </div>
            {progress.overdue_tasks.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-semibold text-red-700">Overdue tasks</div>
                <ul className="mt-2 space-y-1 text-sm text-red-700">
                  {progress.overdue_tasks.slice(0, 5).map((t) => (
                    <li key={t.task_id}>
                      - {t.title} (due {new Date(t.due_date).toLocaleDateString()})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-bold text-gray-800 mb-3">Tasks by Category</h3>
        {byCategory.length === 0 ? (
          <div className="text-sm text-gray-600">No tasks yet.</div>
        ) : (
          <div className="space-y-3">
            {byCategory.map(([cat, v]) => {
              const p = v.total > 0 ? Math.round((v.done / v.total) * 100) : 0
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-semibold text-gray-800">{cat}</div>
                    <div className="text-gray-600">
                      {v.done}/{v.total} ({p}%)
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: pct(p) }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-bold text-gray-800 mb-3">Recent Completions</h3>
        {completedTimeline.length === 0 ? (
          <div className="text-sm text-gray-600">No completed tasks yet.</div>
        ) : (
          <ul className="space-y-2">
            {completedTimeline.map((t) => (
              <li key={t.id} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                ✅ {t.task_title}
                <div className="text-xs text-gray-500 mt-1">
                  {t.completed_at ? new Date(t.completed_at).toLocaleString() : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

