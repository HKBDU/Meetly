import { AppRouterProvider } from './providers';
import { Toaster } from '@/shared/components/ui';

export default function App() {
  return (
    <>
      <AppRouterProvider />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </>
  );
}
