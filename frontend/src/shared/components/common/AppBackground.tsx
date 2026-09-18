import type { ReactNode } from 'react';

interface AppBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function AppBackground({ children, className = '' }: AppBackgroundProps) {
  return (
    <div className={`app-event-background min-h-screen overflow-x-clip ${className}`}>
      <div className="flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
