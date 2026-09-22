import { useCallback, useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { AppBackground } from '@/shared/components/common';
import { HeatmapPage } from './HeatmapPage';
import { MeetlyFooter } from '../components/MeetlyFooter';
import {
  finalizeEvent,
  getSuggestions,
  updateEvent,
} from '../services';
import { loadHeatmapRouteData } from '../route-loader';
import type { HeatmapEvent } from '../types';

interface EventRouteContentProps {
  shortCode: string;
}

function EventRouteContent({ shortCode }: EventRouteContentProps) {
  const [event, setEvent] = useState<HeatmapEvent | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessToken, setAccessToken] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    let active = true;
    void loadHeatmapRouteData(shortCode)
      .then((routeData) => {
        if (!active) return;
        setEvent(routeData.event);
        setIsAdmin(routeData.isAdmin);
        setAccessToken(routeData.accessToken);
      })
      .catch((failure: unknown) => {
        if (!active) return;
        setEvent(null);
        setLoadError(
          failure instanceof Error ? failure.message : 'Unable to load this event.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [shortCode]);

  const loadSuggestions = useCallback(
    (params: Parameters<typeof getSuggestions>[1]) => getSuggestions(shortCode, params),
    [shortCode],
  );
  const finalize = useCallback(
    (slot: Parameters<typeof finalizeEvent>[1]) => finalizeEvent(shortCode, slot),
    [shortCode],
  );
  const update = useCallback(
    (payload: Parameters<typeof updateEvent>[1]) => updateEvent(shortCode, payload),
    [shortCode],
  );

  return (
    <HeatmapPage
      initialEvent={event}
      accessToken={accessToken}
      isAdmin={isAdmin}
      loading={loading}
      loadError={loadError}
      onSuggestions={isAdmin ? loadSuggestions : undefined}
      onFinalize={isAdmin ? finalize : undefined}
      onUpdateEvent={isAdmin ? update : undefined}
    />
  );
}

export default function HeatmapRoutePage() {
  const { shortCode = '' } = useParams();

  return (
    <AppBackground className="font-sans">
      <header className="border-b border-slate-200 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1376px] items-center gap-2 text-xl font-bold text-slate-900">
          <span className="rounded-lg bg-primary p-2 text-primary-foreground">
            <CalendarDays size={21} aria-hidden="true" />
          </span>
          Meetly
        </div>
      </header>
      <div className="flex-1">
        <EventRouteContent key={shortCode} shortCode={shortCode} />
      </div>
      <MeetlyFooter />
    </AppBackground>
  );
}
