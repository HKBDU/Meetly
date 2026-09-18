function requiredUrl(name: string, value: string | undefined): string {
  const url = value?.trim().replace(/\/+$/, '');
  if (!url) throw new Error(`${name} is not configured.`);
  return url;
}

export const env = {
  apiBaseUrl: requiredUrl('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  signalRHubUrl: requiredUrl(
    'VITE_SIGNALR_HUB_URL',
    import.meta.env.VITE_SIGNALR_HUB_URL,
  ),
} as const;
