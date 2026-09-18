import { Star } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, ScrollArea, Separator } from '@/shared/components/ui';
import type { AvailabilityDetailsProps } from '../types';

export function AvailabilityDetails({
  details,
  participants,
  keyParticipant,
  onMouseEnter,
  onMouseLeave,
}: AvailabilityDetailsProps) {
  if (!details) return null;
  const available = participants.filter((person) =>
    details.availableNames.includes(person.username),
  );
  const busy = participants.filter((person) => !details.availableNames.includes(person.username));

  return (
    <Card
      id="availability-details"
      aria-label="Participant availability"
      className="min-w-0 shadow-sm"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <CardHeader className="px-5 py-4">
        <p className="text-sm font-semibold">
          {details.dayLabel} · {details.startTime} – {details.endTime}
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <ScrollArea className="h-72 pr-3 lg:h-[min(24rem,55vh)]">
          <section aria-labelledby="available-participants-heading">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <span id="available-participants-heading">Available</span> · {available.length}/
              {participants.length}
            </Badge>
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
          <Separator className="my-4" />
          <section aria-labelledby="unavailable-participants-heading">
            <Badge variant="secondary" className="text-muted-foreground">
              <span id="unavailable-participants-heading">Unavailable</span> · {busy.length}/
              {participants.length}
            </Badge>
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
