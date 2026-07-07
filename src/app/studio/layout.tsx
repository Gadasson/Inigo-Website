import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { StudioAccessProvider } from '@/contexts/StudioAccessContext';
import { StudioIntlProvider } from '@/contexts/StudioIntlContext';
import StudioGate from '@/components/studio/StudioGate';
import './studio.css';

export const metadata: Metadata = {
  title: 'Studio — Inigo',
  description: 'Inigo Studio',
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudioIntlProvider>
      <AuthProvider>
        <StudioAccessProvider>
          <StudioGate>{children}</StudioGate>
        </StudioAccessProvider>
      </AuthProvider>
    </StudioIntlProvider>
  );
}
