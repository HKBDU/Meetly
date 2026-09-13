import { Star } from 'lucide-react';
import type { CellDetails, Participant } from '../types';

export function AvailabilityDetails({
  details,
  participants,
  keyParticipant,
}: {
  details: CellDetails | null;
  participants: Participant[];
  keyParticipant: string | null;
}) {
  if (!details) {
    return (
      <aside
        id="availability-details"
        className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500"
      >
        Hover, tap, or use Tab to focus a slot and see who is available.
      </aside>
    );
  }
  const available = participants.filter((person) =>
    details.availableNames.includes(person.username),
  );
  const busy = participants.filter((person) => !details.availableNames.includes(person.username));

  return (
    <aside
      id="availability-details"
      aria-label="Participant availability"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <p className="text-sm font-semibold">
        {details.dayLabel} · {details.startTime} – {details.endTime}
      </p>
      <div className="mt-4 max-h-80 space-y-4 overflow-y-auto">
        <section>
          <h3 className="text-sm font-semibold text-emerald-700">
            Available · {available.length}/{participants.length}
          </h3>
          <ul className="mt-2 space-y-2 text-sm">
            {available.map((person) => (
              <li key={person.username} className="flex items-center gap-2">
                {person.username}
                {person.username === keyParticipant && (
                  <Star
                    size={14}
                    className="fill-amber-300 text-amber-500"
                    aria-label="Key Participant"
                  />
                )}
              </li>
            ))}
          </ul>
          {available.length === 0 && <p className="mt-2 text-sm text-slate-500">None.</p>}
        </section>
        <section className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-500">
            Unavailable · {busy.length}/{participants.length}
          </h3>
          <ul className="mt-2 space-y-2 text-sm">
            {busy.map((person) => (
              <li key={person.username} className="flex items-center gap-2">
                {person.username}
                {person.username === keyParticipant && (
                  <Star
                    size={14}
                    className="fill-amber-300 text-amber-500"
                    aria-label="Key Participant"
                  />
                )}
              </li>
            ))}
          </ul>
          {busy.length === 0 && <p className="mt-2 text-sm text-slate-500">None.</p>}
        </section>
      </div>
    </aside>
  );
}
