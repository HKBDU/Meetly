import { CalendarDays } from 'lucide-react';
import { HeatmapPage } from './HeatmapPage';
import { MeetlyFooter } from '../components/MeetlyFooter';
import {
  finalizeMockEvent,
  getMockScenario,
  getMockSuggestions,
  updateMockEvent,
} from '../mock';


export default function HeatmapDemoPage() {
  const { event, isAdmin } = getMockScenario(new URLSearchParams(window.location.search));
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <header className="border-b border-slate-200 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1376px] items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <span className="rounded-lg bg-emerald-600 p-2 text-white">
              <CalendarDays size={21} aria-hidden="true" />
            </span>
            Meetly
          </span>
        </div>
      </header>
      <div className="flex-1">
        <HeatmapPage
          initialEvent={event}
          isAdmin={isAdmin}
          onSuggestions={(params) => getMockSuggestions(event, params)}
          onFinalize={(slot) => finalizeMockEvent(event, slot)}
          onUpdateEvent={updateMockEvent}
        />
      </div>
      <MeetlyFooter />
    </div>
  );
}
