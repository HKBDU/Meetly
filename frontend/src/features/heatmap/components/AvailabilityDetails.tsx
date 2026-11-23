import { Star } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, ScrollArea, Separator } from '@/shared/components/ui';
import type { AvailabilityDetailsProps } from '../types';

export function AvailabilityDetails({
  details,
  participants,
  highlighted,
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
            <Badge variant="secondary" className="bg-brand-soft text-brand">
              <span id="available-participants-heading">Available</span> · {available.length}/
              {participants.length}
            </Badge>
            <ul className="mt-2 space-y-2 text-sm">
              {available.map((person) => (
                <li key={person.username} className="flex items-center gap-2">
                  {person.username}
                  {highlighted.includes(person.username) && (
                    <Star
                      size={14}
                      className="fill-highlight/60 text-highlight"
                      aria-label="Must include"
                    />
                  )}
                </li>
              ))}
            </ul>
            {available.length === 0 && <p className="mt-2 text-sm text-muted-foreground">None.</p>}
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
                  {highlighted.includes(person.username) && (
                    <Star
                      size={14}
                      className="fill-highlight/60 text-highlight"
                      aria-label="Must include"
                    />
                  )}
                </li>
              ))}
            </ul>
            {busy.length === 0 && <p className="mt-2 text-sm text-muted-foreground">None.</p>}
          </section>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
