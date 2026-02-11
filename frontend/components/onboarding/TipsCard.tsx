import { useEffect, useState } from 'react'
import type { OnboardingTips } from '@/lib/api'
import { getOnboardingTips, ApiError } from '@/lib/api'
import { ErrorDisplay } from '@/lib/error-utils'

export function TipsCard({ employeeId }: { employeeId: number }) {
  const [tips, setTips] = useState<OnboardingTips | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const t = await getOnboardingTips(employeeId)
      setTips(t)
    } catch (e: any) {
      setError(e instanceof ApiError ? e.errors : (e.message || 'Failed to load tips'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">Today’s Tips</h3>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <ErrorDisplay errors={error} className="mt-3" />

      {!tips && !loading ? (
        <div className="mt-3 text-sm text-gray-600">No tips available.</div>
      ) : (
        tips && (
          <div className="mt-3 space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="text-xs text-gray-600 font-semibold">Motivation</div>
              <div className="text-sm text-gray-800 mt-1">{tips.motivation}</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">Tips</div>
              <ul className="space-y-2">
                {tips.tips.map((t, i) => (
                  <li key={i} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">Suggested next actions</div>
              <ul className="space-y-2">
                {tips.next_actions.map((a, i) => (
                  <li key={i} className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded-lg p-3">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      )}
    </div>
  )
}

