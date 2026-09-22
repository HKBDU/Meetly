import { useState } from 'react';
import { Search, Star } from 'lucide-react';
import { Button, Input } from '@/shared/components/ui';
import { useDebounce } from 'use-debounce';
import type { KeyParticipantSelectorProps } from '../types';

export function KeyParticipantSelector({
  participants,
  selected,
  disabled,
  onChange,
}: KeyParticipantSelectorProps) {
  const [rawSearch, setRawSearch] = useState('');
  const [debouncedSearch] = useDebounce(rawSearch, 300);
  const normalizedSearch = debouncedSearch.trim().toLocaleLowerCase();
  const matchingParticipants = normalizedSearch
    ? participants.filter((person) =>
        person.username.toLocaleLowerCase().includes(normalizedSearch),
      )
    : participants;

  return (
    <section aria-labelledby="key-participant-heading" className="mb-7">
      <h2 id="key-participant-heading" className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Key Participant
      </h2>
      <div className="relative mb-3 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" aria-hidden="true" />
        <Input
          type="search"
          aria-label="Search participants"
          value={rawSearch}
          disabled={disabled}
          onChange={(event) => setRawSearch(event.target.value)}
          placeholder="Search participant..."
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2" aria-busy={rawSearch !== debouncedSearch}>
        {matchingParticipants.map((person) => {
          const active = selected === person.username;
          return (
            <Button
              key={person.username}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : person.username)}
              variant="outline"
              disabled={disabled}
              className={`relative h-auto min-h-20 min-w-24 shrink-0 rounded-xl px-4 py-4 ${active ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary hover:bg-primary/15' : 'border-border bg-muted/40 text-foreground hover:border-primary/40 hover:bg-muted'}`}
            >
              <Star
                size={15}
                aria-hidden="true"
                className={`absolute right-2 top-2 ${active ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
              />
              {person.username}
            </Button>
          );
        })}
      </div>
      {normalizedSearch && matchingParticipants.length === 0 && (
        <p className="text-sm text-slate-500">No participant found.</p>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Select one participant, or click again to clear your selection.
      </p>
    </section>
  );
}
