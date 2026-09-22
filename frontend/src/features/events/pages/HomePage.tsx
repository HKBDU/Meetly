import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { eventUi } from '@/shared/components/ui/styles'
import { cn } from '@/lib/utils'

export function HomePage() {
  const navigate = useNavigate()
  const [shortCode, setShortCode] = useState('')
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [joinError, setJoinError] = useState('')

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = shortCode.trim()
    if (!trimmed) {
      setJoinError('Please enter the Event ID.')
      return
    }
    navigate(`/e/${trimmed}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Button
          onClick={() => navigate('/create')}
          className={cn(eventUi.primaryButton, "h-12 px-6 text-base font-semibold min-w-[200px]")}
        >
          Create New Event
        </Button>

        <Button
          onClick={() => setIsJoinOpen(true)}
          variant="outline"
          className="h-12 px-6 text-base font-semibold border-[#6b7280] text-[#0b1c30] min-w-[200px]"
        >
          Join With ID
        </Button>
      </div>

      {/* Join with ID Modal */}
      {isJoinOpen && (
        <div className={eventUi.updateWarningBackdrop} role="presentation">
          <div className="w-[min(100%,420px)] rounded-2xl bg-white p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-[#0b1c30]">
                Join with ID
              </h3>
              <button
                onClick={() => {
                  setIsJoinOpen(false)
                  setJoinError('')
                }}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleJoin} className="space-y-4 pt-2">
              <div className={eventUi.field}>
                <label className={eventUi.label} htmlFor="shortCodeInput">
                  Event ID (Short Code)
                </label>
                <input
                  id="shortCodeInput"
                  type="text"
                  placeholder="Example: ABC123"
                  value={shortCode}
                  onChange={(e) => {
                    setShortCode(e.target.value)
                    setJoinError('')
                  }}
                  className={eventUi.input}
                  autoFocus
                />
                {joinError && <span className={eventUi.fieldError}>{joinError}</span>}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsJoinOpen(false)
                    setJoinError('')
                  }}
                  className="h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={cn(eventUi.primaryButton, "h-9 px-5 sm:min-w-0")}
                >
                  Join
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
