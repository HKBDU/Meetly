import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr';
import { env } from './env';

export function createSignalRConnection(accessToken: string): HubConnection {
  if (!accessToken) throw new Error('An event access token is required for realtime updates.');

  return new HubConnectionBuilder()
    .withUrl(env.signalRHubUrl, {
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
    .build();
}
