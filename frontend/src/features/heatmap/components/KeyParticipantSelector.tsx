import { useState } from 'react';
import { Search, Star } from 'lucide-react';
import type { Participant } from '../types';

export function KeyParticipantSelector({
  participants,
  selected,
  disabled,
  onChange,
}: {
  participants: Participant[];
  selected: string | null;
  disabled: boolean;
  onChange: (name: string | null) => void;
}) {
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const matchingParticipants = normalizedSearch
    ? participants.filter((person) =>
        person.username.toLocaleLowerCase().includes(normalizedSearch),
      )
    : selected
      ? [
          ...participants.filter((person) => person.username === selected),
          ...participants.filter((person) => person.username !== selected),
        ]
      : participants;

  return (
    <fieldset disabled={disabled} className="mb-7">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Key Participant
      </legend>
      <label className="mb-3 flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
        <Search size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
        <span className="sr-only">Search participants</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search participant..."
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </label>
      <div className={`flex gap-2 ${normalizedSearch ? 'flex-wrap' : 'flex-nowrap overflow-hidden'}`}>
        {matchingParticipants.map((person) => {
          const active = selected === person.username;
          return (
            <button
              key={person.username}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : person.username)}
              className={`relative min-h-20 min-w-24 shrink-0 rounded-xl border px-4 py-4 text-sm font-semibold disabled:opacity-50 ${active ? 'border-emerald-600 bg-emerald-100 text-emerald-950 ring-1 ring-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300'}`}
            >
              <Star
                size={15}
                aria-hidden="true"
                className={`absolute right-2 top-2 ${active ? 'fill-amber-300 text-amber-500' : 'text-slate-400'}`}
              />
              {person.username}
            </button>
          );
        })}
      </div>
      {normalizedSearch && matchingParticipants.length === 0 && (
        <p className="text-sm text-slate-500">No participant found.</p>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Select one participant, or click again to clear your selection.
      </p>
    </fieldset>
  );
}
