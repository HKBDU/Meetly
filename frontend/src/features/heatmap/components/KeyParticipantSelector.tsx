import { Star } from 'lucide-react';
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
  return (
    <fieldset disabled={disabled} className="mb-7">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Key Participant
      </legend>
      <div className="flex flex-wrap gap-2">
        {participants.map((person) => {
          const active = selected === person.username;
          return (
            <button
              key={person.username}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : person.username)}
              className={`relative min-h-20 min-w-24 rounded-xl border px-4 py-4 text-sm font-semibold disabled:opacity-50 ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
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
      <p className="mt-2 text-xs text-slate-500">
        Select one participant, or click again to clear your selection.
      </p>
    </fieldset>
  );
}
