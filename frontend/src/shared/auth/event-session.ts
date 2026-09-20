const EVENT_SESSION_KEY = 'meetly-event-session';

export interface EventSession {
  shortCode: string;
  participantId: string;
  username: string;
  accessToken: string;
  expiresAt?: string;
}

function normalizeShortCode(shortCode: string): string {
  return shortCode.trim().toUpperCase();
}

function defaultStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function parseSession(value: string | null): EventSession | null {
  if (!value) return null;
  try {
    const session = JSON.parse(value) as Partial<EventSession>;
    if (
      typeof session.shortCode !== 'string' ||
      typeof session.participantId !== 'string' ||
      typeof session.username !== 'string' ||
      typeof session.accessToken !== 'string' ||
      !session.shortCode ||
      !session.participantId ||
      !session.username ||
      !session.accessToken ||
      (session.expiresAt !== undefined && typeof session.expiresAt !== 'string')
    ) {
      return null;
    }
    return {
      shortCode: normalizeShortCode(session.shortCode),
      participantId: session.participantId,
      username: session.username,
      accessToken: session.accessToken,
      ...(session.expiresAt ? { expiresAt: session.expiresAt } : {}),
    };
  } catch {
    return null;
  }
}

export function saveEventSession(
  session: EventSession,
  storage = defaultStorage(),
): void {
  storage?.setItem(EVENT_SESSION_KEY, JSON.stringify({
    ...session,
    shortCode: normalizeShortCode(session.shortCode),
  }));
}

export function getEventSession(
  shortCode: string,
  storage = defaultStorage(),
  now = Date.now(),
): EventSession | null {
  if (!storage) return null;
  const session = parseSession(storage.getItem(EVENT_SESSION_KEY));
  if (!session || session.shortCode !== normalizeShortCode(shortCode)) return null;
  if (!session.expiresAt) return session;
  const expiresAt = Date.parse(session.expiresAt);
  if (Number.isFinite(expiresAt) && expiresAt > now) return session;
  storage.removeItem(EVENT_SESSION_KEY);
  return null;
}

export function clearEventSession(
  shortCode: string,
  storage = defaultStorage(),
): void {
  if (!storage) return;
  const session = parseSession(storage.getItem(EVENT_SESSION_KEY));
  if (session?.shortCode === normalizeShortCode(shortCode)) {
    storage.removeItem(EVENT_SESSION_KEY);
  }
}
