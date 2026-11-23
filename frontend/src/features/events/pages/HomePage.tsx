import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'

export function HomePage() {
  const navigate = useNavigate()
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [shortCode, setShortCode] = useState('')
  const [joinError, setJoinError] = useState('')

  function handleJoin(event: React.FormEvent) {
    event.preventDefault()
    // ShortCode lưu chữ hoa; bỏ khoảng trắng người dùng dán kèm
    const code = shortCode.replace(/\s+/g, '').toUpperCase()
    if (!code) {
      setJoinError('Please enter the Event ID.')
      return
    }
    navigate(`/e/${encodeURIComponent(code)}`)
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 sm:flex-row">
      <Button size="lg" className="h-12 min-w-52 text-base" onClick={() => navigate('/create')}>
        Create New Event
      </Button>
      <Button size="lg" variant="outline" className="h-12 min-w-52 text-base" onClick={() => setIsJoinOpen(true)}>
        Join With ID
      </Button>

      <Dialog
        open={isJoinOpen}
        onOpenChange={(open) => {
          setIsJoinOpen(open)
          if (!open) setJoinError('')
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Join with ID</DialogTitle>
            <DialogDescription>Enter the event code you received from the host.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleJoin} noValidate>
            <div className="grid gap-2">
              <FieldLabel htmlFor="join-short-code">Event ID</FieldLabel>
              <Input
                id="join-short-code"
                placeholder="e.g. ABC123"
                autoComplete="off"
                autoFocus
                className="uppercase"
                value={shortCode}
                aria-invalid={Boolean(joinError)}
                onChange={(event) => {
                  setShortCode(event.target.value)
                  setJoinError('')
                }}
              />
              {joinError && <FieldError>{joinError}</FieldError>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsJoinOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Join</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
